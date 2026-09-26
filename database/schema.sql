-- Schéma PostgreSQL cohérent avec le projet de réservation de places
-- Version corrigée : contraintes métier, unicité, verrouillage pessimiste compatible avec SELECT ... FOR UPDATE,
-- annulation possible et cohérence salle/place/séance.

CREATE TYPE utilisateur_role AS ENUM ('spectateur', 'gestionnaire');
CREATE TYPE seance_statut AS ENUM ('ouverte', 'fermee', 'annulee');
CREATE TYPE place_type AS ENUM ('standard', 'accessible');
CREATE TYPE place_seance_etat AS ENUM ('libre', 'retenue', 'vendue');
CREATE TYPE reservation_statut AS ENUM ('confirmee', 'annulee');

CREATE TABLE utilisateur (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(120) NOT NULL,
    courriel VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role utilisateur_role NOT NULL DEFAULT 'spectateur',
    cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE salle (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    capacite INTEGER NOT NULL CHECK (capacite > 0)
);

CREATE TABLE film (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    duree_minutes INTEGER NOT NULL CHECK (duree_minutes > 0),
    genre VARCHAR(100)
);

CREATE TABLE place (
    id BIGSERIAL,
    salle_id BIGINT NOT NULL,
    rangee VARCHAR(20) NOT NULL,
    numero INTEGER NOT NULL,
    type place_type NOT NULL DEFAULT 'standard',
    PRIMARY KEY (id, salle_id),
    UNIQUE (salle_id, rangee, numero),
    FOREIGN KEY (salle_id) REFERENCES salle(id) ON DELETE RESTRICT
);

CREATE TABLE seance (
    id BIGSERIAL UNIQUE,
    salle_id BIGINT NOT NULL,
    film_id BIGINT NOT NULL,
    date_heure TIMESTAMPTZ NOT NULL,
    statut seance_statut NOT NULL DEFAULT 'ouverte',
    creee_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, salle_id),
    FOREIGN KEY (salle_id) REFERENCES salle(id) ON DELETE RESTRICT,
    FOREIGN KEY (film_id) REFERENCES film(id) ON DELETE RESTRICT,
    UNIQUE (id, salle_id)
);

CREATE TABLE place_seance (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL,
    salle_id BIGINT NOT NULL,
    seance_id BIGINT NOT NULL,
    etat place_seance_etat NOT NULL DEFAULT 'libre',
    retenue_par_utilisateur_id BIGINT,
    retenue_expire_a TIMESTAMPTZ,
    UNIQUE (place_id, seance_id),
    UNIQUE (id, seance_id),
    FOREIGN KEY (place_id, salle_id) REFERENCES place(id, salle_id) ON DELETE RESTRICT,
    FOREIGN KEY (seance_id, salle_id) REFERENCES seance(id, salle_id) ON DELETE CASCADE,
    CHECK (
        (etat = 'retenue' AND retenue_par_utilisateur_id IS NOT NULL AND retenue_expire_a IS NOT NULL)
        OR
        (etat <> 'retenue' AND retenue_par_utilisateur_id IS NULL AND retenue_expire_a IS NULL)
    )
);

CREATE TABLE reservation (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE RESTRICT,
    seance_id BIGINT NOT NULL,
    code_billet VARCHAR(50) NOT NULL UNIQUE,
    creee_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    statut reservation_statut NOT NULL DEFAULT 'confirmee',
    montant_total NUMERIC(10,2) NOT NULL CHECK (montant_total >= 0),
    UNIQUE (id, seance_id),
    FOREIGN KEY (seance_id) REFERENCES seance(id) ON DELETE RESTRICT
);

CREATE TABLE reservation_place (
    reservation_id BIGINT NOT NULL,
    place_seance_id BIGINT NOT NULL,
    seance_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (reservation_id, place_seance_id),
    FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE,
    FOREIGN KEY (place_seance_id, seance_id) REFERENCES place_seance(id, seance_id) ON DELETE RESTRICT,
    FOREIGN KEY (reservation_id, seance_id) REFERENCES reservation(id, seance_id) ON DELETE CASCADE,
    CHECK (seance_id IS NOT NULL)
);

CREATE UNIQUE INDEX uq_place_vendue_une_fois
    ON reservation_place (place_seance_id)
    WHERE active;

-- Vérifie que chaque place d'une séance appartient bien à la même salle que la séance
CREATE OR REPLACE FUNCTION verifier_place_seance_salle()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM place p
        JOIN seance s ON s.id = NEW.seance_id
        WHERE p.id = NEW.place_id
          AND p.salle_id <> s.salle_id
    ) THEN
        RAISE EXCEPTION 'La place % ne correspond pas à la salle de la séance %', NEW.place_id, NEW.seance_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verifier_place_seance_salle
BEFORE INSERT OR UPDATE ON place_seance
FOR EACH ROW
EXECUTE FUNCTION verifier_place_seance_salle();

CREATE INDEX idx_place_seance_etat ON place_seance (seance_id, etat);
CREATE INDEX idx_place_seance_retenue ON place_seance (retenue_par_utilisateur_id, retenue_expire_a);
CREATE INDEX idx_reservation_utilisateur ON reservation (utilisateur_id, creee_le DESC);
CREATE INDEX idx_reservation_seance ON reservation (seance_id);

-- Exemple de génération des lignes de place par séance
-- INSERT INTO place_seance (place_id, salle_id, seance_id, etat)
-- SELECT p.id, p.salle_id, s.id, 'libre'
-- FROM place p
-- JOIN seance s ON s.salle_id = p.salle_id
-- WHERE s.id = :id_seance;
