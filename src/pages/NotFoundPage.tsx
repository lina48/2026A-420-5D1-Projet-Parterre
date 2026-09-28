import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

export default function NotFoundPage() {
  return <div className="empty-state"><Film /><p>Cette page n’existe pas.</p><Link to="/">Retour au programme</Link></div>;
}
