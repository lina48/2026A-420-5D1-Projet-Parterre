import { useEffect, useState } from 'react';
import { Armchair, ArrowRight, Clock3, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionRow from '../components/SessionRow';
import { api } from '../services/api';
import type { Session } from '../types';

export default function ProgrammePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Tout');

  useEffect(() => {
    api<{ seances: Session[] }>('/api/seances')
      .then(({ seances }) => setSessions(seances))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const genres = ['Tout', ...new Set(sessions.map(({ genre }) => genre).filter(Boolean))];
  const visibleSessions = sessions.filter(({ genre }) => filter === 'Tout' || genre === filter);
  const featured = sessions[0];

  return <>
    <section className="intro-row">
      <div><div className="eyebrow"><span className="eyebrow-line" />LA SALLE EST À VOUS</div><h1>Ce soir, <em>on sort.</em></h1><p className="intro-copy">Les belles histoires se vivent mieux ensemble.<br />Choisissez votre séance, gardez votre place.</p></div>
      <div className="intro-note"><span className="intro-note-icon"><Armchair size={19} /></span><span><strong>Votre siège vous attend.</strong><br />Réservez en quelques instants.</span></div>
    </section>
    {featured && <section className="featured-strip" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,11,20,.96) 0%, rgba(8,11,20,.82) 44%, rgba(8,11,20,.08) 100%), url("${featured.image_url}")` }}>
      <div className="feature-copy"><span className="tag tag-gold">À L’AFFICHE</span><h2>{featured.titre}</h2><p>{featured.description}</p><div className="feature-meta"><span><Clock3 size={14} /> {featured.duree_minutes} min</span><span>{featured.genre}</span></div><Link to={`/seances/${featured.id}`} className="button button-gold">Découvrir la séance <ArrowRight size={16} /></Link></div>
      <span className="feature-caption">SÉANCE À LA UNE <span>·</span> {featured.salle.toUpperCase()}</span>
    </section>}
    <section className="programme-section">
      <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" />LE PROGRAMME</div><h2>Les prochaines séances</h2></div><span className="results-count">{sessions.length.toString().padStart(2, '0')} SÉANCES</span></div>
      <p className="muted-copy"><span className="tag tag-gold">DONNÉES DE DÉMONSTRATION</span> Films, affiches et séances d'exemple. Tarif fixe, aucun paiement en ligne.</p>
      <div className="filter-row" role="group" aria-label="Filtrer par genre">{genres.map((genre) => <button key={genre} className={`filter-chip ${filter === genre ? 'active' : ''}`} onClick={() => setFilter(genre)}>{genre}</button>)}</div>
      {loading ? <div className="loading-line">La programmation arrive…</div> : error ? <div className="empty-state"><Film /><p>{error}</p><small>Vérifiez que l’API et PostgreSQL sont démarrés.</small></div> : visibleSessions.length ? <div className="session-list">{visibleSessions.map((session, index) => <SessionRow key={session.id} session={session} index={index} />)}</div> : <div className="empty-state"><Film /><p>Aucune séance dans cette catégorie.</p></div>}
    </section>
  </>;
}
