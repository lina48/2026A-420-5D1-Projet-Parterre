const seanceId = 1;
const userId = 1;
const seatMap = document.querySelector('.seat-map');
const selectionCount = document.querySelector('.selection-summary strong');
const selectionEmpty = document.querySelector('.selection-empty');
const checkoutButton = document.querySelector('.primary-button');
const stats = {
  available: document.querySelector('.stat-row:nth-child(2) strong'),
  held: document.querySelector('.stat-row:nth-child(3) strong'),
  sold: document.querySelector('.stat-row:nth-child(4) strong')
};
const selectedPlaceIds = new Set();

function setSeatState(button, state) {
  button.classList.remove('available', 'selected', 'unavailable', 'reserved', 'vip');
  button.classList.add(state === 'libre' ? 'available' : state === 'retenue' ? 'unavailable' : 'reserved');
  button.disabled = state !== 'libre' && !selectedPlaceIds.has(Number(button.dataset.placeId));
}

function updateSelection() {
  const count = selectedPlaceIds.size;
  selectionCount.textContent = `${count} siège${count > 1 ? 's' : ''}`;
  selectionEmpty.textContent = count ? 'Places retenues pendant 10 minutes' : 'Cliquez sur un siège disponible';
  checkoutButton.disabled = count === 0;
  checkoutButton.classList.toggle('is-disabled', count === 0);
}

function updateStats(places) {
  const counts = places.reduce((result, place) => {
    result[place.etat] = (result[place.etat] || 0) + 1;
    return result;
  }, {});
  stats.available.textContent = counts.libre || 0;
  stats.held.textContent = counts.retenue || 0;
  stats.sold.textContent = counts.vendue || 0;
}

function findButton(placeId) {
  return document.querySelector(`[data-place-id="${placeId}"]`);
}

async function holdSeat(button) {
  const placeId = Number(button.dataset.placeId);
  button.disabled = true;
  try {
    const response = await fetch(`/api/seances/${seanceId}/places/${placeId}/retenir`, {
      method: 'POST',
      headers: { 'x-user-id': String(userId) }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'La place est indisponible');
    selectedPlaceIds.add(placeId);
    setSeatState(button, 'retenue');
    button.classList.remove('unavailable');
    button.classList.add('selected');
    button.disabled = false;
    updateSelection();
  } catch (error) {
    window.alert(error.message);
    button.disabled = false;
  }
}

async function loadPlan() {
  const response = await fetch(`/api/seances/${seanceId}/plan`);
  if (!response.ok) throw new Error('Impossible de charger le plan de salle');
  const payload = await response.json();
  const buttons = [...seatMap.querySelectorAll('.seat')];
  const seatsByPosition = new Map();
  document.querySelectorAll('.row').forEach((row) => {
    const rowName = row.querySelector('.row-label').textContent.trim();
    row.querySelectorAll('.seat').forEach((button) => {
      seatsByPosition.set(`${rowName}-${button.textContent.trim()}`, button);
    });
  });

  payload.places.forEach((place) => {
    const button = seatsByPosition.get(`${place.rangee}-${place.numero}`);
    if (!button) return;
    button.dataset.placeId = place.place_id;
    button.dataset.placeSeanceId = place.place_seance_id;
    button.dataset.etat = place.etat;
    button.classList.toggle('vip', ['A', 'B'].includes(place.rangee));
    setSeatState(button, place.etat);
    button.addEventListener('click', () => holdSeat(button));
  });
  updateStats(payload.places);
  updateSelection();
  if (typeof window.io === 'function') {
    const socket = window.io();
    socket.emit('seance:rejoindre', seanceId);
    socket.on('place:etat_change', (change) => {
      const button = findButton(change.placeId);
      if (!button || selectedPlaceIds.has(Number(change.placeId))) return;
      setSeatState(button, change.etat);
    });
    socket.on('place:retenue_expiree', (change) => {
      const button = findButton(change.placeId);
      if (!button || selectedPlaceIds.has(Number(change.placeId))) return;
      setSeatState(button, 'libre');
    });
  }
}

checkoutButton.addEventListener('click', async () => {
  if (!selectedPlaceIds.size) return;
  checkoutButton.disabled = true;
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(userId) },
      body: JSON.stringify({ seanceId, placeIds: [...selectedPlaceIds] })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Reservation impossible');
    window.alert(`Reservation confirmee. Billet: ${result.code_billet}`);
    window.location.reload();
  } catch (error) {
    window.alert(error.message);
    checkoutButton.disabled = false;
  }
});

loadPlan().catch((error) => {
  selectionEmpty.textContent = error.message;
  checkoutButton.disabled = true;
});
