import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Armchair, ArrowLeft, ArrowRight, Film, LockKeyhole } from 'lucide-react';
import { api } from '../services/api';
import type { Seat, Session, User } from '../types';

type Props = { user: User | null; notify: (message: string) => void };

export default function SeatSelectionPage({ user, notify }: Props) {
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
    if (!user) { navigate('/connexion'); return; }
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
