import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, courrielUnique, requete } from './helpers.js';

let serveur: Awaited<ReturnType<typeof startServer>>;

before(async () => {
  serveur = await startServer();
});

after(async () => {
  await serveur.close();
});

test('inscription réussie : 201 et mot de passe haché en base', async () => {
  const courriel = courrielUnique();
  const { status, donnees } = await serveur.request('POST', '/api/auth/inscription', {
    nom: 'Sophie Martin',
    courriel,
    motDePasse: 'motdepasse-test-1',
  });

  assert.equal(status, 201);
  assert.equal(donnees.user.courriel, courriel);
  assert.ok(donnees.token);

  const [ligne] = await requete('SELECT mot_de_passe_hash FROM utilisateur WHERE courriel = $1', [courriel]);
  assert.notEqual(ligne.mot_de_passe_hash, 'motdepasse-test-1');
  assert.ok(ligne.mot_de_passe_hash.startsWith('$2'));
});

test('courriel déjà utilisé : 409', async () => {
  const courriel = courrielUnique();
  const compte = { nom: 'Sophie Martin', courriel, motDePasse: 'motdepasse-test-1' };

  await serveur.request('POST', '/api/auth/inscription', compte);
  const { status } = await serveur.request('POST', '/api/auth/inscription', compte);

  assert.equal(status, 409);
});

test('nom vide : 400', async () => {
  const { status } = await serveur.request('POST', '/api/auth/inscription', {
    nom: '',
    courriel: courrielUnique(),
    motDePasse: 'motdepasse-test-1',
  });

  assert.equal(status, 400);
});

test('mot de passe trop court : 400', async () => {
  const { status } = await serveur.request('POST', '/api/auth/inscription', {
    nom: 'Sophie Martin',
    courriel: courrielUnique(),
    motDePasse: 'abc',
  });

  assert.equal(status, 400);
});

test('mauvais mot de passe à la connexion : 401', async () => {
  const courriel = courrielUnique();
  await serveur.request('POST', '/api/auth/inscription', {
    nom: 'Sophie Martin',
    courriel,
    motDePasse: 'motdepasse-test-1',
  });

  const { status } = await serveur.request('POST', '/api/auth/connexion', {
    courriel,
    motDePasse: 'autre-mot-de-passe',
  });

  assert.equal(status, 401);
});

test('route protégée sans jeton : 401', async () => {
  const { status } = await serveur.request('GET', '/api/reservations');

  assert.equal(status, 401);
});

test('spectateur sur la création de séance : 403', async () => {
  const { donnees } = await serveur.request('POST', '/api/auth/inscription', {
    nom: 'Sophie Martin',
    courriel: courrielUnique(),
    motDePasse: 'motdepasse-test-1',
  });

  const { status } = await serveur.request(
    'POST',
    '/api/seances',
    { titre: 'Test', dateHeure: '2030-01-01T20:00:00Z' },
    donnees.token
  );

  assert.equal(status, 403);
});