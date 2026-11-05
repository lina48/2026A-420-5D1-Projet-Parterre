import {
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Minus,
  Plus,
  X
} from 'lucide-react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import { api } from '../services/api';
import type { User } from '../types';


type Props = {
  user: User | null;
  notify: (message: string) => void;
};


type Zone =
  | 'vip'
  | 'standard'
  | 'economique'
  | 'bloque'
  | 'vide';


type Form = {
  titre: string;
  sousTitre: string;
  type: 'cinema' | 'theatre';
  genre: string;
  date: string;
  heure: string;
  duree: number;
  salle: string;
  lieu: string;
  imageUrl: string;
};


const initialForm: Form = {
  titre: '',
  sousTitre: '',
  type: 'cinema',
  genre: '',

  date: new Date(
    Date.now() + 86400000
  )
    .toISOString()
    .slice(0, 10),

  heure: '20:30',
  duree: 120,
  salle: 'Grande Salle',
  lieu: '',
  imageUrl: ''
};


const prices = {
  vip: 45,
  standard: 22,
  economique: 12
};


type RoomTemplate = {
  id: string;
  nom: string;
  salle: string;
  lieu: string;
  type: 'cinema' | 'theatre';
  description: string;
  grid: Zone[][];
};


/**
 * Construit une grille de salle réaliste :
 * - `aisles` : colonnes réservées aux allées (aucun siège)
 * - `trim` : nombre de sièges retirés de chaque côté d'un rang
 *   (permet les premiers rangs incurvés et les salles en éventail)
 * - `zone` : zone tarifaire de chaque siège restant
 */
function buildLayout(
  rows: number,
  columns: number,
  options: {
    aisles?: number[];
    trim?: (row: number) => number;
    zone: (row: number, column: number) => Zone;
  }
): Zone[][] {

  const { aisles = [], trim, zone } = options;

  return Array.from(
    { length: rows },

    (_, row) =>
      Array.from(
        { length: columns },

        (_, column) => {

          const cut = trim ? trim(row) : 0;

          if (
            column < cut ||
            column >= columns - cut
          ) {
            return 'vide';
          }

          if (aisles.includes(column)) {
            return 'vide';
          }

          return zone(row, column);
        }
      )
  );

}


