CREATE TABLE IF NOT EXISTS utilisateur (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  courriel VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'spectateur'
    CHECK (role IN ('spectateur', 'gestionnaire')),
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS salle (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  capacite INTEGER NOT NULL CHECK (capacite > 0),
  lieu VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS film (
  id BIGSERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  duree_minutes INTEGER NOT NULL CHECK (duree_minutes > 0),
  genre VARCHAR(100),
  image_url TEXT,
  description TEXT,
  sous_titre VARCHAR(255),
  spectacle_type VARCHAR(30) NOT NULL DEFAULT 'cinema'
    CHECK (spectacle_type IN ('cinema', 'theatre'))
);


CREATE TABLE IF NOT EXISTS place (
  id BIGSERIAL PRIMARY KEY,
  salle_id BIGINT NOT NULL
    REFERENCES salle(id)
    ON DELETE RESTRICT,

  rangee VARCHAR(20) NOT NULL,
  numero INTEGER NOT NULL,

  type VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (type IN ('standard', 'accessible')),

  UNIQUE (salle_id, rangee, numero),
  UNIQUE (id, salle_id)
);


CREATE TABLE IF NOT EXISTS seance (
  id BIGSERIAL PRIMARY KEY,

  salle_id BIGINT NOT NULL
    REFERENCES salle(id)
    ON DELETE RESTRICT,

  film_id BIGINT NOT NULL
    REFERENCES film(id)
    ON DELETE RESTRICT,

  date_heure TIMESTAMPTZ NOT NULL,

  statut VARCHAR(20) NOT NULL DEFAULT 'ouverte'
    CHECK (statut IN ('ouverte', 'fermee', 'annulee')),

  creee_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (id, salle_id)
);


CREATE TABLE IF NOT EXISTS place_seance (
  id BIGSERIAL PRIMARY KEY,

  place_id BIGINT NOT NULL,
  salle_id BIGINT NOT NULL,
  seance_id BIGINT NOT NULL,

  etat VARCHAR(20) NOT NULL DEFAULT 'libre'
    CHECK (
      etat IN (
        'libre',
        'retenue',
        'vendue',
        'bloquee'
      )
    ),

  zone VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (
      zone IN (
        'vip',
        'standard',
        'economique',
        'bloque'
      )
    ),

  prix NUMERIC(10,2) NOT NULL DEFAULT 22.00
    CHECK (prix >= 0),

  retenue_par_utilisateur_id BIGINT
    REFERENCES utilisateur(id)
    ON DELETE SET NULL,

  retenue_expire_a TIMESTAMPTZ,

  UNIQUE (place_id, seance_id),
  UNIQUE (id, seance_id),

  FOREIGN KEY (place_id, salle_id)
    REFERENCES place(id, salle_id)
    ON DELETE RESTRICT,

  FOREIGN KEY (seance_id, salle_id)
    REFERENCES seance(id, salle_id)
    ON DELETE CASCADE,

  CHECK (
    (
      etat = 'retenue'
      AND retenue_par_utilisateur_id IS NOT NULL
      AND retenue_expire_a IS NOT NULL
    )
    OR
    (
      etat <> 'retenue'
      AND retenue_par_utilisateur_id IS NULL
      AND retenue_expire_a IS NULL
    )
  )
);


CREATE TABLE IF NOT EXISTS reservation (
  id BIGSERIAL PRIMARY KEY,

  utilisateur_id BIGINT NOT NULL
    REFERENCES utilisateur(id)
    ON DELETE RESTRICT,

  seance_id BIGINT NOT NULL
    REFERENCES seance(id)
    ON DELETE RESTRICT,

  code_billet VARCHAR(50) NOT NULL UNIQUE,

  creee_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  statut VARCHAR(20) NOT NULL DEFAULT 'confirmee'
    CHECK (
      statut IN (
        'confirmee',
        'annulee'
      )
    ),

  montant_total NUMERIC(10,2) NOT NULL
    CHECK (montant_total >= 0),

  UNIQUE (id, seance_id)
);


CREATE TABLE IF NOT EXISTS reservation_place (
  reservation_id BIGINT NOT NULL,
  place_seance_id BIGINT NOT NULL,
  seance_id BIGINT NOT NULL,

  active BOOLEAN NOT NULL DEFAULT TRUE,

  PRIMARY KEY (
    reservation_id,
    place_seance_id
  ),

  FOREIGN KEY (
    reservation_id,
    seance_id
  )
    REFERENCES reservation(id, seance_id)
    ON DELETE CASCADE,

  FOREIGN KEY (
    place_seance_id,
    seance_id
  )
    REFERENCES place_seance(id, seance_id)
    ON DELETE RESTRICT
);


ALTER TABLE salle
  ADD COLUMN IF NOT EXISTS lieu VARCHAR(255);


ALTER TABLE film
  ADD COLUMN IF NOT EXISTS sous_titre VARCHAR(255);


ALTER TABLE film
  ADD COLUMN IF NOT EXISTS spectacle_type VARCHAR(30);


UPDATE film
SET spectacle_type = 'cinema'
WHERE spectacle_type IS NULL;


ALTER TABLE film
  ALTER COLUMN spectacle_type
  SET DEFAULT 'cinema';


ALTER TABLE film
  ALTER COLUMN spectacle_type
  SET NOT NULL;



ALTER TABLE place_seance
  ADD COLUMN IF NOT EXISTS zone VARCHAR(20);


UPDATE place_seance
SET zone = 'standard'
WHERE zone IS NULL;


ALTER TABLE place_seance
  ALTER COLUMN zone
  SET DEFAULT 'standard';


ALTER TABLE place_seance
  ALTER COLUMN zone
  SET NOT NULL;


ALTER TABLE place_seance
  ADD COLUMN IF NOT EXISTS prix NUMERIC(10,2);


UPDATE place_seance
SET prix = 22.00
WHERE prix IS NULL;


ALTER TABLE place_seance
  ALTER COLUMN prix
  SET DEFAULT 22.00;


ALTER TABLE place_seance
  ALTER COLUMN prix
  SET NOT NULL;



ALTER TABLE film
  DROP CONSTRAINT IF EXISTS film_spectacle_type_check;


ALTER TABLE film
  ADD CONSTRAINT film_spectacle_type_check
  CHECK (
    spectacle_type IN (
      'cinema',
      'theatre'
    )
  );


ALTER TABLE place_seance
  DROP CONSTRAINT IF EXISTS place_seance_zone_check;


ALTER TABLE place_seance
  ADD CONSTRAINT place_seance_zone_check
  CHECK (
    zone IN (
      'vip',
      'standard',
      'economique',
      'bloque'
    )
  );


ALTER TABLE place_seance
  DROP CONSTRAINT IF EXISTS place_seance_prix_check;


ALTER TABLE place_seance
  ADD CONSTRAINT place_seance_prix_check
  CHECK (prix >= 0);



ALTER TABLE place_seance
  DROP CONSTRAINT IF EXISTS place_seance_etat_check;


ALTER TABLE place_seance
  ADD CONSTRAINT place_seance_etat_check
  CHECK (
    etat IN (
      'libre',
      'retenue',
      'vendue',
      'bloquee'
    )
  );



DROP TRIGGER IF EXISTS trg_verifier_place_seance_salle
  ON place_seance;


DROP FUNCTION IF EXISTS verifier_place_seance_salle();


DROP INDEX IF EXISTS uq_place_vendue_une_fois;



CREATE INDEX IF NOT EXISTS idx_place_seance_etat
  ON place_seance (
    seance_id,
    etat
  );


CREATE INDEX IF NOT EXISTS idx_reservation_utilisateur
  ON reservation (
    utilisateur_id,
    creee_le DESC
  );


CREATE INDEX IF NOT EXISTS idx_seance_date
  ON seance (
    date_heure
  );


CREATE INDEX IF NOT EXISTS idx_place_seance_zone
  ON place_seance (
    seance_id,
    zone
  );