require('dotenv').config();

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true } });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const port = Number(process.env.PORT || 3000);
const holdMinutes = Number(process.env.HOLD_MINUTES || 10);
const staticDirectory = path.join(__dirname, 'siegevif');

app.use(cors());
app.use(express.json());
app.use(express.static(staticDirectory));

function userIdFromRequest(request) {
  return Number(request.header('x-user-id') || 1);
}

function ticketCode() {
  return `SV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function releaseExpiredHolds(client, seanceId) {
  const result = await client.query(
    `UPDATE place_seance
     SET etat = 'libre', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL
     WHERE seance_id = $1 AND etat = 'retenue' AND retenue_expire_a <= NOW()
     RETURNING id, place_id`,
    [seanceId]
  );

  for (const place of result.rows) {
    io.to(`seance:${seanceId}`).emit('place:retenue_expiree', {
      placeSeanceId: place.id,
      placeId: place.place_id,
      seanceId
    });
  }
}

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ ok: true });
  } catch (_error) {
    response.status(503).json({ ok: false, error: 'Base de donnees indisponible' });
  }
});

app.get('/api/seances/:seanceId/plan', async (request, response, next) => {
  const seanceId = Number(request.params.seanceId);
  if (!Number.isInteger(seanceId) || seanceId < 1) {
    return response.status(400).json({ error: 'Identifiant de seance invalide' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await releaseExpiredHolds(client, seanceId);
    const result = await client.query(
      `SELECT ps.id AS place_seance_id, ps.place_id, ps.etat, ps.retenue_par_utilisateur_id,
              p.rangee, p.numero, p.type, s.id AS seance_id, s.date_heure,
              sa.nom AS salle_nom, f.titre, f.duree_minutes
       FROM place_seance ps
       JOIN place p ON p.id = ps.place_id AND p.salle_id = ps.salle_id
       JOIN seance s ON s.id = ps.seance_id AND s.salle_id = ps.salle_id
       JOIN salle sa ON sa.id = s.salle_id
       JOIN film f ON f.id = s.film_id
       WHERE ps.seance_id = $1
       ORDER BY p.rangee, p.numero`,
      [seanceId]
    );
    await client.query('COMMIT');
    if (result.rowCount === 0) {
      return response.status(404).json({ error: 'Seance introuvable ou sans places' });
    }
    response.json({ seance: result.rows[0], places: result.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

app.post('/api/seances/:seanceId/places/:placeId/retenir', async (request, response, next) => {
  const seanceId = Number(request.params.seanceId);
  const placeId = Number(request.params.placeId);
  const userId = userIdFromRequest(request);
  if (![seanceId, placeId, userId].every(Number.isInteger) || [seanceId, placeId, userId].some((value) => value < 1)) {
    return response.status(400).json({ error: 'Identifiant invalide' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await releaseExpiredHolds(client, seanceId);
    const result = await client.query(
      `SELECT ps.id, ps.place_id, ps.etat, ps.retenue_par_utilisateur_id, ps.retenue_expire_a,
              p.rangee, p.numero
       FROM place_seance ps
       JOIN place p ON p.id = ps.place_id AND p.salle_id = ps.salle_id
       WHERE ps.seance_id = $1 AND ps.place_id = $2
       FOR UPDATE`,
      [seanceId, placeId]
    );

    if (result.rowCount === 0) throw badRequest('Place introuvable pour cette seance');
    const place = result.rows[0];
    if (place.etat === 'vendue') throw badRequest('Cette place est deja vendue');
    if (place.etat === 'retenue' && place.retenue_par_utilisateur_id !== userId) {
      throw badRequest('Cette place est retenue par un autre utilisateur');
    }

    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);
    const updated = await client.query(
      `UPDATE place_seance
       SET etat = 'retenue', retenue_par_utilisateur_id = $1, retenue_expire_a = $2
       WHERE id = $3
       RETURNING id AS place_seance_id, place_id, etat, retenue_expire_a, $4::bigint AS seance_id`,
      [userId, expiresAt, place.id, seanceId]
    );
    await client.query('COMMIT');
    const payload = updated.rows[0];
    io.to(`seance:${seanceId}`).emit('place:etat_change', payload);
    response.status(201).json(payload);
  } catch (error) {
    await client.query('ROLLBACK');
    response.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Erreur serveur' });
  } finally {
    client.release();
  }
});

app.post('/api/reservations', async (request, response, next) => {
  const userId = userIdFromRequest(request);
  const seanceId = Number(request.body.seanceId);
  const placeIds = Array.isArray(request.body.placeIds) ? request.body.placeIds.map(Number) : [];
  if (!Number.isInteger(seanceId) || seanceId < 1 || !placeIds.length || placeIds.some((id) => !Number.isInteger(id) || id < 1)) {
    return response.status(400).json({ error: 'seanceId et placeIds sont requis' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT ps.id, ps.place_id, ps.etat, ps.retenue_par_utilisateur_id, ps.retenue_expire_a,
              p.rangee, p.numero
       FROM place_seance ps
       JOIN place p ON p.id = ps.place_id AND p.salle_id = ps.salle_id
       WHERE ps.seance_id = $1 AND ps.place_id = ANY($2::bigint[])
       FOR UPDATE`,
      [seanceId, placeIds]
    );

    if (locked.rowCount !== placeIds.length) throw badRequest('Une ou plusieurs places sont introuvables');
    const now = Date.now();
    const invalid = locked.rows.find((place) => place.etat !== 'retenue' || place.retenue_par_utilisateur_id !== userId || new Date(place.retenue_expire_a).getTime() <= now);
    if (invalid) throw badRequest(`La place ${invalid.rangee}${invalid.numero} n'est plus retenue par vous`);

    const amount = locked.rows.reduce((total, place) => total + (['A', 'B'].includes(place.rangee) ? 45 : 22), 0);
    const reservation = await client.query(
      `INSERT INTO reservation (utilisateur_id, seance_id, code_billet, montant_total)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code_billet, montant_total, creee_le`,
      [userId, seanceId, ticketCode(), amount]
    );
    const reservationRow = reservation.rows[0];
    await client.query(
      `INSERT INTO reservation_place (reservation_id, place_seance_id, seance_id)
       SELECT $1, id, $2 FROM place_seance WHERE id = ANY($3::bigint[])`,
      [reservationRow.id, seanceId, locked.rows.map((place) => place.id)]
    );
    await client.query(
      `UPDATE place_seance
       SET etat = 'vendue', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL
       WHERE id = ANY($1::bigint[])`,
      [locked.rows.map((place) => place.id)]
    );
    await client.query('COMMIT');

    for (const place of locked.rows) {
      io.to(`seance:${seanceId}`).emit('place:etat_change', {
        placeSeanceId: place.id,
        placeId: place.place_id,
        seanceId,
        etat: 'vendue'
      });
    }
    response.status(201).json({ ...reservationRow, places: locked.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    response.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Erreur serveur' });
  } finally {
    client.release();
  }
});

io.on('connection', (socket) => {
  socket.on('seance:rejoindre', (seanceId) => {
    const numericId = Number(seanceId);
    if (Number.isInteger(numericId) && numericId > 0) socket.join(`seance:${numericId}`);
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Erreur serveur' });
});

setInterval(async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `UPDATE place_seance
       SET etat = 'libre', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL
       WHERE etat = 'retenue' AND retenue_expire_a <= NOW()
       RETURNING id, place_id, seance_id`
    );
    for (const place of result.rows) {
      io.to(`seance:${place.seance_id}`).emit('place:retenue_expiree', {
        placeSeanceId: place.id,
        placeId: place.place_id,
        seanceId: place.seance_id
      });
    }
  } catch (error) {
    console.error('Nettoyage des retenues impossible:', error.message);
  } finally {
    if (client) client.release();
  }
}, 30_000).unref();

app.get('*', (_request, response) => {
  response.sendFile(path.join(staticDirectory, 'reservation.html'));
});

httpServer.listen(port, () => {
  console.log(`SiegeVif disponible sur http://localhost:${port}/reservation.html`);
});