// Plans inspirés de vraies salles de cinéma et de théâtre de Montréal.
const roomTemplates: RoomTemplate[] = [

  {
    id: 'banque-scotia-imax',
    nom: 'Cinéma Banque Scotia',
    salle: 'Salle IMAX',
    lieu: 'Cinéma Banque Scotia, 977 rue Sainte-Catherine O, Montréal',
    type: 'cinema',
    description:
      'Grande salle stadium : deux allées verticales et premiers rangs incurvés.',

    grid: buildLayout(14, 21, {
      aisles: [5, 15],

      trim: row =>
        row < 2 ? 3 - row : 0,

      zone: row =>
        row < 2
          ? 'economique'
          : row >= 11
          ? 'vip'
          : 'standard'
    })
  },

  {
    id: 'quartier-latin',
    nom: 'Cineplex Odeon Quartier Latin',
    salle: 'Salle 9',
    lieu: 'Cineplex Odeon Quartier Latin, 350 rue Émery, Montréal',
    type: 'cinema',
    description:
      'Salle stadium classique : trois blocs de sièges et rangs arrière premium.',

    grid: buildLayout(11, 17, {
      aisles: [4, 12],

      trim: row =>
        row === 0 ? 2 : 0,

      zone: row =>
        row < 2
          ? 'economique'
          : row >= 9
          ? 'vip'
          : 'standard'
    })
  },

  {
    id: 'cinema-beaubien',
    nom: 'Cinéma Beaubien',
    salle: 'Salle 1',
    lieu: 'Cinéma Beaubien, 2396 rue Beaubien E, Montréal',
    type: 'cinema',
    description:
      'Cinéma de quartier intime : allée centrale unique et dernier rang premium.',

    grid: buildLayout(8, 11, {
      aisles: [5],

      zone: row =>
        row === 0
          ? 'economique'
          : row >= 6
          ? 'vip'
          : 'standard'
    })
  },

  {
    id: 'cinema-du-parc',
    nom: 'Cinéma du Parc',
    salle: 'Salle 2',
    lieu: 'Cinéma du Parc, 3575 avenue du Parc, Montréal',
    type: 'cinema',
    description:
      'Salle de répertoire : blocs latéraux étroits et premier rang raccourci.',

    grid: buildLayout(10, 13, {
      aisles: [3, 9],

      trim: row =>
        row === 0 ? 1 : 0,

      zone: row =>
        row < 2
          ? 'economique'
          : row >= 8
          ? 'vip'
          : 'standard'
    })
  },

  {
    id: 'theatre-st-denis',
    nom: 'Théâtre St-Denis',
    salle: 'Parterre',
    lieu: 'Théâtre St-Denis, 1594 rue Saint-Denis, Montréal',
    type: 'theatre',
    description:
      'Parterre en éventail : rangs qui s’élargissent vers l’arrière, centre VIP.',

    grid: buildLayout(16, 23, {
      aisles: [6, 16],

      trim: row =>
        Math.max(
          0,
          4 - Math.floor(row / 2)
        ),

      zone: (row, column) =>
        row < 5 &&
        column >= 7 &&
        column <= 15
          ? 'vip'
          : row >= 12
          ? 'economique'
          : 'standard'
    })
  },

  {
    id: 'wilfrid-pelletier',
    nom: 'Place des Arts',
    salle: 'Salle Wilfrid-Pelletier',
    lieu: 'Place des Arts, 175 rue Sainte-Catherine O, Montréal',
    type: 'theatre',
    description:
      'Grande salle en éventail : large parterre, centre premium, fond économique.',

    grid: buildLayout(18, 24, {
      aisles: [7, 16],

      trim: row =>
        Math.max(
          0,
          5 - Math.floor(row / 2)
        ),

      zone: (row, column) =>
        row < 6 &&
        column >= 8 &&
        column <= 15
          ? 'vip'
          : row >= 13
          ? 'economique'
          : 'standard'
    })
  }

];


function templateCapacity(
  grid: Zone[][]
): number {

  return grid
    .flat()
    .filter(
      zone =>
        zone !== 'vide' &&
        zone !== 'bloque'
    )
    .length;

}


