import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Armchair, ArrowLeft, ArrowRight, Check, Clapperboard, Clock3, Film, LockKeyhole, LogOut, MapPin, Plus, Ticket, X } from 'lucide-react';

type User = { id: number; nom: string; courriel: string; role: 'spectateur' | 'gestionnaire' };
type Session = { id: number; date_heure: string; statut: string; salle: string; titre: string; genre: string; duree_minutes: number; image_url: string; description: string; capacite: number; places_disponibles: number };
type Seat = { id: number; rangee: string; numero: number; type: string; etat: 'libre' | 'retenue' | 'vendue'; retenue_active?: boolean };
type Reservation = { id: number; code_billet: string; montant_total: number; creee_le: string; statut: string; date_heure: string; titre: string; image_url: string; places: Array<{ rangee: string; numero: number }> };

const TOKEN_KEY = 'parterre-token';
const savedUser = localStorage.getItem('parterre-user');
const initialUser: User | null = savedUser ? JSON.parse(savedUser) as User : null;

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? 'Une erreur est survenue.');
  return result as T;
}

function App() {
  const [user, setUser] = useState<User | null>(initialUser);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('parterre-user');
    setUser(null);
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Parterre, accueil"><span className="brand-mark"><Clapperboard size={19} /></span><span>parterre<span className="brand-period">.</span></span></Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <NavLink to="/" end>Programmation</NavLink>
          {user && <NavLink to="/mes-reservations">Mes billets</NavLink>}
          {user?.role === 'gestionnaire' && <NavLink to="/gestion/seances/nouvelle">Gestion</NavLink>}
        </nav>
        <div className="account-area">
          {user && <><span className="account-name"><span className="online-dot" />{user.nom.split(' ')[0]}</span><button className="icon-button" title="Déconnexion" onClick={signOut}><LogOut size={17} /></button></>}
        </div>
      </header>
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Programme />} />
          <Route path="/seances/:id" element={<Selection user={user} notify={setToast} />} />
          <Route path="/mes-reservations" element={<MyTickets user={user} notify={setToast} />} />
          <Route path="/gestion/seances/nouvelle" element={<CreateSession user={user} notify={setToast} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer"><span>PAR TERRE, AU PREMIER RANG.</span><span>Une séance, une histoire.</span></footer>
      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </>
  );
}

