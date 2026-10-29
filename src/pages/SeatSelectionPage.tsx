
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Armchair, ArrowLeft, ArrowRight, Clock3, Film, LockKeyhole, CreditCard, X } from 'lucide-react';
import { api } from '../services/api';
import type { Seat, Session, User } from '../types';

type Props = { user: User | null; notify: (message: string) => void };

type FakePayment = {
  firstName: string;
  lastName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

const emptyPayment: FakePayment = {
  firstName: '',
  lastName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: ''
};

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
  const seatVersion = useRef(0);
  const refreshVersion = useRef(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState<FakePayment>(emptyPayment);
  const [paymentError, setPaymentError] = useState('');
  const isManager = user?.role === 'gestionnaire';

  async function refreshSeats() {
    const version = seatVersion.current;
    const requestVersion = ++refreshVersion.current;
    const result = await api<{ places: Seat[] }>(`/api/seances/${id}/plan`);
    if (version === seatVersion.current && requestVersion === refreshVersion.current) setSeats(result.places);
  }

  useEffect(() => {
    setLoading(true);
    const version = seatVersion.current;
    const requestVersion = ++refreshVersion.current;
    Promise.all([
      api<{ seances: Session[] }>('/api/seances'),
      api<{ places: Seat[] }>(`/api/seances/${id}/plan`)
    ]).then(([schedule, plan]) => {
      setSession(schedule.seances.find((show) => String(show.id) === id) ?? null);
      if (version === seatVersion.current && requestVersion === refreshVersion.current) setSeats(plan.places);
    }).catch((error: Error) => notify(error.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const socket = io();

    const synchronizeSeats = () => {
      socket.emit('seance:rejoindre', id);
      refreshSeats().catch((error: Error) => notify(error.message));
    };

    socket.on('connect', synchronizeSeats);

    socket.on('place:etat_change', (change: {
      id: number;
      etat: Seat['etat'];
      expireA?: string | null;
    }) => {
      seatVersion.current += 1;
      setSeats((current) => current.map((seat) =>
        seat.id === change.id ? {
          ...seat,
          etat: change.etat,
          retenue_expire_a: change.etat === 'retenue'
            ? (change.expireA ?? seat.retenue_expire_a)
            : null
        } : seat
      ));

      if (change.etat === 'vendue' || change.etat === 'libre') {
        setSelected((current) => current.filter((seatId) => seatId !== change.id));
      }
    });

    socket.on('place:retenue_expiree', (change: { id: number }) => {
      seatVersion.current += 1;
      setSeats((current) => current.map((seat) =>
        seat.id === change.id
          ? { ...seat, etat: 'libre', retenue_expire_a: null }
          : seat
      ));
      setSelected((current) => current.filter((seatId) => seatId !== change.id));
    });

    return () => {
      socket.off('connect', synchronizeSeats);
      socket.emit('seance:quitter', id);
      socket.disconnect();
    };
  }, [id]);

  async function toggleBlock(seat: Seat) {
    if (seat.etat !== 'libre' && seat.etat !== 'bloquee') return;

    const action = seat.etat === 'libre' ? 'bloquer' : 'debloquer';
    setBusy(true);

    try {
      await api(`/api/seances/${id}/places/${seat.id}/${action}`, {
        method: 'POST'
      });
      await refreshSeats();
    } catch (error) {
      notify((error as Error).message);
      await refreshSeats();
    } finally {
      setBusy(false);
    }
  }

  async function chooseSeat(seat: Seat) {
    if (isManager) {
      await toggleBlock(seat);
      return;
    }

    if (
      seat.etat === 'vendue' ||
      (seat.etat === 'retenue' && !selected.includes(seat.id))
    ) return;

    if (selected.includes(seat.id)) {
      setSelected((current) => current.filter((seatId) => seatId !== seat.id));
      return;
    }

    if (!user) {
      notify('Connectez-vous pour choisir une place.');
      navigate('/connexion', {
        state: { from: `/seances/${id}` }
      });
      return;
    }

    setBusy(true);

    try {
      const result = await api<{ place: { expireA?: string } }>(
        `/api/seances/${id}/places/${seat.id}/retenir`,
        { method: 'POST' }
      );

      const expiresAt = result.place.expireA
        ? new Date(result.place.expireA).toISOString()
        : new Date(Date.now() + 5 * 60 * 1000).toISOString();

      setSelected((current) => [...current, seat.id]);

      setSeats((current) => current.map((item) =>
        item.id === seat.id ? {
          ...item,
          etat: 'retenue',
          retenue_expire_a: expiresAt
        } : item
      ));
    } catch (error) {
      notify((error as Error).message);
      await refreshSeats();
    } finally {
      setBusy(false);
    }
  }

  function openPayment() {
    if (!selected.length || busy || remaining <= 0) return;
    setPaymentError('');
    setPaymentOpen(true);
  }

  function closePayment() {
    if (busy) return;
    setPaymentOpen(false);
    setPaymentError('');
    setPayment({ ...emptyPayment });
  }

  function updatePayment(key: keyof FakePayment, value: string) {
    setPayment((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function confirmFakePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const cardNumber = payment.cardNumber.replace(/\s/g, '');
    const validCard = /^\d{12,19}$/.test(cardNumber);
    const validCvv = /^\d{3,4}$/.test(payment.cvv);
    const validDate = /^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expiryDate);

    if (
      !payment.firstName.trim() ||
      !payment.lastName.trim() ||
      !validCard ||
      !validCvv ||
      !validDate
    ) {
      setPaymentError('Veuillez remplir correctement les informations fictives.');
      return;
    }

    if (!selected.length || !expiry || expiry <= Date.now()) {
      setPaymentError('La retenue de vos places a expiré. Sélectionnez-les à nouveau.');
      return;
    }

    setPaymentError('');
    await book();
  }

  async function book() {
    if (!selected.length || busy) return;

    setBusy(true);

    try {
      const result = await api<{
        reservation: { code_billet: string };
        courrielEnvoye: boolean;
      }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          seanceId: Number(id),
          placeIds: selected
        })
      });

      setPaymentOpen(false);
      setPayment({ ...emptyPayment });
      setPaymentError('');
      setExpiry(null);
      setRemaining(0);
      setSelected([]);

      notify(result.courrielEnvoye
        ? `Réservation confirmée · billet envoyé par courriel (${result.reservation.code_billet}).`
        : `Réservation confirmée · ${result.reservation.code_billet}. Le courriel n’a pas pu être envoyé.`);
      navigate('/mes-reservations');

    } catch (error) {
      setPaymentError((error as Error).message);
      await refreshSeats().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const selectedExpiry = useMemo(() => {
    const timestamps = selected
      .map((seatId) => seats.find((seat) => seat.id === seatId)?.retenue_expire_a)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));

    return timestamps.length ? Math.min(...timestamps) : null;
  }, [selected, seats]);

  useEffect(() => {
    setExpiry(selectedExpiry);
    if (!selectedExpiry) setRemaining(0);
  }, [selectedExpiry]);

  useEffect(() => {
    if (!expiry) return;
    const end = expiry;

    function update() {
      const secs = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(secs);
    }

    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [expiry]);

  useEffect(() => {
    if (expiry && expiry <= Date.now()) {
      setExpiry(null);
      setSelected([]);
      setPaymentOpen(false);
      setPayment({ ...emptyPayment });
      setPaymentError('');
      notify('Votre retenue de 5 minutes est expirée. Les places sont de nouveau disponibles.');
      refreshSeats().catch((error: Error) => notify(error.message));
    }
  }, [remaining, expiry, notify]);

  function formatRemaining(secs: number) {
    const m = Math.floor(secs / 60).toString();
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const grouped = useMemo(
    () => [...new Set(seats.map((seat) => seat.rangee))]
      .sort()
      .map((row) => ({
        row,
        seats: seats
          .filter((seat) => seat.rangee === row)
          .sort((a, b) => a.numero - b.numero)
      })),
    [seats]
  );

  if (loading) return <div className="loading-line">Ouverture de la salle…</div>;

  if (!session) {
    return (
      <div className="empty-state">
        <Film />
        <p>Séance introuvable.</p>
        <Link to="/">Retour au programme</Link>
      </div>
    );
  }

  const chosenSeats = seats.filter((seat) => selected.includes(seat.id));
  const date = new Date(session.date_heure);

  return (
    <section className="booking-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} />
        Retour au programme
      </Link>

      <div className="booking-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            VOTRE SOIRÉE
          </div>
          <h1>{session.titre}</h1>
          <p>
            {date.toLocaleDateString('fr-CA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
            <span> · </span>
            {date.toLocaleTimeString('fr-CA', {
              hour: '2-digit',
              minute: '2-digit'
            })}
            <span> · </span>
            {session.salle}
          </p>
        </div>

        <div className="booking-status">
          <span className="live-label">
            <span className="live-pulse" />
            PLAN EN DIRECT
          </span>

          {expiry && (
            <span className={`hold-timer ${remaining <= 60 ? 'urgent' : ''}`}>
              <Clock3 size={14} />
              {formatRemaining(remaining)}
              <small>retenue</small>
            </span>
          )}
        </div>
      </div>

      <div className="booking-layout">
        <div className="seat-panel">
          <div className="screen-wrap">
            <div className="screen-glow" />
            <div className="screen-line" />
            <span>ÉCRAN</span>
          </div>

          <div className="seat-grid" aria-label="Plan des places">
            {grouped.map(({ row, seats: rowSeats }) => (
              <div className="seat-row" key={row}>
                <span className="row-label">{row}</span>

                {rowSeats.map((seat) => (
                  <button
                    key={seat.id}
                    disabled={
                      busy ||
                      seat.etat === 'vendue' ||
                      (seat.etat === 'bloquee' && !isManager) ||
                      (seat.etat === 'retenue' && !selected.includes(seat.id))
                    }
                    onClick={() => chooseSeat(seat)}
                    className={`seat ${seat.etat} ${
                      selected.includes(seat.id) ? 'selected' : ''
                    } ${seat.type === 'accessible' ? 'accessible' : ''}`}
                    title={`${row}${seat.numero} · ${seat.etat}`}
                    aria-label={`Place ${row}${seat.numero}, ${seat.etat}`}
                  >
                    {seat.type === 'accessible'
                      ? <Armchair size={12} />
                      : seat.numero}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="seat-legend">
            <span><i className="legend-seat free" />Disponible</span>
            <span><i className="legend-seat chosen" />Votre choix</span>
            <span><i className="legend-seat held" />En cours</span>
            <span><i className="legend-seat sold" />Réservé</span>
            <span><i className="legend-seat blocked" />Bloquée</span>
          </div>

          <p className="seat-help">
            <LockKeyhole size={14} />
            {expiry
              ? <>Votre sélection expire dans <strong>{formatRemaining(remaining)}</strong>.</>
              : <>Votre sélection est gardée pendant 5 minutes.</>}
          </p>
        </div>

        <aside className="summary-panel">
          <span className="summary-kicker">RÉCAPITULATIF</span>

          <div className="summary-title">
            <span
              className="summary-poster"
              style={{ backgroundImage: `url("${session.image_url}")` }}
            />
            <div>
              <strong>{session.titre}</strong>
              <span>
                {date.toLocaleDateString('fr-CA', {
                  day: 'numeric',
                  month: 'long'
                })}
                {' · '}
                {date.toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="summary-divider" />

          <div className="selection-label">
            <span>Vos places</span>
            <span>{selected.length} / 8</span>
          </div>

          <div className="chosen-seats">
            {chosenSeats.length
              ? chosenSeats.map((seat) => (
                  <span className="chosen-pill" key={seat.id}>
                    {seat.rangee}{seat.numero}
                  </span>
                ))
              : <span className="muted-copy">Choisissez vos sièges dans le plan</span>}
          </div>

          <div className="summary-divider" />

          <div className="total-line">
            <span>
              Total <small>· paiement fictif</small>
            </span>
            <strong>
              {(selected.length * 14.5).toFixed(2).replace('.', ',')} $
            </strong>
          </div>

          <button
            className="button button-gold button-wide"
            disabled={!selected.length || busy || remaining <= 0}
            onClick={openPayment}
          >
            Confirmer les places <ArrowRight size={16} />
          </button>

          <p className="secure-note">
            <LockKeyhole size={12} />
            Paiement simulé, aucune transaction réelle
          </p>
        </aside>
      </div>

      {paymentOpen && (
        <div
          className="payment-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePayment();
          }}
        >
          <div
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
          >
            <div className="payment-header">
              <div>
                <span className="payment-eyebrow">PAR TERRE · SIMULATION</span>
                <h2 id="payment-title">Paiement fictif</h2>
                <p>Aucun montant ne sera débité.</p>
              </div>

              <button
                type="button"
                className="payment-close"
                aria-label="Fermer"
                disabled={busy}
                onClick={closePayment}
              >
                <X size={22} />
              </button>
            </div>

            <div className="payment-order">
              <span>{selected.length} place(s)</span>
              <strong>
                {(selected.length * 14.5).toFixed(2).replace('.', ',')} $
              </strong>
            </div>

            <form onSubmit={confirmFakePayment} autoComplete="off">
              <div className="payment-fields-row">
                <label>
                  Prénom
                  <input
                    type="text"
                    placeholder="Jean"
                    value={payment.firstName}
                    onChange={(event) =>
                      updatePayment('firstName', event.target.value)
                    }
                    required
                    disabled={busy}
                  />
                </label>

                <label>
                  Nom de famille
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={payment.lastName}
                    onChange={(event) =>
                      updatePayment('lastName', event.target.value)
                    }
                    required
                    disabled={busy}
                  />
                </label>
              </div>

              <label>
                Numéro de carte fictif
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  maxLength={23}
                  value={payment.cardNumber}
                  onChange={(event) =>
                    updatePayment(
                      'cardNumber',
                      event.target.value.replace(/[^\d\s]/g, '')
                    )
                  }
                  required
                  disabled={busy}
                />
              </label>

              <div className="payment-fields-row">
                <label>
                  Date d'expiration
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={payment.expiryDate}
                    onChange={(event) =>
                      updatePayment('expiryDate', event.target.value)
                    }
                    required
                    disabled={busy}
                  />
                </label>

                <label>
                  CVV / CVC fictif
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000"
                    maxLength={4}
                    value={payment.cvv}
                    onChange={(event) =>
                      updatePayment(
                        'cvv',
                        event.target.value.replace(/\D/g, '')
                      )
                    }
                    required
                    disabled={busy}
                  />
                </label>
              </div>

              {paymentError && (
                <p className="payment-error" role="alert">
                  {paymentError}
                </p>
              )}

              <p className="payment-disclaimer">
                Démonstration uniquement. N'utilisez jamais une vraie carte bancaire.
                Aucune information de carte n'est transmise ou sauvegardée.
              </p>

              <button
                type="submit"
                className="payment-confirm"
                disabled={busy || remaining <= 0}
              >
                <CreditCard size={18} />
                {busy ? 'Confirmation en cours…' : 'Confirmer la réservation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
