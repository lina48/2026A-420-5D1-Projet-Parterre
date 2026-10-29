import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type AddressInfo, type Server } from 'node:net';
import { io as ouvrirSocket, type Socket } from 'socket.io-client';
import { startServer, courrielUnique, requete } from './helpers.js';

type Serveur = Awaited<ReturnType<typeof startServer>>;
type Courrier = { destinataire: string; contenu: string };

let serveur: Serveur;
let seanceId: number;
let placesLibres: number[];
let dateOriginale: Date;
const placesUtilisees = new Set<number>();
const courriers: Courrier[] = [];
let smtp: Server;

/** Faux serveur SMTP : il garde les courriels reçus et n'envoie rien à l'extérieur. */
function demarrerFauxSmtp(): Promise<Server> {
  const serveurSmtp = createServer((connexion) => {
    let destinataire = '';
    let contenu = '';
    let enDonnees = false;
    connexion.setEncoding('utf8');
    connexion.write('220 faux-smtp ESMTP\r\n');
    connexion.on('data', (morceau: string) => {
      if (enDonnees) {
        contenu += morceau;
        if (contenu.endsWith('\r\n.\r\n')) {
          enDonnees = false;
          courriers.push({ destinataire, contenu });
          contenu = '';
          connexion.write('250 OK\r\n');
        }
        return;
      }
      for (const ligne of morceau.split('\r\n').filter(Boolean)) {
        const commande = ligne.toUpperCase();
        if (commande.startsWith('EHLO') || commande.startsWith('HELO')) connexion.write('250 faux-smtp\r\n');
        else if (commande.startsWith('MAIL FROM')) connexion.write('250 OK\r\n');
        else if (commande.startsWith('RCPT TO')) {
          destinataire = ligne.slice(ligne.indexOf('<') + 1, ligne.indexOf('>')).toLowerCase();
          connexion.write('250 OK\r\n');
        } else if (commande === 'DATA') {
          enDonnees = true;
          connexion.write('354 Fin avec <CRLF>.<CRLF>\r\n');
        } else if (commande === 'QUIT') connexion.end('221 Au revoir\r\n');
        else connexion.write('250 OK\r\n');
      }
    });
    connexion.on('error', () => undefined);
  });
  return new Promise((resolve) => serveurSmtp.listen(0, '127.0.0.1', () => resolve(serveurSmtp)));
}

function portLibre(): Promise<number> {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

async function creerCompte() {
  const courriel = courrielUnique();
  const motDePasse = 'motdepasse-test-1';
  await serveur.request('POST', '/api/auth/inscription', { nom: 'Spectateur Test', courriel, motDePasse });
  const { donnees } = await serveur.request('POST', '/api/auth/connexion', { courriel, motDePasse });
  return { courriel, jeton: donnees.token as string };
}

/** Prend des places libres distinctes pour chaque test afin qu'ils restent indépendants. */
function prendrePlaces(nombre: number) {
  const ids = placesLibres.splice(0, nombre);
  assert.equal(ids.length, nombre, 'Pas assez de places libres dans la séance de test.');
  ids.forEach((id) => placesUtilisees.add(id));
  return ids;
}

async function retenir(jeton: string, placeId: number) {
  return serveur.request('POST', `/api/seances/${seanceId}/places/${placeId}/retenir`, undefined, jeton);
}

async function reserver(jeton: string, placeIds: number[]) {
  return serveur.request('POST', '/api/reservations', { seanceId, placeIds }, jeton);
}

async function etatDeLaPlace(placeId: number) {
  const { donnees } = await serveur.request('GET', `/api/seances/${seanceId}/plan`);
  return donnees.places.find((place: any) => Number(place.id) === placeId).etat as string;
}

async function attendreCourrier(destinataire: string) {
  for (let i = 0; i < 40; i += 1) {
    const courrier = courriers.find((c) => c.destinataire === destinataire.toLowerCase());
    if (courrier) return courrier;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return undefined;
}

function ecouter(socket: Socket, evenement: string, delaiMs = 3000) {
  return new Promise<any>((resolve) => {
    const minuterie = setTimeout(() => resolve(undefined), delaiMs);
    socket.once(evenement, (donnees) => {
      clearTimeout(minuterie);
      resolve(donnees);
    });
  });
}

async function connecterSocket(id: number | string) {
  const socket = ouvrirSocket(serveur.url, { transports: ['websocket'], forceNew: true });
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', reject);
  });
  socket.emit('seance:rejoindre', id);
  // Le serveur traite l'adhésion à la salle de façon asynchrone par rapport à notre émission.
  await new Promise((resolve) => setTimeout(resolve, 200));
  return socket;
}