function Programme() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Tout');
  useEffect(() => { api<{ seances: Session[] }>('/api/seances').then(({ seances }) => setSessions(seances)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  const genres = ['Tout', ...new Set(sessions.map(({ genre }) => genre).filter(Boolean))];
  const visibleSessions = sessions.filter(({ genre }) => filter === 'Tout' || genre === filter);
  const featured = sessions[0];

  return (
    <>
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
        <div className="filter-row" role="group" aria-label="Filtrer par genre">{genres.map((genre) => <button key={genre} className={`filter-chip ${filter === genre ? 'active' : ''}`} onClick={() => setFilter(genre)}>{genre}</button>)}</div>
        {loading ? <div className="loading-line">La programmation arrive…</div> : error ? <div className="empty-state"><Film /><p>{error}</p><small>Vérifiez que l’API et PostgreSQL sont démarrés.</small></div> : visibleSessions.length ? <div className="session-list">{visibleSessions.map((session, index) => <SessionRow key={session.id} session={session} index={index} />)}</div> : <div className="empty-state"><Film /><p>Aucune séance dans cette catégorie.</p></div>}
      </section>
    </>
  );
}

function SessionRow({ session, index }: { session: Session; index: number }) {
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

function Selection({ user, notify }: { user: User | null; notify: (message: string) => void }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refreshSeats() {
    const result = await api<{ places: Seat[] }>(`/api/seances/${id}/plan`);
    setSeats(result.places);
  }
  useEffect(() => {
    setLoading(true);
    Promise.all([api<{ seances: Session[] }>('/api/seances'), api<{ places: Seat[] }>(`/api/seances/${id}/plan`)]).then(([schedule, plan]) => {
      setSession(schedule.seances.find((show) => String(show.id) === id) ?? null);
      setSeats(plan.places);
    }).catch((error: Error) => notify(error.message)).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    const socket = io();
    socket.emit('seance:rejoindre', id);
    socket.on('place:etat_change', (change: { id: number; etat: Seat['etat'] }) => {
      setSeats((current) => current.map((seat) => seat.id === change.id ? { ...seat, etat: change.etat } : seat));
      if (change.etat === 'vendue' || change.etat === 'libre') setSelected((current) => current.filter((seatId) => seatId !== change.id));
    });
    socket.on('place:retenue_expiree', (change: { id: number }) => setSeats((current) => current.map((seat) => seat.id === change.id ? { ...seat, etat: 'libre' } : seat)));
    return () => { socket.emit('seance:quitter', id); socket.disconnect(); };
  }, [id]);

  async function chooseSeat(seat: Seat) {
    if (seat.etat === 'vendue' || (seat.etat === 'retenue' && !selected.includes(seat.id))) return;
    if (selected.includes(seat.id)) { setSelected((current) => current.filter((seatId) => seatId !== seat.id)); return; }
    if (!user) { notify('La connexion sera disponible dans une prochaine branche.'); return; }
    setBusy(true);
    try {
      await api(`/api/seances/${id}/places/${seat.id}/retenir`, { method: 'POST' });
      setSelected((current) => [...current, seat.id]);
      setSeats((current) => current.map((item) => item.id === seat.id ? { ...item, etat: 'retenue' } : item));
    } catch (error) { notify((error as Error).message); await refreshSeats(); }
    finally { setBusy(false); }
  }

  async function book() {
    if (!selected.length) return;
    setBusy(true);
    try {
      const result = await api<{ reservation: { code_billet: string } }>('/api/reservations', { method: 'POST', body: JSON.stringify({ seanceId: Number(id), placeIds: selected }) });
      notify(`Réservation confirmée · ${result.reservation.code_billet}`);
      navigate('/mes-reservations');
    } catch (error) { notify((error as Error).message); await refreshSeats(); }
    finally { setBusy(false); }
  }

  const grouped = useMemo(() => [...new Set(seats.map((seat) => seat.rangee))].sort().map((row) => ({ row, seats: seats.filter((seat) => seat.rangee === row).sort((a, b) => a.numero - b.numero) })), [seats]);
  if (loading) return <div className="loading-line">Ouverture de la salle…</div>;
  if (!session) return <div className="empty-state"><Film /><p>Séance introuvable.</p><Link to="/">Retour au programme</Link></div>;
  const chosenSeats = seats.filter((seat) => selected.includes(seat.id));
  const date = new Date(session.date_heure);

  return <section className="booking-page">
    <Link className="back-link" to="/"><ArrowLeft size={16} />Retour au programme</Link>
    <div className="booking-heading"><div><div className="eyebrow"><span className="eyebrow-line" />VOTRE SOIRÉE</div><h1>{session.titre}</h1><p>{date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} <span>·</span> {date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} <span>·</span> {session.salle}</p></div><span className="live-label"><span className="live-pulse" />PLAN EN DIRECT</span></div>
    <div className="booking-layout"><div className="seat-panel"><div className="screen-wrap"><div className="screen-glow" /><div className="screen-line" /><span>ÉCRAN</span></div><div className="seat-grid" aria-label="Plan des places">
      {grouped.map(({ row, seats: rowSeats }) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{rowSeats.map((seat) => <button key={seat.id} disabled={busy || seat.etat === 'vendue' || (seat.etat === 'retenue' && !selected.includes(seat.id))} onClick={() => chooseSeat(seat)} className={`seat ${seat.etat} ${selected.includes(seat.id) ? 'selected' : ''} ${seat.type === 'accessible' ? 'accessible' : ''}`} title={`${row}${seat.numero} · ${seat.etat}`} aria-label={`Place ${row}${seat.numero}, ${seat.etat}`}>{seat.type === 'accessible' ? <Armchair size={12} /> : seat.numero}</button>)}</div>)}
    </div><div className="seat-legend"><span><i className="legend-seat free" />Disponible</span><span><i className="legend-seat chosen" />Votre choix</span><span><i className="legend-seat held" />En cours</span><span><i className="legend-seat sold" />Réservé</span></div><p className="seat-help"><LockKeyhole size={14} />Votre sélection est gardée pendant 8 minutes.</p></div>
      <aside className="summary-panel"><span className="summary-kicker">RÉCAPITULATIF</span><div className="summary-title"><span className="summary-poster" style={{ backgroundImage: `url("${session.image_url}")` }} /><div><strong>{session.titre}</strong><span>{date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })} · {date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="summary-divider" /><div className="selection-label"><span>Vos places</span><span>{selected.length} / 8</span></div><div className="chosen-seats">{chosenSeats.length ? chosenSeats.map((seat) => <span className="chosen-pill" key={seat.id}>{seat.rangee}{seat.numero}</span>) : <span className="muted-copy">Choisissez vos sièges dans le plan</span>}</div><div className="summary-divider" /><div className="total-line"><span>Total <small>· paiement sur place</small></span><strong>{(selected.length * 14.5).toFixed(2).replace('.', ',')} $</strong></div><button className="button button-gold button-wide" disabled={!selected.length || busy} onClick={book}>{busy ? 'Un instant…' : <>Confirmer les places <ArrowRight size={16} /></>}</button><p className="secure-note"><LockKeyhole size={12} />Réservation sécurisée, sans paiement en ligne</p></aside>
    </div>
  </section>;
}

function MyTickets({ user, notify }: { user: User | null; notify: (message: string) => void }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { return api<{ reservations: Reservation[] }>('/api/reservations').then(({ reservations }) => setTickets(reservations)); }
  useEffect(() => { if (!user) { setLoading(false); return; } load().catch((error: Error) => notify(error.message)).finally(() => setLoading(false)); }, [user]);
  async function cancel(id: number) {
    try { await api(`/api/reservations/${id}`, { method: 'DELETE' }); notify('Votre réservation a été annulée.'); await load(); }
    catch (error) { notify((error as Error).message); }
  }
  return <section className="tickets-page"><div className="eyebrow"><span className="eyebrow-line" />VOTRE CARNET</div><div className="section-heading"><h1>Mes billets</h1><Link to="/" className="text-link">Voir le programme <ArrowRight size={15} /></Link></div>{loading ? <div className="loading-line">Recherche de vos billets…</div> : !user ? <div className="empty-state"><Ticket /><p>La connexion sera disponible dans une prochaine branche.</p></div> : tickets.length ? <div className="ticket-list">{tickets.map((ticket) => <article className={`ticket-card ${ticket.statut === 'annulee' ? 'cancelled' : ''}`} key={ticket.id}><div className="ticket-art" style={{ backgroundImage: `linear-gradient(0deg, rgba(8,11,20,.45), transparent), url("${ticket.image_url}")` }}><Ticket size={19} /></div><div className="ticket-details"><div className="ticket-title-row"><h2>{ticket.titre}</h2><span className={`tag ${ticket.statut === 'confirmee' ? 'tag-green' : 'tag-red'}`}>{ticket.statut === 'confirmee' ? 'CONFIRMÉ' : 'ANNULÉ'}</span></div><p>{new Date(ticket.date_heure).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} · {new Date(ticket.date_heure).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</p><div className="ticket-bottom"><span className="seat-code">{ticket.places.map(({ rangee, numero }) => `${rangee}${numero}`).join('  ·  ')}</span><span className="ticket-ref">{ticket.code_billet}</span></div></div><div className="ticket-price"><strong>{Number(ticket.montant_total).toFixed(2).replace('.', ',')} $</strong>{ticket.statut === 'confirmee' && new Date(ticket.date_heure) > new Date() && <button onClick={() => cancel(ticket.id)}>Annuler</button>}</div></article>)}</div> : <div className="empty-state"><Ticket /><p>Pas encore de billet dans votre carnet.</p><Link to="/">Trouver une séance <ArrowRight size={15} /></Link></div>}</section>;
}

function CreateSession({ user, notify }: { user: User | null; notify: (message: string) => void }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!user || user.role !== 'gestionnaire') navigate('/'); }, [user]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const values = new FormData(event.currentTarget);
    try {
      await api('/api/seances', { method: 'POST', body: JSON.stringify({ titre: values.get('titre'), genre: values.get('genre'), dureeMinutes: values.get('duree'), dateHeure: values.get('date') }) });
      notify('La séance et son plan de salle sont créés.'); navigate('/');
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="admin-page"><Link className="back-link" to="/"><ArrowLeft size={16} />Retour au programme</Link><div className="eyebrow"><span className="eyebrow-line" />ESPACE GESTIONNAIRE</div><h1>Programmer une séance</h1><p className="admin-intro">Une nouvelle histoire à l’affiche. La salle Lumière et ses 72 places seront ajoutées automatiquement.</p><form className="admin-form" onSubmit={submit}><label>Titre du film<input name="titre" placeholder="Le nom du film" required /></label><div className="form-columns"><label>Genre<select name="genre"><option>Drame</option><option>Comédie</option><option>Science-fiction</option><option>Théâtre</option><option>Documentaire</option></select></label><label>Durée (minutes)<input name="duree" type="number" min="30" max="300" defaultValue="110" required /></label></div><label>Date et heure<input name="date" type="datetime-local" min={new Date().toISOString().slice(0, 16)} required /></label>{error && <p className="form-error"><X size={15} />{error}</p>}<button className="button button-gold" disabled={busy}><Plus size={17} />{busy ? 'Création…' : 'Créer la séance'}</button></form></section>;
}

function NotFound() { return <div className="empty-state"><Film /><p>Cette page n’existe pas.</p><Link to="/">Retour au programme</Link></div>; }

export default App;