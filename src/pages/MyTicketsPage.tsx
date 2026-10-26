import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ticket, CalendarDays, Clock3 } from 'lucide-react';
import { api } from '../services/api';
import type { Reservation, User } from '../types';

type Props = {
  user: User | null;
  notify: (message: string) => void;
};

export default function MyTicketsPage({ user, notify }: Props) {
  const [tickets, setTickets] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  async function load() {
    const { reservations } = await api<{ reservations: Reservation[] }>(
      '/api/reservations'
    );
    setTickets(reservations);
  }

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    load()
      .catch((error: Error) => notify(error.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  async function cancel(id: number) {
    try {
      await api(`/api/reservations/${id}`, {
        method: 'DELETE'
      });

      notify('Votre réservation a été annulée.');
      await load();
    } catch (error) {
      notify((error as Error).message);
    }
  }

  const upcomingTickets = tickets
    .filter((ticket) => {
      const sessionDate = new Date(ticket.date_heure).getTime();
      return Number.isFinite(sessionDate) && sessionDate > now;
    })
    .sort(
      (a, b) =>
        new Date(a.date_heure).getTime() -
        new Date(b.date_heure).getTime()
    );

  const pastTickets = tickets
    .filter((ticket) => {
      const sessionDate = new Date(ticket.date_heure).getTime();
      return !Number.isFinite(sessionDate) || sessionDate <= now;
    })
    .sort(
      (a, b) =>
        new Date(b.date_heure).getTime() -
        new Date(a.date_heure).getTime()
    );

  function renderTicket(ticket: Reservation, isPast: boolean) {
    const isCancelled = ticket.statut === 'annulee';
    const isExpired = isPast && !isCancelled;

    const statusLabel = isCancelled
      ? 'ANNULÉ'
      : isExpired
        ? 'EXPIRÉ'
        : 'À VENIR';

    const statusClass = isCancelled
      ? 'ticket-status-cancelled'
      : isExpired
        ? 'ticket-status-expired'
        : 'ticket-status-upcoming';

    return (
      <article
        className={`ticket-card ${
          isCancelled ? 'cancelled' : ''
        } ${isPast ? 'ticket-past' : 'ticket-upcoming'}`}
        key={ticket.id}
      >
        <div
          className="ticket-art"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(8,11,20,.45), transparent), url("${ticket.image_url}")`
          }}
        >
          <Ticket size={19} />
        </div>

        <div className="ticket-details">
          <div className="ticket-title-row">
            <h2>{ticket.titre}</h2>

            <span className={`ticket-status ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          <p>
            {new Date(ticket.date_heure).toLocaleDateString(
              'fr-CA',
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }
            )}
            {' · '}
            {new Date(ticket.date_heure).toLocaleTimeString(
              'fr-CA',
              {
                hour: '2-digit',
                minute: '2-digit'
              }
            )}
          </p>

          <div className="ticket-bottom">
            <span className="seat-code">
              {ticket.places
                .map(
                  ({ rangee, numero }) =>
                    `${rangee}${numero}`
                )
                .join(' · ')}
            </span>

            <span className="ticket-ref">
              {ticket.code_billet}
            </span>
          </div>
        </div>

        <div className="ticket-price">
          <strong>
            {Number(ticket.montant_total)
              .toFixed(2)
              .replace('.', ',')} $
          </strong>

          {!isPast && !isCancelled && (
            <button onClick={() => cancel(ticket.id)}>
              Annuler
            </button>
          )}

          {isPast && !isCancelled && (
            <span className="ticket-expired-note">
              Billet expiré
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <section className="tickets-page">
      <div className="eyebrow">
        <span className="eyebrow-line" />
        VOTRE CARNET
      </div>

      <div className="section-heading">
        <h1>Mes billets</h1>

        <Link to="/" className="text-link">
          Voir le programme
          <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div className="loading-line">
          Recherche de vos billets…
        </div>
      ) : !user ? (
        <div className="empty-state">
          <Ticket />
          <p>Connectez-vous pour voir vos billets.</p>
          <Link to="/connexion">Se connecter</Link>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <Ticket />
          <p>Pas encore de billet dans votre carnet.</p>
          <Link to="/">
            Trouver une séance
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="tickets-sections">

          <div className="tickets-section">
            <div className="tickets-section-heading">
              <div>
                <CalendarDays size={19} />
                <h2>Billets à venir</h2>
              </div>

              <span className="tickets-count">
                {upcomingTickets.length}
              </span>
            </div>

            {upcomingTickets.length > 0 ? (
              <div className="ticket-list">
                {upcomingTickets.map((ticket) =>
                  renderTicket(ticket, false)
                )}
              </div>
            ) : (
              <div className="tickets-section-empty">
                Vous n'avez aucun billet à venir.
              </div>
            )}
          </div>

          <div className="tickets-section">
            <div className="tickets-section-heading">
              <div>
                <Clock3 size={19} />
                <h2>Billets passés</h2>
              </div>

              <span className="tickets-count">
                {pastTickets.length}
              </span>
            </div>

            {pastTickets.length > 0 ? (
              <div className="ticket-list">
                {pastTickets.map((ticket) =>
                  renderTicket(ticket, true)
                )}
              </div>
            ) : (
              <div className="tickets-section-empty">
                Aucun billet passé pour le moment.
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  );
}
