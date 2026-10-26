import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, X } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

type Props = { onAuth: (result: { token: string; user: User }) => void; notify: (message: string) => void };

export default function LoginPage({ onAuth, notify }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [githubAvailable, setGithubAvailable] = useState(false);
  const oauthProcessing = useRef(false);

  useEffect(() => {
    api<{ configured: boolean }>('/api/auth/github/status')
      .then(({ configured }) => setGithubAvailable(configured))
      .catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('access_token');
    const query = new URLSearchParams(window.location.search);
    const oauthError = query.get('oauth');

    if (oauthError) {
      const messages: Record<string, string> = {
        github_denied: 'La connexion GitHub a été annulée.',
        github_error: 'La connexion GitHub a échoué. Réessayez.',
        github_state_error: 'La vérification de sécurité a échoué. Relancez la connexion GitHub.',
        github_account_exists: 'Un compte existe déjà avec ce courriel. Connectez-vous avec votre mot de passe.',
      };
      setError(messages[oauthError] ?? 'La connexion GitHub a échoué.');
      query.delete('oauth');
      const remainingQuery = query.toString();
      const search = remainingQuery ? `?${remainingQuery}` : '';
      window.history.replaceState(null, '', `${window.location.pathname}${search}`);
    }

    if (!token || oauthProcessing.current) return;
    oauthProcessing.current = true;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    localStorage.setItem('parterre-token', token);
    api<{ user: User }>('/api/auth/me')
      .then(({ user: authenticatedUser }) => {
        onAuth({ token, user: authenticatedUser });
        notify(`Bienvenue, ${authenticatedUser.nom.split(' ')[0]} !`);
        navigate('/');
      })
      .catch((reason: Error) => {
        localStorage.removeItem('parterre-token');
        setError(reason.message);
      });
  }, [navigate, notify, onAuth]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ token: string; user: User }>('/api/auth/connexion', {
        method: 'POST',
        body: JSON.stringify({ courriel: values.get('courriel'), motDePasse: values.get('motDePasse') }),
      });
      onAuth(result);
      notify(`Bon retour, ${result.user.nom.split(' ')[0]} !`);
      navigate('/');
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
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
      {githubAvailable && <a className="button button-github button-wide" href="/api/auth/github"><Github size={16} />Continuer avec GitHub</a>}
      <p className="muted-copy">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
    </section>
  );
}