before(async () => {
  smtp = await demarrerFauxSmtp();
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String((smtp.address() as AddressInfo).port);
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_FROM = 'billets@parterre.test';
  process.env.SMTP_USER = '';
  process.env.SMTP_PASSWORD = '';
  serveur = await startServer();

  const { donnees: liste } = await serveur.request('GET', '/api/seances');
  seanceId = Number(liste.seances[0].id);
  const { donnees: plan } = await serveur.request('GET', `/api/seances/${seanceId}/plan`);
  placesLibres = plan.places.filter((place: any) => place.etat === 'libre').map((place: any) => Number(place.id));
  const [seance] = await requete('SELECT date_heure FROM seance WHERE id = $1', [seanceId]);
  dateOriginale = seance.date_heure;
});

after(async () => {
  // La base de test persiste : on libère les places et on annule les réservations créées ici.
  const ids = [...placesUtilisees];
  if (ids.length) {
    await requete(
      "UPDATE reservation SET statut = 'annulee' WHERE id IN (SELECT reservation_id FROM reservation_place WHERE place_seance_id = ANY($1::bigint[]))",
      [ids]
    );
    await requete('UPDATE reservation_place SET active = FALSE WHERE place_seance_id = ANY($1::bigint[])', [ids]);
    await requete(
      "UPDATE place_seance SET etat = 'libre', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL WHERE id = ANY($1::bigint[])",
      [ids]
    );
  }
  await requete('UPDATE seance SET date_heure = $1 WHERE id = $2', [dateOriginale, seanceId]);
  await serveur.close();
  await new Promise((resolve) => smtp.close(resolve));
});

test('réserver sans rétention préalable : 409 et la place reste libre', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);

  const { status } = await reserver(jeton, [placeId]);

  assert.equal(status, 409);
  assert.equal(await etatDeLaPlace(placeId), 'libre');
});

test('retenir puis réserver : 201, place vendue et code de billet', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);

  assert.equal((await retenir(jeton, placeId)).status, 200);
  const { status, donnees } = await reserver(jeton, [placeId]);

  assert.equal(status, 201);
  assert.match(donnees.reservation.code_billet, /^PT-[A-F0-9]{8}$/);
  assert.equal(await etatDeLaPlace(placeId), 'vendue');
});

test('une place retenue par un autre spectateur ne peut pas être retenue ni réservée : 409', async () => {
  const premier = await creerCompte();
  const second = await creerCompte();
  const [placeId] = prendrePlaces(1);

  assert.equal((await retenir(premier.jeton, placeId)).status, 200);

  assert.equal((await retenir(second.jeton, placeId)).status, 409);
  assert.equal((await reserver(second.jeton, [placeId])).status, 409);
  assert.equal(await etatDeLaPlace(placeId), 'retenue');
});

test('une place déjà vendue ne peut plus être retenue : 409', async () => {
  const premier = await creerCompte();
  const second = await creerCompte();
  const [placeId] = prendrePlaces(1);
  await retenir(premier.jeton, placeId);
  await reserver(premier.jeton, [placeId]);

  const { status } = await retenir(second.jeton, placeId);

  assert.equal(status, 409);
});

test('deux spectateurs retiennent la même place en même temps : un seul gagne', async () => {
  const premier = await creerCompte();
  const second = await creerCompte();
  const [placeId] = prendrePlaces(1);

  const resultats = await Promise.all([retenir(premier.jeton, placeId), retenir(second.jeton, placeId)]);

  assert.deepEqual(resultats.map((r) => r.status).sort(), [200, 409]);
});

test('annuler avant la séance : 200, places libérées et réservation annulée', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);
  await retenir(jeton, placeId);
  const { donnees } = await reserver(jeton, [placeId]);

  const { status } = await serveur.request('DELETE', `/api/reservations/${donnees.reservation.id}`, undefined, jeton);

  assert.equal(status, 200);
  assert.equal(await etatDeLaPlace(placeId), 'libre');
  const { donnees: liste } = await serveur.request('GET', '/api/reservations', undefined, jeton);
  assert.equal(liste.reservations.find((r: any) => r.id === donnees.reservation.id).statut, 'annulee');
});

test('annuler deux fois la même réservation : 409', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);
  await retenir(jeton, placeId);
  const { donnees } = await reserver(jeton, [placeId]);
  await serveur.request('DELETE', `/api/reservations/${donnees.reservation.id}`, undefined, jeton);

  const { status } = await serveur.request('DELETE', `/api/reservations/${donnees.reservation.id}`, undefined, jeton);

  assert.equal(status, 409);
});

