import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, courrielUnique, requete } from './helpers.js';

let serveur: Awaited<ReturnType<typeof startServer>>;
let jetonSpectateur: string;
let jetonGestionnaire: string;
let seanceId: number;
let placeId: number;

/** Crée un compte de test et retourne son jeton. */
async function creerCompte(role: 'spectateur' | 'gestionnaire') {
  const courriel = courrielUnique();
  const motDePasse = 'motdepasse-test-1';
  await serveur.request('POST', '/api/auth/inscription', { nom: 'Compte Test', courriel, motDePasse });

  if (role === 'gestionnaire') {
    await requete("UPDATE utilisateur SET role = 'gestionnaire' WHERE courriel = $1", [courriel]);
  }

  // Le rôle est écrit dans le jeton : on se connecte APRÈS la promotion pour en obtenir un nouveau.
  const { donnees } = await serveur.request('POST', '/api/auth/connexion', { courriel, motDePasse });
  return donnees.token as string;
}

/** Remet la place de test à libre : chaque test repart du même état. */
async function remettreLibre() {
  await requete(
    "UPDATE place_seance SET etat = 'libre', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL WHERE id = $1",
    [placeId]
  );
}

/** L'état de la place de test, tel que le plan de la séance le montre. */
async function etatDeLaPlace() {
  const { donnees } = await serveur.request('GET', `/api/seances/${seanceId}/plan`);
  return donnees.places.find((place: any) => place.id === placeId).etat;
}

/** POST sur la place de test : action vaut 'bloquer', 'debloquer' ou 'retenir'. */
function actionSurLaPlace(action: string, jeton?: string) {
  return serveur.request('POST', `/api/seances/${seanceId}/places/${placeId}/${action}`, undefined, jeton);
}

before(async () => {
  serveur = await startServer();
  jetonSpectateur = await creerCompte('spectateur');
  jetonGestionnaire = await creerCompte('gestionnaire');

  // Le serveur sème des séances de démonstration au démarrage : on prend la première et l'une de ses places libres.
  const { donnees: liste } = await serveur.request('GET', '/api/seances');
  seanceId = liste.seances[0].id;
  const { donnees: plan } = await serveur.request('GET', `/api/seances/${seanceId}/plan`);
  placeId = plan.places.find((place: any) => place.etat === 'libre').id;
});

after(async () => {
  // La base de test persiste entre deux exécutions : on la laisse comme on l'a trouvée.
  await remettreLibre();
  await serveur.close();
});

test('bloquer sans jeton : 401', async () => {
  await remettreLibre();

  const { status } = await actionSurLaPlace('bloquer');

  assert.equal(status, 401);
});

test('bloquer par un spectateur : 403 et la place reste libre', async () => {
  await remettreLibre();

  const { status } = await actionSurLaPlace('bloquer', jetonSpectateur);

  assert.equal(status, 403);
  assert.equal(await etatDeLaPlace(), 'libre');
});

test('débloquer par un spectateur : 403 et la place reste bloquée', async () => {
  await remettreLibre();
  await actionSurLaPlace('bloquer', jetonGestionnaire);

  const { status } = await actionSurLaPlace('debloquer', jetonSpectateur);

  assert.equal(status, 403);
  assert.equal(await etatDeLaPlace(), 'bloquee');
});

test('bloquer une place libre : 200 et la place est bloquée', async () => {
  await remettreLibre();

  const { status } = await actionSurLaPlace('bloquer', jetonGestionnaire);

  assert.equal(status, 200);
  assert.equal(await etatDeLaPlace(), 'bloquee');
});

test('bloquer une place déjà bloquée : 409', async () => {
  await remettreLibre();
  await actionSurLaPlace('bloquer', jetonGestionnaire);

  const { status } = await actionSurLaPlace('bloquer', jetonGestionnaire);

  assert.equal(status, 409);
});

test('débloquer une place libre : 409', async () => {
  await remettreLibre();

  const { status } = await actionSurLaPlace('debloquer', jetonGestionnaire);

  assert.equal(status, 409);
  assert.equal(await etatDeLaPlace(), 'libre');
});

test('retenir une place bloquée : 409', async () => {
  await remettreLibre();
  await actionSurLaPlace('bloquer', jetonGestionnaire);

  const { status } = await actionSurLaPlace('retenir', jetonSpectateur);

  assert.equal(status, 409);
  assert.equal(await etatDeLaPlace(), 'bloquee');
});

test('débloquer une place bloquée : 200 et la place redevient libre', async () => {
  await remettreLibre();
  await actionSurLaPlace('bloquer', jetonGestionnaire);

  const { status } = await actionSurLaPlace('debloquer', jetonGestionnaire);

  assert.equal(status, 200);
  assert.equal(await etatDeLaPlace(), 'libre');
});