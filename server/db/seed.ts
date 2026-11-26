import type { PoolClient } from 'pg';
import { pool } from './pool';

/**
 * Données de départ de l'application : des films réels, trois salles de
 * Montréal et des séances jusqu'à la fin de la période de correction.
 *
 * Le seed s'exécute à chaque démarrage, mais il n'ajoute que ce qui manque :
 * un redémarrage (ou un `docker compose down` suivi d'un `up`) ne crée aucun
 * doublon et ne touche pas aux réservations déjà faites.
 */

const FUSEAU = 'America/Toronto';
const FIN_PROGRAMMATION = '2027-01-05';

const TARIFS = { vip: 45, standard: 22, economique: 12 } as const;

type Zone = keyof typeof TARIFS;

type Film = {
  titre: string;
  dureeMinutes: number;
  genre: string;
  sousTitre: string;
  imageUrl: string;
  description: string;
};

type Salle = {
  nom: string;
  lieu: string;
  rangees: number;
  colonnes: number;
  // Numéros de siège qui sont des allées : aucune place n'est créée pour eux.
  allees: number[];
  // Sièges retirés de chaque côté de la première rangée (rangée incurvée).
  retraitPremiereRangee: number;
  zoneDeLaRangee: (rangee: number) => Zone;
  heures: string[];
};

type PlaceDeSalle = {
  rangee: string;
  numero: number;
  type: 'standard' | 'accessible';
  zone: Zone;
};

const IMAGE_SALLE =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85';
const IMAGE_PROJECTEUR =
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=85';

const FILMS: Film[] = [
  {
    titre: 'Incendies',
    dureeMinutes: 130,
    genre: 'Drame',
    sousTitre: 'Denis Villeneuve · 2010',
    imageUrl: IMAGE_SALLE,
    description:
      'Deux jumeaux partent sur les traces du passé de leur mère après la lecture de son testament.'
  },
  {
    titre: 'C.R.A.Z.Y.',
    dureeMinutes: 129,
    genre: 'Drame',
    sousTitre: 'Jean-Marc Vallée · 2005',
    imageUrl: IMAGE_PROJECTEUR,
    description:
      'Dans le Québec des années 1960 et 1970, Zac cherche sa place dans une famille de cinq garçons.'
  },
  {
    titre: 'Mommy',
    dureeMinutes: 139,
    genre: 'Drame',
    sousTitre: 'Xavier Dolan · 2014',
    imageUrl: IMAGE_SALLE,
    description:
      'Une mère veuve tente d’élever seule son fils adolescent, imprévisible et attachant.'
  },
  {
    titre: 'Le Fabuleux Destin d’Amélie Poulain',
    dureeMinutes: 122,
    genre: 'Comédie',
    sousTitre: 'Jean-Pierre Jeunet · 2001',
    imageUrl: IMAGE_PROJECTEUR,
    description:
      'Une serveuse de Montmartre se met à améliorer en secret la vie des gens autour d’elle.'
  },
  {
    titre: 'Parasite',
    dureeMinutes: 132,
    genre: 'Thriller',
    sousTitre: 'Bong Joon-ho · 2019',
    imageUrl: IMAGE_SALLE,
    description:
      'Une famille sans le sou s’installe peu à peu dans la vie d’une famille fortunée.'
  }
];

// Plans inspirés des gabarits de CreateSessionPage (salles de Montréal).
const SALLES: Salle[] = [
  {
    nom: 'Beaubien · Salle 1',
    lieu: 'Cinéma Beaubien, 2396 rue Beaubien E, Montréal',
    rangees: 8,
    colonnes: 11,
    allees: [6],
    retraitPremiereRangee: 0,
    zoneDeLaRangee: (rangee) => (rangee === 0 ? 'economique' : rangee >= 6 ? 'vip' : 'standard'),
    heures: ['18:30', '21:00']
  },
  {
    nom: 'Cinéma du Parc · Salle 2',
    lieu: 'Cinéma du Parc, 3575 avenue du Parc, Montréal',
    rangees: 10,
    colonnes: 13,
    allees: [4, 10],
    retraitPremiereRangee: 1,
    zoneDeLaRangee: (rangee) => (rangee < 2 ? 'economique' : rangee >= 8 ? 'vip' : 'standard'),
    heures: ['19:00', '21:30']
  },
  {
    nom: 'Quartier Latin · Salle 9',
    lieu: 'Cineplex Odeon Quartier Latin, 350 rue Émery, Montréal',
    rangees: 11,
    colonnes: 17,
    allees: [5, 13],
    retraitPremiereRangee: 2,
    zoneDeLaRangee: (rangee) => (rangee < 2 ? 'economique' : rangee >= 9 ? 'vip' : 'standard'),
    heures: ['18:00', '20:45']
  }
];

/** Les places d'une salle : une par siège, sans les allées ni les coins retirés. */
function construirePlaces(salle: Salle): PlaceDeSalle[] {
  const places: PlaceDeSalle[] = [];

  for (let rangee = 0; rangee < salle.rangees; rangee += 1) {
    const retrait = rangee === 0 ? salle.retraitPremiereRangee : 0;

    for (let colonne = 0; colonne < salle.colonnes; colonne += 1) {
      const numero = colonne + 1;
      const dansLeRetrait = colonne < retrait || colonne >= salle.colonnes - retrait;

      if (dansLeRetrait || salle.allees.includes(numero)) continue;

      places.push({
        rangee: String.fromCharCode(65 + rangee),
        numero,
        // Les deux premiers sièges de la dernière rangée sont accessibles.
        type: rangee === salle.rangees - 1 && numero <= 2 ? 'accessible' : 'standard',
        zone: salle.zoneDeLaRangee(rangee)
      });
    }
  }

  return places;
}

