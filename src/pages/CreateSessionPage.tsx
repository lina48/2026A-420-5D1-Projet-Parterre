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
  | 'bloque';


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
          bloque: 0
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


          <div className="seat-settings">

            <Counter
              label="RANGS"
              value={rows}

              minus={() =>
                setRows(
                  Math.max(1, rows - 1)
                )
              }

              plus={() =>
                setRows(
                  Math.min(20, rows + 1)
                )
              }
            />


            <Counter
              label="SIÈGES PAR RANG"
              value={perRow}

              minus={() =>
                setPerRow(
                  Math.max(
                    1,
                    perRow - 1
                  )
                )
              }

              plus={() =>
                setPerRow(
                  Math.min(
                    24,
                    perRow + 1
                  )
                )
              }
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
                'bloque'
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

                  : 'Bloqué'
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
              onClick={() =>
                setStep(3)
              }
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

