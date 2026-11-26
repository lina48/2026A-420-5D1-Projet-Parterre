
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

type Props = { user: User | null };

type Seance = {
  id: number;
  date_heure: string;
  statut: string;
  titre: string;
  salle: string;
  lieu: string | null;
  reservations_confirmees: number;
};

type Modification = {
  id: number;
  ancienne_date_heure: string;
  nouvelle_date_heure: string;
  motif: string | null;
  creee_le: string;
  total: number;
  envoyes: number;
  echecs: number;
  en_attente: number;
};

function toLocalDateInput(isoDate: string) {
  const date = new Date(isoDate);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString('fr-CA', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

export default function EditSessionPage({ user }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seance, setSeance] = useState<Seance | null>(null);
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [dateHeure, setDateHeure] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  async function load() {
    const [details, history] = await Promise.all([
      api<{ seance: Seance }>(`/api/gestion/seances/${id}/modifier`),
      api<{ modifications: Modification[] }>(
        `/api/gestion/seances/${id}/modifications`
      ),
    ]);

    setSeance(details.seance);
    setDateHeure(toLocalDateInput(details.seance.date_heure));
    setModifications(history.modifications);
  }

  useEffect(() => {
    if (!user || user.role !== 'gestionnaire') {
      navigate('/');
      return;
    }

    setLoading(true);
    load()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setFeedback('');

    if (!dateHeure) {
      setError('Choisissez une date et une heure.');
      return;
    }

    const starts = new Date(dateHeure);

    if (!Number.isFinite(starts.getTime()) || starts.getTime() <= Date.now()) {
      setError('Choisissez une date future.');
      return;
    }

    const confirmed = window.confirm(
      `Confirmer le déplacement de la séance au ${formatDate(starts.toISOString())} ? Les clients ayant réservé seront informés par courriel.`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const result = await api<{ destinataires: number }>(
        `/api/gestion/seances/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            dateHeure: starts.toISOString(),
            motif,
          }),
        }
      );

      setMotif('');
      setFeedback(
        `Séance modifiée. ${result.destinataires} courriel(s) programmé(s) pour les réservations confirmées.`
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function retry() {
    setError('');

    try {
      const result = await api<{ relancees: number }>(
        `/api/gestion/seances/${id}/notifications/reessayer`,
        { method: 'POST' }
      );

      setFeedback(`${result.relancees} notification(s) relancée(s).`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!user || user.role !== 'gestionnaire') return null;

  return (
    <section className="edit-session-page">
      <Link className="edit-session-back" to="/gestion">
        <ArrowLeft size={16} />
        Retour au dashboard
      </Link>

      <h1>Modifier une séance</h1>
      <p className="edit-session-subtitle">
        Modifiez la date ou l'heure sans annuler les billets déjà achetés.
      </p>

      {loading ? (
        <p>Chargement…</p>
      ) : !seance ? (
        <p>Impossible de charger la séance.</p>
      ) : (
        <>
          <div className="edit-session-panel">
            <h2>{seance.titre}</h2>

            <div className="edit-session-meta">
              <span>
                {seance.salle}
                {seance.lieu ? ` · ${seance.lieu}` : ''}
              </span>
              <span>
                {seance.reservations_confirmees} réservation(s) confirmée(s)
              </span>
              <span>{seance.statut}</span>
            </div>

            <p className="edit-session-hint">
              Date actuelle : <strong>{formatDate(seance.date_heure)}</strong>
            </p>

            <p className="edit-session-warning">
              Les clients recevront l'ancienne et la nouvelle date.
              Les places, la salle et les QR codes restent identiques.
            </p>

            <form onSubmit={(event) => void submit(event)}>
              <div className="edit-session-field">
                <label htmlFor="edit-datetime">
                  Nouvelle date et heure
                </label>

                <input
                  id="edit-datetime"
                  type="datetime-local"
                  required
                  value={dateHeure}
                  onChange={(event) => setDateHeure(event.target.value)}
                  disabled={
                    saving ||
                    seance.statut !== 'ouverte' ||
                    new Date(seance.date_heure).getTime() <= Date.now()
                  }
                />
              </div>

              <div className="edit-session-field">
                <label htmlFor="edit-reason">
                  Motif de la modification (facultatif)
                </label>

                <textarea
                  id="edit-reason"
                  maxLength={500}
                  placeholder="Ex. : changement d'horaire du spectacle"
                  value={motif}
                  onChange={(event) => setMotif(event.target.value)}
                  disabled={saving}
                />
              </div>

              {error && (
                <p role="alert" className="edit-session-error">
                  {error}
                </p>
              )}

              {feedback && (
                <p role="status" className="edit-session-warning">
                  {feedback}
                </p>
              )}

              <div className="edit-session-actions">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    seance.statut !== 'ouverte' ||
                    new Date(seance.date_heure).getTime() <= Date.now()
                  }
                >
                  <CalendarClock size={15} />
                  {saving
                    ? 'Enregistrement…'
                    : 'Enregistrer et notifier les clients'}
                </button>
                <Link to="/gestion">Annuler</Link>
              </div>
            </form>
          </div>

          <div className="edit-session-panel">
            <h2>Historique et courriels</h2>

            {modifications.length === 0 ? (
              <p className="edit-session-hint">
                Aucune modification enregistrée.
              </p>
            ) : (
              <div className="edit-session-history">
                {modifications.map((entry) => (
                  <div className="edit-session-history-item" key={entry.id}>
                    <strong>
                      {formatDate(entry.ancienne_date_heure)}
                      {' → '}
                      {formatDate(entry.nouvelle_date_heure)}
                    </strong>

                    {entry.motif && <p>Motif : {entry.motif}</p>}

                    <p>
                      Notifications : {entry.envoyes} envoyée(s),
                      {' '}{entry.en_attente} en attente,
                      {' '}{entry.echecs} en échec,
                      {' '}sur {entry.total}.
                    </p>

                    {entry.echecs > 0 ? (
                      <small className="email-error">
                        Certains courriels n'ont pas pu être envoyés.
                      </small>
                    ) : (
                      <small>Historique enregistré</small>
                    )}
                  </div>
                ))}
              </div>
            )}

            {modifications.some((entry) => entry.echecs > 0) && (
              <button
                className="edit-session-retry"
                onClick={() => void retry()}
              >
                Réessayer les courriels en échec
              </button>
            )}

            <button
              className="edit-session-retry"
              onClick={() => void load()}
            >
              Actualiser les statuts
            </button>
          </div>
        </>
      )}

      {error && !seance && (
        <p role="alert" className="edit-session-error">
          {error}
        </p>
      )}
    </section>
  );
}
