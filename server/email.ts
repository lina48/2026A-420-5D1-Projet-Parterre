import nodemailer from 'nodemailer';

type TicketEmail = {
  to: string;
  name: string;
  title: string;
  startsAt: Date;
  seatCodes: string[];
  ticketCode: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export async function sendTicketEmail(ticket: TicketEmail) {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(user) !== Boolean(pass)) {
    throw new Error('Configuration SMTP incomplète ou invalide.');
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
  const date = ticket.startsAt.toLocaleString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const seats = ticket.seatCodes.join(', ');
  const safeName = escapeHtml(ticket.name);
  const safeTitle = escapeHtml(ticket.title);
  const safeDate = escapeHtml(date);
  const safeSeats = escapeHtml(seats);
  const safeCode = escapeHtml(ticket.ticketCode);

  await transport.sendMail({
    from,
    to: ticket.to,
    subject: `Votre billet Parterre · ${ticket.title}`,
    text: `Bonjour ${ticket.name},\n\nVotre réservation est confirmée.\nSéance : ${ticket.title}\nDate : ${date}\nPlaces : ${seats}\nCode du billet : ${ticket.ticketCode}\n`,
    html: `<p>Bonjour ${safeName},</p><p>Votre réservation est confirmée.</p><ul><li><strong>Séance :</strong> ${safeTitle}</li><li><strong>Date :</strong> ${safeDate}</li><li><strong>Places :</strong> ${safeSeats}</li></ul><p><strong>Code du billet :</strong> ${safeCode}</p><p>Présentez ce code à l'entrée de la salle.</p>`,
  });
}
