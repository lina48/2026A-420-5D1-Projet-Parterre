import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Check, Clapperboard, LogOut } from 'lucide-react';
import CreateSessionPage from './pages/CreateSessionPage';
import MyTicketsPage from './pages/MyTicketsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProgrammePage from './pages/ProgrammePage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import type { User } from './types';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateSessionPage from './pages/CreateSessionPage';

const savedUser = localStorage.getItem('parterre-user');
const initialUser: User | null = savedUser ? JSON.parse(savedUser) as User : null;

export default function App() {
  const [user, setUser] = useState<User | null>(initialUser);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function signOut() {
    localStorage.removeItem('parterre-token');
    localStorage.removeItem('parterre-user');
    setUser(null);
  }

  function handleAuth(result: { token: string; user: User }) {
    localStorage.setItem('parterre-token', result.token);
    localStorage.setItem('parterre-user', JSON.stringify(result.user));
    setUser(result.user);
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Parterre, accueil"><span className="brand-mark"><Clapperboard size={19} /></span><span>parterre<span className="brand-period">.</span></span></Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <NavLink to="/" end>Programmation</NavLink>
          {user && <NavLink to="/mes-reservations">Mes billets</NavLink>}
          {user?.role === 'gestionnaire' && <NavLink to="/gestion/seances/nouvelle">Gestion</NavLink>}
        </nav>
        <div className="account-area">
          {user ? <><span className="account-name"><span className="online-dot" />{user.nom.split(' ')[0]}</span><button className="icon-button" title="Déconnexion" onClick={signOut}><LogOut size={17} /></button></> : <Link className="text-link" to="/connexion">Se connecter</Link>}
        </div>
      </header>
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<ProgrammePage />} />
          <Route path="/seances/:id" element={<SeatSelectionPage user={user} notify={setToast} />} />
          <Route path="/mes-reservations" element={<MyTicketsPage user={user} notify={setToast} />} />
          <Route path="/gestion/seances/nouvelle" element={<CreateSessionPage user={user} notify={setToast} />} />
                    <Route path="/connexion" element={<LoginPage onAuth={handleAuth} notify={setToast} />} />
          <Route path="/inscription" element={<RegisterPage onAuth={handleAuth} notify={setToast} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer"><span>PAR TERRE, AU PREMIER RANG.</span><span>Une séance, une histoire.</span></footer>
      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </>
  );
}