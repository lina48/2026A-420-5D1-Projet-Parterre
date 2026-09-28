import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Session } from '../types';

export default function SessionRow({ session, index }: { session: Session; index: number }) {
  const date = new Date(session.date_heure);
  const time = date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = date.toLocaleDateString('fr-CA', { weekday: 'short', day: '2-digit', month: 'short' });
  const soldOut = session.places_disponibles === 0;

  return <article className="session-row" style={{ animationDelay: `${index * 70}ms` }}>
    <div className="session-poster" style={{ backgroundImage: `url("${session.image_url}")` }}><span>{session.genre}</span></div>
    <div className="session-info"><h3>{session.titre}</h3><p>{session.duree_minutes} min <span>·</span> {session.genre}</p><div className="venue-line"><MapPin size={13} />{session.salle}</div></div>
    <div className="session-time"><span className="session-date">{dateLabel}</span><strong>{time}</strong><span className="seat-availability">{soldOut ? 'Complet' : `${session.places_disponibles} places`}</span></div>
    <Link className={`row-action ${soldOut ? 'disabled' : ''}`} aria-label={`Réserver ${session.titre}`} to={soldOut ? '#' : `/seances/${session.id}`}><ArrowRight size={19} /></Link>
  </article>;
}
