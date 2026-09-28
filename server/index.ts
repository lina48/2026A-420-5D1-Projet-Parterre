import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { Server } from 'socket.io';

const { Pool } = pg;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' } });
const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://parterre:parterre@localhost:5432/parterre' });
const port = Number(process.env.PORT ?? 4000);
const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const here = path.dirname(fileURLToPath(import.meta.url));
type User = { id: number; nom: string; courriel: string; role: 'spectateur' | 'gestionnaire' };
type AuthRequest = Request & { user?: User };

app.use(express.json());

function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ error: 'Connectez-vous pour continuer.' });
  try {
    request.user = jwt.verify(token, secret) as User;
    next();
  } catch {
    response.status(401).json({ error: 'Votre session a expiré. Reconnectez-vous.' });
  }
}

function requireManager(request: AuthRequest, response: Response, next: NextFunction) {
  if (request.user?.role !== 'gestionnaire') return response.status(403).json({ error: 'Accès réservé au personnel.' });
  next();
}

function asyncRoute(handler: (request: AuthRequest, response: Response) => Promise<unknown>) {
  return (request: AuthRequest, response: Response, next: NextFunction) => handler(request, response).catch(next);
}

async function seed() {
  const { rows: films } = await pool.query('SELECT id FROM film LIMIT 1');
  if (films.length) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const room = await client.query("INSERT INTO salle (nom, capacite) VALUES ('Salle Lumière', 72) RETURNING id");
    for (const row of 'ABCDEFGH') for (let number = 1; number <= 9; number += 1) {
      await client.query('INSERT INTO place (salle_id, rangee, numero, type) VALUES ($1, $2, $3, $4)', [room.rows[0].id, row, number, row === 'H' && number <= 2 ? 'accessible' : 'standard']);
    }
    await client.query('INSERT INTO utilisateur (nom, courriel, mot_de_passe_hash, role) VALUES ($1, $2, $3, $4)', ['Équipe Parterre', 'gestion@parterre.local', await bcrypt.hash('Parterre2026!', 12), 'gestionnaire']);
    const movieRows = await client.query(
      `INSERT INTO film (titre, duree_minutes, genre, image_url, description) VALUES
       ('Les heures bleues', 118, 'Drame', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85', 'Une nuit suffit parfois à changer le cours d’une vie.'),
       ('Le dernier été', 104, 'Comédie', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=85', 'Une parenthèse lumineuse au bord de la mer.'),
       ('Mondes parallèles', 132, 'Science-fiction', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=85', 'À la frontière du réel, une autre histoire commence.')
       RETURNING id`
    );
    const filmIds = movieRows.rows.map((row) => row.id as number);
    const schedule: Array<[number, number]> = [[0, 18], [1, 20], [2, 21], [0, 22]];
    for (const [index, hour] of schedule) {
      const starts = new Date();
      if (index === 3 || hour <= starts.getHours()) starts.setDate(starts.getDate() + 1);
      starts.setHours(hour, 0, 0, 0);
      const show = await client.query('INSERT INTO seance (salle_id, film_id, date_heure) VALUES ($1, $2, $3) RETURNING id', [room.rows[0].id, filmIds[index], starts]);
      const showId = show.rows[0].id;
      await client.query(
        `INSERT INTO place_seance (place_id, salle_id, seance_id)
         SELECT id, salle_id, $1 FROM place WHERE salle_id = $2`,
        [showId, room.rows[0].id]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

app.post('/api/auth/inscription', asyncRoute(async (request, response) => {
  const { nom, courriel, motDePasse } = request.body;
  if (!nom?.trim() || !courriel?.trim() || !motDePasse || motDePasse.length < 8) return response.status(400).json({ error: 'Nom, courriel et mot de passe de 8 caractères minimum requis.' });
  const hash = await bcrypt.hash(motDePasse, 12);
  const result = await pool.query('INSERT INTO utilisateur (nom, courriel, mot_de_passe_hash) VALUES ($1, $2, $3) RETURNING id, nom, courriel, role', [nom.trim(), courriel.trim().toLowerCase(), hash]);
  const user = result.rows[0] as User;
  response.status(201).json({ token: jwt.sign(user, secret, { expiresIn: '7d' }), user });
}));

app.post('/api/auth/connexion', asyncRoute(async (request, response) => {
  const { courriel, motDePasse } = request.body;
  const result = await pool.query('SELECT id, nom, courriel, role, mot_de_passe_hash FROM utilisateur WHERE courriel = $1', [String(courriel ?? '').trim().toLowerCase()]);
  if (!result.rowCount || !(await bcrypt.compare(motDePasse ?? '', result.rows[0].mot_de_passe_hash))) return response.status(401).json({ error: 'Courriel ou mot de passe invalide.' });
  const { mot_de_passe_hash: _, ...user } = result.rows[0] as User & { mot_de_passe_hash: string };
  response.json({ token: jwt.sign(user, secret, { expiresIn: '7d' }), user });
}));

app.get('/api/auth/moi', requireAuth, (request: AuthRequest, response) => response.json({ user: request.user }));

app.get('/api/seances', asyncRoute(async (_request, response) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.date_heure, s.statut, sa.nom AS salle, f.titre, f.genre, f.duree_minutes, f.image_url, f.description,
       COUNT(ps.id)::int AS capacite,
       COUNT(ps.id) FILTER (WHERE ps.etat = 'libre')::int AS places_disponibles
     FROM seance s JOIN salle sa ON sa.id = s.salle_id JOIN film f ON f.id = s.film_id
     JOIN place_seance ps ON ps.seance_id = s.id
     WHERE s.date_heure > NOW() AND s.statut = 'ouverte'
     GROUP BY s.id, sa.nom, f.id ORDER BY s.date_heure`
  );
  response.json({ seances: rows });
}));

app.get('/api/seances/:id/plan', asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT ps.id, p.rangee, p.numero, p.type, ps.etat, (ps.retenue_expire_a > NOW()) AS retenue_active
     FROM place_seance ps JOIN place p ON p.id = ps.place_id WHERE ps.seance_id = $1 ORDER BY p.rangee, p.numero`,
    [request.params.id]
  );
  if (!rows.length) return response.status(404).json({ error: 'Séance introuvable.' });
  response.json({ places: rows });
}));

app.post('/api/seances/:id/places/:placeId/retenir', requireAuth, asyncRoute(async (request, response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM place_seance WHERE seance_id = $1 AND id = $2 FOR UPDATE', [request.params.id, request.params.placeId]);
    const seat = rows[0];
    if (!seat) { await client.query('ROLLBACK'); return response.status(404).json({ error: 'Place introuvable.' }); }
    if (seat.etat === 'vendue' || (seat.etat === 'retenue' && seat.retenue_expire_a > new Date() && seat.retenue_par_utilisateur_id !== request.user!.id)) {
      await client.query('ROLLBACK');
      return response.status(409).json({ error: 'Cette place vient d’être prise. Choisissez-en une autre.' });
    }
    const expires = new Date(Date.now() + 8 * 60 * 1000);
    await client.query("UPDATE place_seance SET etat = 'retenue', retenue_par_utilisateur_id = $1, retenue_expire_a = $2 WHERE id = $3", [request.user!.id, expires, seat.id]);
    await client.query('COMMIT');
    const change = { id: seat.id, etat: 'retenue', expireA: expires.toISOString() };
    io.to(`seance:${request.params.id}`).emit('place:etat_change', change);
    response.json({ place: change });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));

app.post('/api/reservations', requireAuth, asyncRoute(async (request, response) => {
  const { seanceId, placeIds } = request.body as { seanceId?: number; placeIds?: number[] };
  const ids = [...new Set(placeIds ?? [])];
  if (!seanceId || !ids.length || ids.length > 8) return response.status(400).json({ error: 'Sélectionnez de 1 à 8 places.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: seats } = await client.query('SELECT * FROM place_seance WHERE seance_id = $1 AND id = ANY($2::bigint[]) ORDER BY id FOR UPDATE', [seanceId, ids]);
    if (seats.length !== ids.length || seats.some((seat) => seat.etat !== 'retenue' || seat.retenue_par_utilisateur_id !== request.user!.id || seat.retenue_expire_a <= new Date())) {
      await client.query('ROLLBACK');
      return response.status(409).json({ error: 'Une ou plusieurs rétentions ont expiré. Sélectionnez vos places à nouveau.' });
    }
    const code = `PT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const booking = await client.query('INSERT INTO reservation (utilisateur_id, seance_id, code_billet, montant_total) VALUES ($1, $2, $3, $4) RETURNING id, code_billet, montant_total, creee_le', [request.user!.id, seanceId, code, ids.length * 14.5]);
    const reservation = booking.rows[0];
    for (const seat of seats) await client.query('INSERT INTO reservation_place (reservation_id, place_seance_id, seance_id) VALUES ($1, $2, $3)', [reservation.id, seat.id, seanceId]);
    await client.query("UPDATE place_seance SET etat = 'vendue', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL WHERE id = ANY($1::bigint[])", [ids]);
    await client.query('COMMIT');
    ids.forEach((id) => io.to(`seance:${seanceId}`).emit('place:etat_change', { id, etat: 'vendue' }));
    response.status(201).json({ reservation: { ...reservation, places: seats.map(({ id, rangee, numero }) => ({ id, rangee, numero })) } });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));

app.get('/api/reservations', requireAuth, asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.code_billet, r.montant_total, r.creee_le, r.statut, s.date_heure, f.titre, f.image_url,
      json_agg(json_build_object('rangee', p.rangee, 'numero', p.numero) ORDER BY p.rangee, p.numero) AS places
     FROM reservation r JOIN seance s ON s.id = r.seance_id JOIN film f ON f.id = s.film_id
     JOIN reservation_place rp ON rp.reservation_id = r.id JOIN place_seance ps ON ps.id = rp.place_seance_id
     JOIN place p ON p.id = ps.place_id WHERE r.utilisateur_id = $1
     GROUP BY r.id, s.date_heure, f.titre, f.image_url ORDER BY r.creee_le DESC`,
    [request.user!.id]
  );
  response.json({ reservations: rows });
}));

app.delete('/api/reservations/:id', requireAuth, asyncRoute(async (request, response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT r.*, s.date_heure FROM reservation r JOIN seance s ON s.id = r.seance_id WHERE r.id = $1 AND r.utilisateur_id = $2 FOR UPDATE OF r', [request.params.id, request.user!.id]);
    if (!rows.length || rows[0].statut !== 'confirmee' || rows[0].date_heure <= new Date()) { await client.query('ROLLBACK'); return response.status(404).json({ error: 'Réservation introuvable ou non annulable.' }); }
    const { rows: seats } = await client.query('SELECT place_seance_id FROM reservation_place WHERE reservation_id = $1 AND active = TRUE', [request.params.id]);
    await client.query("UPDATE reservation SET statut = 'annulee' WHERE id = $1", [request.params.id]);
    await client.query('UPDATE reservation_place SET active = FALSE WHERE reservation_id = $1', [request.params.id]);
    await client.query("UPDATE place_seance SET etat = 'libre' WHERE id = ANY($1::bigint[])", [seats.map((seat) => seat.place_seance_id)]);
    await client.query('COMMIT');
    seats.forEach(({ place_seance_id }) => io.to(`seance:${rows[0].seance_id}`).emit('place:etat_change', { id: place_seance_id, etat: 'libre' }));
    response.json({ success: true });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));

app.post('/api/seances', requireAuth, requireManager, asyncRoute(async (request, response) => {
  const { titre, genre, dureeMinutes, dateHeure } = request.body;
  const starts = new Date(dateHeure);
  if (!titre?.trim() || !Number.isFinite(starts.getTime())) return response.status(400).json({ error: 'Titre et date de séance valides requis.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const film = await client.query('INSERT INTO film (titre, duree_minutes, genre) VALUES ($1, $2, $3) RETURNING id', [titre.trim(), Number(dureeMinutes) || 110, genre ?? 'Cinéma']);
    const room = await client.query("INSERT INTO salle (nom, capacite) VALUES ('Salle Lumière', 72) RETURNING id");
    const show = await client.query('INSERT INTO seance (salle_id, film_id, date_heure) VALUES ($1, $2, $3) RETURNING id', [room.rows[0].id, film.rows[0].id, starts]);
    for (const row of 'ABCDEFGH') for (let number = 1; number <= 9; number += 1) {
      const seat = await client.query('INSERT INTO place (salle_id, rangee, numero, type) VALUES ($1, $2, $3, $4) RETURNING id', [room.rows[0].id, row, number, row === 'H' && number <= 2 ? 'accessible' : 'standard']);
      await client.query('INSERT INTO place_seance (place_id, salle_id, seance_id) VALUES ($1, $2, $3)', [seat.rows[0].id, room.rows[0].id, show.rows[0].id]);
    }
    await client.query('COMMIT');
    response.status(201).json({ id: show.rows[0].id });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}));

io.on('connection', (socket) => {
  socket.on('seance:rejoindre', (id: string | number) => socket.join(`seance:${id}`));
  socket.on('seance:quitter', (id: string | number) => socket.leave(`seance:${id}`));
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const pgError = error as { code?: string; message?: string };
  if (pgError.code === '23505') return response.status(409).json({ error: 'Cette information existe déjà.' });
  console.error(error);
  response.status(500).json({ error: 'Une erreur serveur est survenue.' });
});

async function start() {
  const sql = await readFile(path.resolve(here, '../database/init.sql'), 'utf8');
  await pool.query(sql);
  await seed();
  setInterval(async () => {
    try {
      const { rows } = await pool.query(
        `UPDATE place_seance SET etat = 'libre', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL
         WHERE etat = 'retenue' AND retenue_expire_a <= NOW() RETURNING id, seance_id`
      );
      rows.forEach((seat) => {
        io.to(`seance:${seat.seance_id}`).emit('place:etat_change', { id: seat.id, etat: 'libre' });
        io.to(`seance:${seat.seance_id}`).emit('place:retenue_expiree', { id: seat.id });
      });
    } catch (error) { console.error('Impossible de libérer les places expirées.', error); }
  }, 15000).unref();
  if (process.env.NODE_ENV === 'production') {
    const clientBuild = path.resolve(here, '../dist');
    app.use(express.static(clientBuild));
    app.get('*', (_request, response) => response.sendFile(path.join(clientBuild, 'index.html')));
  }
  httpServer.listen(port, () => console.log(`Parterre API prête sur http://localhost:${port}`));
}

start().catch((error) => { console.error('Démarrage impossible. Vérifiez PostgreSQL et DATABASE_URL.', error); process.exit(1); });