export default function CreateSessionPage({
  user,
  notify
}: Props) {

  const navigate = useNavigate();

  const [step, setStep] =
    useState(1);

  const [form, setForm] =
    useState<Form>(initialForm);

  const [rows, setRows] =
    useState(10);

  const [perRow, setPerRow] =
    useState(16);

  const [brush, setBrush] =
    useState<Zone>('standard');

  const [templateId, setTemplateId] =
    useState<string | null>(null);

  const [seats, setSeats] =
    useState<Zone[][]>(
      () => makeSeats(10, 16)
    );

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');


  useEffect(() => {

    if (
      !user ||
      user.role !== 'gestionnaire'
    ) {
      navigate('/');
    }

  }, [user, navigate]);


  useEffect(() => {

    setSeats(old =>
      Array.from(
        { length: rows },

        (_, row) =>
          Array.from(
            { length: perRow },

            (_, column) =>
              old[row]?.[column] ??
              'standard'
          )
      )
    );

  }, [rows, perRow]);


  const counts = useMemo(() => {

    return seats
      .flat()
      .reduce(
        (accumulator, zone) => {

          accumulator[zone]++;

          return accumulator;

        },

        {
          vip: 0,
          standard: 0,
          economique: 0,
          bloque: 0,
          vide: 0
        } as Record<Zone, number>
      );

  }, [seats]);


  const active =
    counts.vip +
    counts.standard +
    counts.economique;


  const revenue =
    counts.vip * prices.vip +
    counts.standard * prices.standard +
    counts.economique * prices.economique;


  if (
    !user ||
    user.role !== 'gestionnaire'
  ) {
    return null;
  }


  function update<K extends keyof Form>(
    key: K,
    value: Form[K]
  ) {

    setForm(old => ({
      ...old,
      [key]: value
    }));

  }


  function applyTemplate(
    template: RoomTemplate
  ) {

    setTemplateId(template.id);

    setRows(template.grid.length);

    setPerRow(
      template.grid[0].length
    );

    setSeats(
      template.grid.map(
        row => [...row]
      )
    );

    setForm(old => ({
      ...old,
      type: template.type,
      salle: template.salle,
      lieu: template.lieu
    }));

  }


  function paint(
    row: number,
    column: number
  ) {

    setSeats(old =>
      old.map(
        (currentRow, rowIndex) =>

          rowIndex === row

            ? currentRow.map(
                (zone, columnIndex) =>
                  columnIndex === column
                    ? brush
                    : zone
              )

            : currentRow
      )
    );

  }


  function paintRow(row: number) {

    setSeats(old =>
      old.map(
        (currentRow, rowIndex) =>
          rowIndex === row
            ? currentRow.map(() => brush)
            : currentRow
      )
    );

  }


  function nextInfo() {

    if (
      !form.titre.trim() ||
      !form.date ||
      !form.heure ||
      !form.lieu.trim()
    ) {

      setError(
        'Remplissez le titre, la date, l’heure et le lieu.'
      );

      return;
    }

    setError('');
    setStep(2);

  }


  async function publish() {

    setBusy(true);
    setError('');

    try {

      await api(
        '/api/seances',
        {
          method: 'POST',

          body: JSON.stringify({

            ...form,

            dateHeure:
              `${form.date}T${form.heure}`,

            rangees: rows,

            siegesParRangee:
              perRow,

            plan: seats,

            tarifs: prices

          })
        }
      );


      notify(
        'La séance a été publiée.'
      );

      navigate('/gestion');

    } catch (err) {

      setError(
        (err as Error).message
      );

    } finally {

      setBusy(false);

    }

  }


  return (

    <section className="session-wizard">

      <Link
        className="back-link"
        to="/gestion"
      >
        <ArrowLeft size={16} />
        Retour au dashboard
      </Link>


      {/* ÉTAPES */}

      <div className="wizard-steps">

        {[
          'Informations',
          'Plan de salle',
          'Récapitulatif'
        ].map((label, index) => (

          <div
            key={label}

            className={
              `wizard-step
              ${step === index + 1
                ? 'active'
                : ''}
              ${step > index + 1
                ? 'done'
                : ''}`
            }
          >

            <span>

              {step > index + 1

                ? <Check size={15} />

                : index + 1
              }

            </span>

            <b>{label}</b>

            {index < 2 && <i />}

          </div>

        ))}

      </div>


      {/* ==========================
          ÉTAPE 1
      ========================== */}

      {step === 1 && (

        <div className="info-layout">

          <div className="wizard-card">

            <h1>
              Informations générales
            </h1>


            <Field label="TITRE *">

              <input
                value={form.titre}

                onChange={event =>
                  update(
                    'titre',
                    event.target.value
                  )
                }

                placeholder="Ex: Dune: Awakening"
              />

            </Field>


            <Field label="SOUS-TITRE">

              <input
                value={form.sousTitre}

                onChange={event =>
                  update(
                    'sousTitre',
                    event.target.value
                  )
                }

                placeholder="Ex: Director's Cut"
              />

            </Field>


            <div className="wizard-grid">


              <Field label="TYPE *">

                <div className="type-pick">

                  <button
                    type="button"

                    className={
                      form.type === 'cinema'
                        ? 'selected'
                        : ''
                    }

                    onClick={() =>
                      update(
                        'type',
                        'cinema'
                      )
                    }
                  >
                    ▣ Cinéma
                  </button>


                  <button
                    type="button"

                    className={
                      form.type === 'theatre'
                        ? 'selected'
                        : ''
                    }

                    onClick={() =>
                      update(
                        'type',
                        'theatre'
                      )
                    }
                  >
                    ♜ Théâtre
                  </button>

                </div>

              </Field>


              <Field label="GENRE">

                <input
                  value={form.genre}

                  onChange={event =>
                    update(
                      'genre',
                      event.target.value
                    )
                  }

                  placeholder="Ex: Sci-Fi, Opéra..."
                />

              </Field>


              <Field label="DATE *">

                <input
                  type="date"
                  value={form.date}

                  onChange={event =>
                    update(
                      'date',
                      event.target.value
                    )
                  }
                />

              </Field>


              <Field label="HEURE *">

                <input
                  type="time"
                  value={form.heure}

                  onChange={event =>
                    update(
                      'heure',
                      event.target.value
                    )
                  }
                />

              </Field>


              <Field label="DURÉE (MIN)">

                <input
                  type="number"
                  min="1"

                  value={form.duree}

                  onChange={event =>
                    update(
                      'duree',
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </Field>


              <Field label="SALLE">

                <input
                  value={form.salle}

                  onChange={event =>
                    update(
                      'salle',
                      event.target.value
                    )
                  }
                />

              </Field>

            </div>


            <Field label="LIEU *">

              <input
                value={form.lieu}

                onChange={event =>
                  update(
                    'lieu',
                    event.target.value
                  )
                }

                placeholder="Ex: Cinéma Le Grand Rex, Paris"
              />

            </Field>


            <Field label="URL DE L'AFFICHE">

              <input
                value={form.imageUrl}

                onChange={event =>
                  update(
                    'imageUrl',
                    event.target.value
                  )
                }

                placeholder="https://..."
              />

            </Field>


            {error && (

              <p className="form-error">
                <X size={15} />
                {error}
              </p>

            )}


            <div className="wizard-actions">

              <span />

              <button
                className="gold-action"
                onClick={nextInfo}
              >
                Continuer →
              </button>

            </div>

          </div>


          {/* PREVIEW */}

          <aside className="session-preview">

            {form.imageUrl

              ? (
                <img
                  src={form.imageUrl}
                  alt="Affiche"
                />
              )

              : (
                <div className="poster-placeholder">
                  AFFICHE
                </div>
              )
            }


            <div>

              <span
                className={
                  `session-type
                  ${form.type === 'theatre'
                    ? 'theatre'
                    : ''}`
                }
              >
                {form.type === 'theatre'
                  ? 'THÉÂTRE'
                  : 'CINÉMA'}
              </span>


              <h2>
                {form.titre ||
                  'Titre de la séance'}
              </h2>


              <p>
                {form.sousTitre ||
                  'Sous-titre'}
              </p>


              <small>
                <CalendarDays size={13} />

                {form.date}
                {' · '}
                {form.heure}
              </small>


              <small>
                <MapPin size={13} />

                {form.lieu || 'Lieu'}
              </small>


              <small>
                <Clock3 size={13} />

                {form.duree} min
              </small>

            </div>

          </aside>

        </div>

      )}


      {/* ==========================
          ÉTAPE 2
      ========================== */}

      {step === 2 && (

        <div className="wizard-card seat-builder">

          <h1>
            Configuration du plan de salle
          </h1>


          <p className="wizard-muted">
            Cliquez sur un siège pour peindre
            sa zone. Cliquez sur une lettre
            pour peindre tout le rang.
          </p>


          {/* GABARITS DE SALLES DE MONTRÉAL */}

          <div className="template-pick">

            <h2>
              Salles de Montréal
            </h2>

            <p className="wizard-muted">
              Partez du plan d’une vraie salle
              montréalaise — la forme, les allées
              et les zones sont déjà en place —
              puis ajustez-le à votre goût.
            </p>


            <div className="room-templates">

              {roomTemplates.map(template => (

                <button
                  key={template.id}
                  type="button"

                  className={
                    `room-template
                    ${templateId === template.id
                      ? 'selected'
                      : ''}`
                  }

                  onClick={() =>
                    applyTemplate(template)
                  }
                >

                  <span
                    className={
                      `session-type
                      ${template.type === 'theatre'
                        ? 'theatre'
                        : ''}`
                    }
                  >
                    {template.type === 'theatre'
                      ? 'THÉÂTRE'
                      : 'CINÉMA'}
                  </span>


                  <b>{template.nom}</b>


                  <small>
                    {template.salle}
                    {' · '}
                    {templateCapacity(
                      template.grid
                    )} places
                  </small>


                  <small className="template-desc">
                    {template.description}
                  </small>


                  <span
                    className="template-mini"
                    aria-hidden="true"
                  >

                    {template.grid.map(
                      (row, rowIndex) => (

                        <span key={rowIndex}>

                          {row.map(
                            (zone, columnIndex) => (
                              <i
                                key={columnIndex}
                                className={zone}
                              />
                            )
                          )}

                        </span>

                      )
                    )}

                  </span>

                </button>

              ))}

            </div>

          </div>


          <div className="seat-settings">

            <Counter
              label="RANGS"
              value={rows}

              minus={() => {
                setTemplateId(null);
                setRows(
                  Math.max(1, rows - 1)
                );
              }}

              plus={() => {
                setTemplateId(null);
                setRows(
                  Math.min(20, rows + 1)
                );
              }}
            />


            <Counter
              label="SIÈGES PAR RANG"
              value={perRow}

              minus={() => {
                setTemplateId(null);
                setPerRow(
                  Math.max(
                    1,
                    perRow - 1
                  )
                );
              }}

              plus={() => {
                setTemplateId(null);
                setPerRow(
                  Math.min(
                    24,
                    perRow + 1
                  )
                );
              }}
            />


            <strong>
              {active} places actives
            </strong>

          </div>


          {/* CHOIX DE ZONE */}

          <div className="brushes">

            <span>Peindre :</span>

            {(
              [
                'vip',
                'standard',
                'economique',
                'bloque',
                'vide'
              ] as Zone[]
            ).map(zone => (

              <button
                key={zone}

                className={
                  `${zone}
                  ${brush === zone
                    ? 'selected'
                    : ''}`
                }

                onClick={() =>
                  setBrush(zone)
                }
              >

                {zone === 'vip'
                  ? 'VIP 45€'

                  : zone === 'standard'
                  ? 'Standard 22€'

                  : zone === 'economique'
                  ? 'Économique 12€'

                  : zone === 'bloque'
                  ? 'Bloqué'

                  : 'Allée / Vide'
                }

              </button>

            ))}

          </div>


          <div className="stage-line">
            ÉCRAN / SCÈNE
          </div>


          {/* PLAN */}

          <div className="seat-editor">

            {seats.map(
              (row, rowIndex) => (

                <div
                  className="editor-row"
                  key={rowIndex}
                >

                  <button
                    className="row-letter"

                    onClick={() =>
                      paintRow(rowIndex)
                    }
                  >
                    {String.fromCharCode(
                      65 + rowIndex
                    )}
                  </button>


                  {row.map(
                    (zone, columnIndex) => (

                      <button
                        key={columnIndex}

                        title={
                          `${String.fromCharCode(
                            65 + rowIndex
                          )}${columnIndex + 1}
                          · ${zone}`
                        }

                        className={
                          `editor-seat ${zone}`
                        }

                        onClick={() =>
                          paint(
                            rowIndex,
                            columnIndex
                          )
                        }
                      >
                        {columnIndex + 1}
                      </button>

                    )
                  )}

                </div>

              )
            )}

          </div>


          {/* RÉSUMÉ */}

          <div className="zone-summary">

            <h2>
              Résumé des zones
            </h2>


            {(
              [
                'vip',
                'standard',
                'economique',
                'bloque'
              ] as Zone[]
            ).map(zone => (

              <div key={zone}>

                <span>
                  {zone === 'economique'
                    ? 'Économique'
                    : zone === 'bloque'
                    ? 'Bloqué'
                    : zone[0].toUpperCase()
                      + zone.slice(1)}
                </span>

                <b>
                  {counts[zone]} siège
                  {counts[zone] !== 1
                    ? 's'
                    : ''}
                </b>

              </div>

            ))}


            <footer>

              <span>
                Capacité totale

                <b>
                  {active} places
                </b>
              </span>


              <span>
                Recette max. estimée

                <b>
                  {revenue.toLocaleString(
                    'fr-FR'
                  )} €
                </b>
              </span>

            </footer>

          </div>


          {error && (

            <p className="form-error">
              <X size={15} />
              {error}
            </p>

          )}


          <div className="wizard-actions">

            <button
              className="ghost-action"
              onClick={() =>
                setStep(1)
              }
            >
              ← Étape précédente
            </button>


            <button
              className="gold-action"
              onClick={() => {

                if (!active) {
                  setError(
                    'Le plan doit contenir au moins une place.'
                  );
                  return;
                }

                setError('');
                setStep(3);

              }}
            >
              Continuer →
            </button>

          </div>

        </div>

      )}


      {/* ==========================
          ÉTAPE 3
      ========================== */}

      {step === 3 && (

        <div className="recap-wrap">


          <div className="recap-hero">

            {form.imageUrl && (

              <img
                src={form.imageUrl}
                alt=""
              />

            )}


            <div>

              <span
                className={
                  `session-type
                  ${form.type === 'theatre'
                    ? 'theatre'
                    : ''}`
                }
              >
                {form.type === 'theatre'
                  ? 'THÉÂTRE'
                  : 'CINÉMA'}
              </span>


              <h1>
                {form.titre}
              </h1>


              <p>
                {form.sousTitre}
              </p>


              <div className="recap-meta">

                <span>
                  <CalendarDays size={14} />

                  {form.date}
                  {' · '}
                  {form.heure}
                </span>


                <span>
                  <Clock3 size={14} />

                  {form.duree} min
                </span>


                <span>
                  <MapPin size={14} />

                  {form.lieu}
                </span>

              </div>

            </div>

          </div>


          <div className="wizard-card recap-room">

            <h2>Plan de salle</h2>


            <div className="recap-big">

              <div>
                <strong>
                  {active}
                </strong>

                <span>
                  places actives
                </span>
              </div>


              <div>
                <strong>
                  {revenue.toLocaleString(
                    'fr-FR'
                  )} €
                </strong>

                <span>
                  recette maximale
                </span>
              </div>

            </div>


            <div className="recap-zones">

              <div>
                <b>{counts.vip}</b>
                <span>
                  VIP
                  <br />
                  45 €
                </span>
              </div>


              <div>
                <b>{counts.standard}</b>
                <span>
                  Standard
                  <br />
                  22 €
                </span>
              </div>


              <div>
                <b>{counts.economique}</b>
                <span>
                  Économique
                  <br />
                  12 €
                </span>
              </div>

            </div>

          </div>


          <p className="publish-note">

            <Check size={16} />

            La séance sera publiée
            immédiatement et visible
            aux spectateurs.

          </p>


          {error && (

            <p className="form-error">
              <X size={15} />
              {error}
            </p>

          )}


          <div className="wizard-actions">

            <button
              className="ghost-action"

              onClick={() =>
                setStep(2)
              }
            >
              ← Étape précédente
            </button>


            <button
              className="gold-action"

              disabled={busy}

              onClick={() =>
                void publish()
              }
            >
              {busy
                ? 'Publication…'
                : '⚡ Publier la séance'}
            </button>

          </div>

        </div>

      )}

    </section>

  );

}


function makeSeats(
  rows: number,
  columns: number
): Zone[][] {

  return Array.from(
    { length: rows },

    () =>
      Array.from(
        { length: columns },
        () => 'standard' as Zone
      )
  );

}


function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {

  return (

    <label className="wizard-field">

      <span>{label}</span>

      {children}

    </label>

  );

}


function Counter({
  label,
  value,
  minus,
  plus
}: {
  label: string;
  value: number;
  minus: () => void;
  plus: () => void;
}) {

  return (

    <div className="seat-counter">

      <span>{label}</span>

      <div>

        <button onClick={minus}>
          <Minus size={14} />
        </button>

        <b>{value}</b>

        <button onClick={plus}>
          <Plus size={14} />
        </button>

      </div>

    </div>

  );

}

