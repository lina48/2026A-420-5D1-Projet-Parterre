import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

type Props = { onAuth: (result: { token: string; user: User }) => void; notify: (message: string) => void };

export default function RegisterPage({ onAuth, notify }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ token: string; user: User }>('/api/auth/inscription', {
        method: 'POST',
        body: JSON.stringify({ nom: values.get('nom'), courriel: values.get('courriel'), motDePasse: values.get('motDePasse') }),
      });
      onAuth(result);
      notify(`Bienvenue, ${result.user.nom.split(' ')[0]} !`);
      navigate('/');
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <section className="admin-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} />Retour au programme</Link>
      <div className="eyebrow"><span className="eyebrow-line" />INSCRIPTION</div>
      <h1>Créer un compte</h1>
      <form className="admin-form" onSubmit={submit}>
        <label>Nom<input name="nom" placeholder="Votre nom" required /></label>
        <label>Courriel<input name="courriel" type="email" placeholder="vous@exemple.com" required /></label>
        <label>Mot de passe<input name="motDePasse" type="password" required minLength={8} /></label>
        {error && <p className="form-error"><X size={15} />{error}</p>}
        <button className="button button-gold" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="muted-copy">Déjà un compte ? <Link to="/connexion">Se connecter</Link></p>
    </section>
  );
}