import Header from '../components/Header'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Account() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [eloHistory, setEloHistory] = useState([]);

  // Récupère l'utilisateur connecté depuis localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth'); // redirige si non connecté
    } else {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchEloHistory(u.id);
    }
  }, [router]);

  // Récupération de l'historique Elo
  const fetchEloHistory = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/elo-history`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        // data.history doit être un tableau d’objets : [{ date, elo }, ...]
        setEloHistory(data.history);
      }
    } catch (err) {
      console.error("Erreur récupération Elo :", err);
    }
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <>
      <Header />
      <div style={{ padding: 24 }}>
        <h1>Bienvenue {user.username} !</h1>
        <p>Elo actuel : {user.elo}</p>
        <p>Statut : {user.admin ? 'Administrateur' : 'Joueur'}</p>

        {/* Graphique Elo */}
        {eloHistory.length > 0 && (
          <div style={{ marginTop: 40, width: '100%', height: 300 }}>
            <h3>Évolution de votre Elo</h3>
            <ResponsiveContainer>
              <LineChart data={eloHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="elo" stroke="#1E3A8A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bouton Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: 20,
            padding: '10px 20px',
            backgroundColor: '#1E3A8A',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
       >
          Déconnexion
        </button>
      </div>
    </>
  );
}
