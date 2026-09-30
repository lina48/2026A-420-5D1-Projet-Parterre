import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

type Props = { user: User | null; notify: (message: string) => void };

export default function CreateSessionPage({ user, notify }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!user || user.role !== 'gestionnaire') navigate('/'); }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = new FormData(event.currentTarget);
    try {
      await api('/api/seances', { method: 'POST', body: JSON.stringify({ titre: values.get('titre'), genre: values.get('genre'), dureeMinutes: values.get('duree'), dateHeure: values.get('date') }) });
      notify('La séance et son plan de salle sont créés.');
      navigate('/');
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="admin-page">
    <Link className="back-link" to="/"><ArrowLeft size={16} />Retour au programme</Link>
    <div className="eyebrow"><span className="eyebrow-line" />ESPACE GESTIONNAIRE</div>
    <h1>Programmer une séance</h1>
    <p className="admin-intro">Une nouvelle histoire à l’affiche. La salle Lumière et ses 72 places seront ajoutées automatiquement.</p>
    <form className="admin-form" onSubmit={submit}>
      <label>Titre du film<input name="titre" placeholder="Le nom du film" required /></label>
      <div className="form-columns">
        <label>Genre<select name="genre"><option>Drame</option><option>Comédie</option><option>Science-fiction</option><option>Théâtre</option><option>Documentaire</option></select></label>
        <label>Durée (minutes)<input name="duree" type="number" min="30" max="300" defaultValue="110" required /></label>
      </div>
      <label>Date et heure<input name="date" type="datetime-local" min={new Date().toISOString().slice(0, 16)} required /></label>
      {error && <p className="form-error"><X size={15} />{error}</p>}
      <button className="button button-gold" disabled={busy}><Plus size={17} />{busy ? 'Création…' : 'Créer la séance'}</button>
    </form>
  </section>;
}
