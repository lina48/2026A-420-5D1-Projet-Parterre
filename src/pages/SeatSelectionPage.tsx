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
  const [expiry, setExpiry] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('···');

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
    socket.on('place:etat_change', (change: { id: number; etat: Seat['etat']; expireA?: string | null }) => {
      setSeats((current) => current.map((seat) => seat.id === change.id ? {
        ...seat,
        etat: change.etat,
        retenue_expire_a: change.etat === 'retenue' ? (change.expireA ?? seat.retenue_expire_a) : null,
      } : seat));
      if (change.etat === 'vendue' || change.etat === 'libre') setSelected((current) => current.filter((seatId) => seatId !== change.id));
    });
    socket.on('place:retenue_expiree', (change: { id: number }) => {
      setSeats((current) => current.map((seat) => seat.id === change.id ? { ...seat, etat: 'libre', retenue_expire_a: null } : seat));
      setSelected((current) => current.filter((seatId) => seatId !== change.id));
    });
    return () => { socket.emit('seance:quitter', id); socket.disconnect(); };
  }, [id]);

  async function chooseSeat(seat: Seat) {
    if (seat.etat === 'vendue' || (seat.etat === 'retenue' && !selected.includes(seat.id))) return;
    if (selected.includes(seat.id)) { setSelected((current) => current.filter((seatId) => seatId !== seat.id)); return; }
    if (!user) { navigate('/connexion'); return; }
    setBusy(true);
    try {
      const result = await api<{ place: { expireA?: string } }>(`/api/seances/${id}/places/${seat.id}/retenir`, { method: 'POST' });
      const expiresAt = result.place.expireA ? new Date(result.place.expireA).toISOString() : new Date(Date.now() + 5 * 60 * 1000).toISOString();
      setSelected((current) => [...current, seat.id]);
      setSeats((current) => current.map((item) => item.id === seat.id ? {
        ...item,
        etat: 'retenue',
        retenue_expire_a: expiresAt,
      } : item));
    } catch (error) { notify((error as Error).message); await refreshSeats(); }
    finally { setBusy(false); }
  }

  async function book() {
    if (!selected.length) return;
    setBusy(true);
    try {
      const result = await api<{ reservation: { code_billet: string } }>('/api/reservations', { method: 'POST', body: JSON.stringify({ seanceId: Number(id), placeIds: selected }) });
      notify(`Réservation confirmée · ${result.reservation.code_billet}`);
      setExpiry(null);
      setRemaining(0);
      navigate('/mes-reservations');
    } catch (error) { notify((error as Error).message); await refreshSeats(); }
    finally { setBusy(false); }
  }

  const selectedExpiry = useMemo(() => {
    const timestamps = selected
      .map((seatId) => {
        const seat = seats.find((item) => item.id === seatId);
        return seat?.retenue_expire_a ? new Date(seat.retenue_expire_a).getTime() : null;
      })
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    if (!timestamps.length) return null;
    return Math.min(...timestamps);
  }, [selected, seats]);

  useEffect(() => {
    setExpiry(selectedExpiry);
    if (!selectedExpiry) setRemaining(0);
  }, [selectedExpiry]);

  useEffect(() => {
    if (!expiry) return;
    const deadline = expiry;

    function update() {
      const secs = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(secs);
    }

    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [expiry]);

  useEffect(() => {
    if (!expiry || remaining > 0) return;
    setSelected((current) => current.filter((seatId) => {
      const seat = seats.find((item) => item.id === seatId);
      return Boolean(seat?.retenue_expire_a && new Date(seat.retenue_expire_a).getTime() > Date.now());
    }));
    if (selected.length) {
      notify('Votre retenue de 5 minutes est expirée. Les places sont de nouveau disponibles.');
    }
    refreshSeats().catch(() => {});
  }, [remaining, expiry, seats, selected, notify]);

  function formatRemaining(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(1, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const grouped = useMemo(() => [...new Set(seats.map((seat) => seat.rangee))].sort().map((row) => ({ row, seats: seats.filter((seat) => seat.rangee === row).sort((a, b) => a.numero - b.numero) })), [seats]);
  const chosenSeats = seats.filter((seat) => selected.includes(seat.id));
  const seatSummary = chosenSeats.map((seat) => `${seat.rangee}${seat.numero}`).join(', ');
  const totalAmount = (selected.length * 14.5).toFixed(2).replace('.', ',');

  if (loading) return <div className="loading-line">Ouverture de la salle…</div>;
  if (!session) return <div className="empty-state"><Film /><p>Séance introuvable.</p><Link to="/">Retour au programme</Link></div>;
  const date = new Date(session.date_heure);

  return <section className="booking-page">
    <Link className="back-link" to="/"><ArrowLeft size={16} />Retour au programme</Link>
    <div className="booking-heading"><div><div className="eyebrow"><span className="eyebrow-line" />VOTRE SOIRÉE</div><h1>{session.titre}</h1><p>{date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} <span>·</span> {date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} <span>·</span> {session.salle}</p></div><span className="live-label"><span className="live-pulse" />PLAN EN DIRECT</span></div>
    <div className="booking-layout"><div className="seat-panel"><div className="screen-wrap"><div className="screen-glow" /><div className="screen-line" /><span>ÉCRAN</span></div><div className="seat-grid" aria-label="Plan des places">
      {grouped.map(({ row, seats: rowSeats }) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{rowSeats.map((seat) => <button key={seat.id} disabled={busy || seat.etat === 'vendue' || (seat.etat === 'retenue' && !selected.includes(seat.id))} onClick={() => chooseSeat(seat)} className={`seat ${seat.etat} ${selected.includes(seat.id) ? 'selected' : ''} ${seat.type === 'accessible' ? 'accessible' : ''}`} title={`${row}${seat.numero} · ${seat.etat}`} aria-label={`Place ${row}${seat.numero}, ${seat.etat}`}>{seat.type === 'accessible' ? <Armchair size={12} /> : seat.numero}</button>)}</div>)}
    </div><div className="seat-legend"><span><i className="legend-seat free" />Disponible</span><span><i className="legend-seat chosen" />Votre choix</span><span><i className="legend-seat held" />En cours</span><span><i className="legend-seat sold" />Réservé</span></div><p className="seat-help"><LockKeyhole size={14} />{expiry ? <>Votre sélection expire dans <strong>{formatRemaining(remaining)}</strong>.</> : <>Votre sélection est gardée pendant 5 minutes.</>}</p></div>
      <aside className="summary-panel"><span className="summary-kicker">RÉCAPITULATIF</span><div className="summary-title"><span className="summary-poster" style={{ backgroundImage: `url("${session.image_url}")` }} /><div><strong>{session.titre}</strong><span>{date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })} · {date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="summary-divider" /><div className="selection-label"><span>Vos places</span><span>{selected.length} / 8</span></div><div className="chosen-seats">{chosenSeats.length ? chosenSeats.map((seat) => <span className="chosen-pill" key={seat.id}>{seat.rangee}{seat.numero}</span>) : <span className="muted-copy">Choisissez vos sièges dans le plan</span>}</div><div className="summary-divider" /><div className="total-line"><span>Total <small>· paiement sur place</small></span><strong>{totalAmount} $</strong></div><button className="button button-gold button-wide" disabled={!selected.length || busy} onClick={() => setCheckoutOpen(true)}>{busy ? 'Un instant…' : <>Passer à la caisse <ArrowRight size={16} /></>}</button><p className="secure-note"><LockKeyhole size={12} />Réservation sécurisée, sans paiement en ligne</p></aside>
    </div>

    {checkoutOpen && (
      <div className="payment-overlay" onClick={() => setCheckoutOpen(false)}>
        <div className="payment-card" onClick={(event) => event.stopPropagation()}>
          <div className="payment-header">
            <div>
              <h2>Paiement</h2>
              <p>Réservation sécurisée</p>
            </div>
            <button type="button" className="payment-close" onClick={() => setCheckoutOpen(false)} aria-label="Fermer la caisse">×</button>
          </div>

          <div className="payment-summary-block">
            <div className="payment-section-label">Récapitulatif</div>
            <div className="payment-line">
              <span>{session.titre} · {seatSummary || 'Place sélectionnée'}</span>
              <strong>{totalAmount} €</strong>
            </div>
            <div className="payment-line payment-line-total">
              <span>Total</span>
              <strong>{totalAmount} €</strong>
            </div>
          </div>

          <div className="payment-form">
            <label>
              <span>NUMÉRO DE CARTE</span>
              <div className="card-input card-input-number">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9Zm2 .5h14v2H5V8Zm0 4h8v2H5v-2Z"/></svg>
                <input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="4242 4242 4242 4242" />
              </div>
            </label>

            <div className="payment-inline-fields">
              <label>
                <span>EXPIRATION</span>
                <input value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} placeholder="12/28" />
              </label>

              <label>
                <span>CVV</span>
                <input value={cardCvv} onChange={(event) => setCardCvv(event.target.value)} placeholder="···" />
              </label>
            </div>

            <label className="payment-checkbox">
              <input type="checkbox" defaultChecked />
              <span>Paiement 3D Secure · Données chiffrées</span>
            </label>
          </div>

          <div className="payment-actions">
            <button type="button" className="payment-cancel" onClick={() => setCheckoutOpen(false)}>Annuler</button>
            <button type="button" className="button button-gold payment-confirm" onClick={() => { setCheckoutOpen(false); void book(); }} disabled={busy}>
              <span className="payment-icon">$</span>
              {busy ? 'Un instant…' : `Confirmer — ${totalAmount} €`}
            </button>
          </div>
        </div>
      </div>
    )}
  </section>;
}