/** Les jours (AAAA-MM-JJ, heure de Montréal) d'aujourd'hui jusqu'à la fin de la programmation. */
function joursDeProgrammation(): string[] {
  const aujourdhui = new Date().toLocaleDateString('en-CA', { timeZone: FUSEAU });
  const jours: string[] = [];

  for (
    const jour = new Date(`${aujourdhui}T12:00:00Z`);
    jour.toISOString().slice(0, 10) <= FIN_PROGRAMMATION;
    jour.setUTCDate(jour.getUTCDate() + 1)
  ) {
    jours.push(jour.toISOString().slice(0, 10));
  }

  return jours;
}

async function trouverOuCreerFilm(client: PoolClient, film: Film): Promise<number> {
  const existant = await client.query('SELECT id FROM film WHERE titre = $1', [film.titre]);
  if (existant.rows.length) return Number(existant.rows[0].id);

  const { rows } = await client.query(
    `INSERT INTO film (titre, duree_minutes, genre, sous_titre, image_url, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [film.titre, film.dureeMinutes, film.genre, film.sousTitre, film.imageUrl, film.description]
  );
  return Number(rows[0].id);
}

/** Retourne la salle (créée au besoin) et ses places, avec leur zone dans cette salle. */
async function trouverOuCreerSalle(client: PoolClient, salle: Salle) {
  const places = construirePlaces(salle);
  const existante = await client.query('SELECT id FROM salle WHERE nom = $1 AND lieu = $2', [
    salle.nom,
    salle.lieu
  ]);
  let salleId: number;

  if (existante.rows.length) {
    salleId = Number(existante.rows[0].id);
  } else {
    const creee = await client.query(
      'INSERT INTO salle (nom, capacite, lieu) VALUES ($1, $2, $3) RETURNING id',
      [salle.nom, places.length, salle.lieu]
    );
    salleId = Number(creee.rows[0].id);

    await client.query(
      `INSERT INTO place (salle_id, rangee, numero, type)
       SELECT $1::bigint, p.rangee, p.numero, p.type
       FROM unnest($2::text[], $3::int[], $4::text[]) AS p(rangee, numero, type)`,
      [
        salleId,
        places.map((place) => place.rangee),
        places.map((place) => place.numero),
        places.map((place) => place.type)
      ]
    );
  }

  const { rows } = await client.query('SELECT id, rangee, numero FROM place WHERE salle_id = $1', [salleId]);
  const zoneParPlace = new Map(places.map((place) => [`${place.rangee}${place.numero}`, place.zone]));

  return {
    salleId,
    placeIds: rows.map((ligne) => Number(ligne.id)),
    zones: rows.map((ligne) => zoneParPlace.get(`${ligne.rangee}${ligne.numero}`) ?? 'standard')
  };
}

/** Crée la séance (et l'état de ses places) seulement si ce créneau est libre et à venir. */
async function creerSeanceSiAbsente(
  client: PoolClient,
  salle: { salleId: number; placeIds: number[]; zones: Zone[] },
  filmId: number,
  jour: string,
  heure: string
) {
  const { rows } = await client.query(
    `INSERT INTO seance (salle_id, film_id, date_heure)
     SELECT $1::bigint, $2::bigint, ($3::date + $4::time) AT TIME ZONE $5::text
     WHERE ($3::date + $4::time) AT TIME ZONE $5::text > NOW()
       AND NOT EXISTS (
         SELECT 1 FROM seance
         WHERE salle_id = $1::bigint
           AND date_heure = ($3::date + $4::time) AT TIME ZONE $5::text
       )
     RETURNING id`,
    [salle.salleId, filmId, jour, heure, FUSEAU]
  );

  if (!rows.length) return;

  await client.query(
    `INSERT INTO place_seance (place_id, salle_id, seance_id, zone, prix)
     SELECT p.id, $1::bigint, $2::bigint, p.zone,
            CASE p.zone WHEN 'vip' THEN $5::numeric WHEN 'economique' THEN $7::numeric ELSE $6::numeric END
     FROM unnest($3::bigint[], $4::text[]) AS p(id, zone)`,
    [salle.salleId, rows[0].id, salle.placeIds, salle.zones, TARIFS.vip, TARIFS.standard, TARIFS.economique]
  );
}

export async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const filmIds: number[] = [];
    for (const film of FILMS) filmIds.push(await trouverOuCreerFilm(client, film));

    const jours = joursDeProgrammation();

    for (const [indexSalle, definition] of SALLES.entries()) {
      const salle = await trouverOuCreerSalle(client, definition);

      for (const [indexJour, jour] of jours.entries()) {
        for (const [indexHeure, heure] of definition.heures.entries()) {
          // Les films tournent d'un jour à l'autre et d'une salle à l'autre.
          const filmId = filmIds[(indexJour + indexHeure + indexSalle) % filmIds.length];
          await creerSeanceSiAbsente(client, salle, filmId, jour, heure);
        }
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