test('annuler la réservation d’un autre spectateur : 404 et la place reste vendue', async () => {
  const proprietaire = await creerCompte();
  const intrus = await creerCompte();
  const [placeId] = prendrePlaces(1);
  await retenir(proprietaire.jeton, placeId);
  const { donnees } = await reserver(proprietaire.jeton, [placeId]);

  const { status } = await serveur.request('DELETE', `/api/reservations/${donnees.reservation.id}`, undefined, intrus.jeton);

  assert.equal(status, 404);
  assert.equal(await etatDeLaPlace(placeId), 'vendue');
});

test('annuler après le début de la séance : 409 et la place reste vendue', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);
  await retenir(jeton, placeId);
  const { donnees } = await reserver(jeton, [placeId]);
  await requete("UPDATE seance SET date_heure = NOW() - INTERVAL '1 hour' WHERE id = $1", [seanceId]);

  try {
    const { status } = await serveur.request('DELETE', `/api/reservations/${donnees.reservation.id}`, undefined, jeton);
    assert.equal(status, 409);
  } finally {
    await requete('UPDATE seance SET date_heure = $1 WHERE id = $2', [dateOriginale, seanceId]);
  }
  assert.equal(await etatDeLaPlace(placeId), 'vendue');
});

test('billet envoyé par courriel après la confirmation, avec le code et les places', async () => {
  const { courriel, jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);
  await retenir(jeton, placeId);

  const { status, donnees } = await reserver(jeton, [placeId]);
  const courrier = await attendreCourrier(courriel);

  assert.equal(status, 201);
  assert.equal(donnees.courrielEnvoye, true);
  assert.ok(courrier, 'Aucun courriel reçu par le faux serveur SMTP.');
  assert.ok(courrier.contenu.includes(donnees.reservation.code_billet));
  assert.match(courrier.contenu, /Subject: .*billet/i);
});

test('aucun courriel n’est envoyé quand la réservation échoue', async () => {
  const { courriel, jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);

  const { status } = await reserver(jeton, [placeId]);
  await new Promise((resolve) => setTimeout(resolve, 500));

  assert.equal(status, 409);
  assert.equal(courriers.some((c) => c.destinataire === courriel.toLowerCase()), false);
});

test('échec du courriel : la réservation reste confirmée et courrielEnvoye vaut false', async () => {
  process.env.SMTP_PORT = String(await portLibre());
  const serveurSansSmtp = await startServer();
  try {
    const courriel = courrielUnique();
    const motDePasse = 'motdepasse-test-1';
    await serveurSansSmtp.request('POST', '/api/auth/inscription', { nom: 'Sans Courriel', courriel, motDePasse });
    const { donnees: connexion } = await serveurSansSmtp.request('POST', '/api/auth/connexion', { courriel, motDePasse });
    const [placeId] = prendrePlaces(1);
    await serveurSansSmtp.request('POST', `/api/seances/${seanceId}/places/${placeId}/retenir`, undefined, connexion.token);

    const { status, donnees } = await serveurSansSmtp.request(
      'POST',
      '/api/reservations',
      { seanceId, placeIds: [placeId] },
      connexion.token
    );

    assert.equal(status, 201);
    assert.equal(donnees.courrielEnvoye, false);
    assert.equal(await etatDeLaPlace(placeId), 'vendue');
  } finally {
    await serveurSansSmtp.close();
  }
});

test('WebSocket : retenir, réserver et annuler diffusent place:etat_change à la séance', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);
  const socket = await connecterSocket(seanceId);
  try {
    let evenement = ecouter(socket, 'place:etat_change');
    await retenir(jeton, placeId);
    assert.deepEqual((({ id, etat }) => ({ id, etat }))(await evenement), { id: String(placeId), etat: 'retenue' });

    evenement = ecouter(socket, 'place:etat_change');
    const { donnees } = await reserver(jeton, [placeId]);
    assert.deepEqual(await evenement, { id: String(placeId), etat: 'vendue' });

    evenement = ecouter(socket, 'place:etat_change');
    await serveur.request('DELETE', `/api/reservations/${donnees.reservation.id}`, undefined, jeton);
    assert.deepEqual(await evenement, { id: String(placeId), etat: 'libre' });
  } finally {
    socket.disconnect();
  }
});

test('WebSocket : une autre séance ne reçoit pas les changements', async () => {
  const { jeton } = await creerCompte();
  const [placeId] = prendrePlaces(1);
  const socket = await connecterSocket(seanceId + 100000);
  try {
    const evenement = ecouter(socket, 'place:etat_change', 1000);
    await retenir(jeton, placeId);

    assert.equal(await evenement, undefined);
  } finally {
    socket.disconnect();
  }
});
