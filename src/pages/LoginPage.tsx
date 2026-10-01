import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

type Props = {
  onAuth: (result: { token: string; user: User }) => void;
  notify: (message: string) => void;
};

export default function LoginPage({ onAuth, notify }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ token: string; user: User }>('/api/auth/connexion', {
        method: 'POST',
        body: JSON.stringify({ courriel: values.get('courriel'), motDePasse: values.get('motDePasse') }),
      });
      onAuth(result);
      notify(`Bon retour, ${result.user.nom.split(' ')[0]} !`);
      const returnTo = (location.state as { from?: string } | null)?.from;
      navigate(result.user.role === 'gestionnaire' ? '/gestion/seances/nouvelle' : returnTo ?? '/');
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} />Retour au programme</Link>
      <div className="eyebrow"><span className="eyebrow-line" />CONNEXION</div>
      <h1>Content de vous revoir</h1>
      <form className="admin-form" onSubmit={submit}>
        <label>Courriel<input name="courriel" type="email" placeholder="vous@exemple.com" required /></label>
        <label>Mot de passe<input name="motDePasse" type="password" required minLength={8} /></label>
        {error && <p className="form-error"><X size={15} />{error}</p>}
        <button className="button button-gold" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <p className="muted-copy">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
    </section>
  );
}