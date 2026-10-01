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