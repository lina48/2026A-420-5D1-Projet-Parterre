import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ticket } from 'lucide-react';
import { api } from '../services/api';
import type { Reservation, User } from '../types';

type Props = { user: User | null; notify: (message: string) => void };

export default function MyTicketsPage({ user, notify }: Props) {
  const [tickets, setTickets] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    return api<{ reservations: Reservation[] }>('/api/reservations').then(({ reservations }) => setTickets(reservations));
  }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load().catch((error: Error) => notify(error.message)).finally(() => setLoading(false));
  }, [user]);

  async function cancel(id: number) {
    try {
      await api(`/api/reservations/${id}`, { method: 'DELETE' });
      notify('Votre réservation a été annulée.');
      await load();
    } catch (error) { notify((error as Error).message); }
  }

  return <section className="tickets-page">
    <div className="eyebrow"><span className="eyebrow-line" />VOTRE CARNET</div>
    <div className="section-heading"><h1>Mes billets</h1><Link to="/" className="text-link">Voir le programme <ArrowRight size={15} /></Link></div>
    {loading ? <div className="loading-line">Recherche de vos billets…</div> : !user ? <div className="empty-state"><Ticket /><p>Connectez-vous pour voir vos billets.</p><Link to="/connexion">Se connecter</Link></div> : tickets.length ? <div className="ticket-list">{tickets.map((ticket) => <article className={`ticket-card ${ticket.statut === 'annulee' ? 'cancelled' : ''}`} key={ticket.id}>
      <div className="ticket-art" style={{ backgroundImage: `linear-gradient(0deg, rgba(8,11,20,.45), transparent), url("${ticket.image_url}")` }}><Ticket size={19} /></div>
      <div className="ticket-details"><div className="ticket-title-row"><h2>{ticket.titre}</h2><span className={`tag ${ticket.statut === 'confirmee' ? 'tag-green' : 'tag-red'}`}>{ticket.statut === 'confirmee' ? 'CONFIRMÉ' : 'ANNULÉ'}</span></div>
        <p>{new Date(ticket.date_heure).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} · {new Date(ticket.date_heure).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</p>
        <div className="ticket-bottom"><span className="seat-code">{ticket.places.map(({ rangee, numero }) => `${rangee}${numero}`).join('  ·  ')}</span><span className="ticket-ref">{ticket.code_billet}</span></div>
      </div>
      <div className="ticket-price"><strong>{Number(ticket.montant_total).toFixed(2).replace('.', ',')} $</strong>{ticket.statut === 'confirmee' && new Date(ticket.date_heure) > new Date() && <button onClick={() => cancel(ticket.id)}>Annuler</button>}</div>
    </article>)}</div> : <div className="empty-state"><Ticket /><p>Pas encore de billet dans votre carnet.</p><Link to="/">Trouver une séance <ArrowRight size={15} /></Link></div>}
  </section>;
}
