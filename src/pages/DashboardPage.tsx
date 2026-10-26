import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';

import { api } from '../services/api';
import type { User } from '../types';

type Props = {
  user: User | null;
};

type Reservation = {
  id: number;
  client: string;
  spectacle: string;
  places: string;
  montant: number;
  statut: string;
};

type Seance = {
  id: number;
  titre: string;
  sous_titre?: string;
  spectacle_type: string;
  date_heure: string;
  salle: string;
  capacite: number;
  disponible: number;
  remplissage: number;
};

type DashboardData = {
  stats: {
    revenus7j: number;
    billetsVendus: number;
    tauxRemplissage: number;
    seancesActives: number;
  };

  revenus: {
    jour: string;
    montant: number;
  }[];

  reservations: Reservation[];
  seances: Seance[];
};

export default function DashboardPage({ user }: Props) {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'gestionnaire') {
      navigate('/');
      return;
    }

    loadDashboard();
  }, [user, navigate]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const result = await api<DashboardData>(
        '/api/gestion/dashboard'
      );

      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'gestionnaire') {
    return null;
  }

  if (loading) {
    return (
      <section className="manager-dashboard">
        <p>Chargement du dashboard...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="manager-dashboard">
        <p className="form-error">
          {error || 'Impossible de charger le dashboard.'}
        </p>
      </section>
    );
  }

  const maxRevenue = Math.max(
    ...data.revenus.map((item) => Number(item.montant)),
    1
  );

  return (
    <section className="manager-dashboard">

      {/* HEADER */}

      <div className="dashboard-heading">

        <div>
          <h1>Dashboard</h1>
          <p>Vue d'ensemble de vos séances</p>
        </div>

        <div className="dashboard-actions">

          <button
            className="dashboard-refresh"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>

          <Link
            className="dashboard-new-session"
            to="/gestion/seances/nouvelle"
          >
            + Nouvelle séance
          </Link>

        </div>

      </div>


      {/* CARTES STATISTIQUES */}

      <div className="dashboard-stats">

        <article className="dashboard-stat">

          <div className="dashboard-stat-label">
            <span>REVENUS 7J</span>

            <div className="stat-symbol gold">
              <TrendingUp size={18} />
            </div>
          </div>

          <strong>
            {data.stats.revenus7j.toLocaleString('fr-FR')} €
          </strong>

          <small className="positive">
            Revenus des 7 derniers jours
          </small>

        </article>


        <article className="dashboard-stat">

          <div className="dashboard-stat-label">
            <span>BILLETS VENDUS</span>

            <div className="stat-symbol gold">
              <Ticket size={18} />
            </div>
          </div>

          <strong>
            {data.stats.billetsVendus}
          </strong>

          <small className="positive">
            Billets confirmés
          </small>

        </article>


        <article className="dashboard-stat">

          <div className="dashboard-stat-label">
            <span>TAUX REMPLISSAGE</span>

            <div className="stat-symbol green">
              <Users size={18} />
            </div>
          </div>

          <strong>
            {data.stats.tauxRemplissage}%
          </strong>

          <small className="positive">
            Moyenne des séances
          </small>

        </article>


        <article className="dashboard-stat">

          <div className="dashboard-stat-label">
            <span>SÉANCES ACTIVES</span>

            <div className="stat-symbol orange">
              <CalendarDays size={18} />
            </div>
          </div>

          <strong>
            {data.stats.seancesActives}
          </strong>

          <small>
            Séances à venir
          </small>

        </article>

      </div>


      {/* GRAPHIQUE */}

      <div className="dashboard-panel dashboard-revenue">

        <div className="dashboard-panel-title">

          <div>
            <h2>Revenus & Billets</h2>
            <p>7 derniers jours</p>
          </div>

          <span className="dashboard-week">
            CETTE SEMAINE
          </span>

        </div>


        <div className="revenue-chart">

          {data.revenus.map((item) => {

            const height =
              (Number(item.montant) / maxRevenue) * 100;

            return (
              <div
                className="revenue-column"
                key={item.jour}
              >

                <div className="revenue-value">
                  {Number(item.montant).toLocaleString(
                    'fr-FR'
                  )} €
                </div>

                <div className="revenue-bar-area">

                  <div
                    className="revenue-bar"
                    style={{
                      height: `${Math.max(height, 3)}%`,
                    }}
                  />

                </div>

                <span>
                  {item.jour}
                </span>

              </div>
            );
          })}

        </div>

      </div>


      {/* RÉSERVATIONS */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-title">

          <h2>Réservations récentes</h2>

          <span className="dashboard-total">
            {data.reservations.length} TOTAL
          </span>

        </div>


        <div className="dashboard-table-wrapper">

          <table className="dashboard-table">

            <thead>
              <tr>
                <th>CLIENT · SPECTACLE</th>
                <th>PLACES</th>
                <th>MONTANT</th>
                <th>STATUT</th>
              </tr>
            </thead>

            <tbody>

              {data.reservations.map((reservation) => (

                <tr key={reservation.id}>

                  <td>
                    <b>{reservation.client}</b>
                    <small>
                      {reservation.spectacle}
                    </small>
                  </td>

                  <td>
                    {reservation.places || '—'}
                  </td>

                  <td className="dashboard-price">
                    {Number(
                      reservation.montant
                    ).toLocaleString('fr-FR')} €
                  </td>

                  <td>

                    <span
                      className={
                        reservation.statut === 'confirmee'
                          ? 'dashboard-status confirmed'
                          : 'dashboard-status'
                      }
                    >
                      {reservation.statut}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {/* TOUTES LES SÉANCES */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-title">

          <h2>Toutes les séances</h2>

          <Link
            className="dashboard-small-new"
            to="/gestion/seances/nouvelle"
          >
            + Nouvelle séance
          </Link>

        </div>


        <div className="dashboard-table-wrapper">

          <table className="dashboard-table">

            <thead>

              <tr>
                <th>TITRE</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>SALLE</th>
                <th>PLACES</th>
                <th>DISPO</th>
                <th>REMPLISSAGE</th>
              </tr>

            </thead>

            <tbody>

              {data.seances.map((seance) => (

                <tr key={seance.id}>

                  <td>

                    <b>{seance.titre}</b>

                    {seance.sous_titre && (
                      <small>
                        {seance.sous_titre}
                      </small>
                    )}

                  </td>


                  <td>

                    <span
                      className={
                        seance.spectacle_type === 'theatre'
                          ? 'dashboard-type theatre'
                          : 'dashboard-type cinema'
                      }
                    >
                      {seance.spectacle_type === 'theatre'
                        ? 'THÉÂTRE'
                        : 'CINÉ'}
                    </span>

                  </td>


                  <td>
                    {new Date(
                      seance.date_heure
                    ).toLocaleString('fr-CA')}
                  </td>

                  <td>
                    {seance.salle}
                  </td>

                  <td>
                    {seance.capacite}
                  </td>

                  <td className="available-number">
                    {seance.disponible}
                  </td>


                  <td>

                    <div className="dashboard-progress-row">

                      <div className="dashboard-progress">

                        <span
                          style={{
                            width:
                              `${seance.remplissage}%`,
                          }}
                        />

                      </div>

                      <b>
                        {seance.remplissage}%
                      </b>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}