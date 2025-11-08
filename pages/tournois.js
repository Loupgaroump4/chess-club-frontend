import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';

export default function Tournois() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState({}); // { [tournamentId]: true/false }

  const API = 'https://tpchess-backend.vercel.app/api';

  // Charger l'utilisateur connecté depuis localStorage
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  // Charger les tournois depuis le backend
  useEffect(() => {
    fetch(`${API}/tournaments`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setTournaments(data.tournaments);
      })
      .catch(() => alert('Erreur lors du chargement des tournois'))
      .finally(() => setLoading(false));
  }, []);

  // Vérifier pour chaque tournoi si l'utilisateur est inscrit
  useEffect(() => {
    if (!user || tournaments.length === 0) return;

    const token = localStorage.getItem('token');

    tournaments.forEach(async (t) => {
      try {
        const res = await fetch(`${API}/tournaments/${t.id}/is-joined`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const j = await res.json();
        setRegistrations(prev => ({ ...prev, [t.id]: j.joined }));
      } catch (e) {
        console.error(e);
      }
    });
  }, [user, tournaments]);

  // Fonction d’inscription à un tournoi
  async function joinTournament(id) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Veuillez vous connecter pour vous inscrire.');

    try {
      const res = await fetch(`${API}/tournaments/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
        // Met à jour l’état des inscriptions
        setRegistrations(prev => ({ ...prev, [id]: true }));
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion au serveur');
    }
  }
  async function addParticipant(tournamentId, username) {
    const res = await fetch(`/tournaments/${tournamentId}/add-participant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    if (data.ok) {
      // ⚙️ On ajoute le joueur complet à la liste
      setParticipants([...participants, data.participant]);
    } else {
      alert(data.error || 'Erreur');
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <h1>Tournois</h1>

        {loading ? (
          <p>Chargement des tournois...</p>
        ) : tournaments.length === 0 ? (
          <p>Aucun tournoi n’est actuellement disponible.</p>
        ) : (
          <div className="grid" style={{ display: 'grid', gap: 16 }}>
            {tournaments.map(t => {
              const isRegistered = user && registrations[t.id];

              return (
                <div key={t.id} className="card" style={{ padding: 16 }}>
                  <h3>{t.name}</h3>
                  <p>
                    🗓️ Début : {new Date(t.start_date).toLocaleDateString()}<br />
                    🎯 Rondes : {t.rounds_total}<br />
                    👤 Créé par : {t.created_by_name || 'Inconnu'}
                  </p>

                  {user ? (
                    <button
                      className="button"
                      onClick={() =>
                        isRegistered
                          ? router.push(`/tournament/${t.id}`)
                          : joinTournament(t.id)
                      }
                    >
                      {isRegistered ? 'Voir le tournoi' : "S’inscrire"}
                    </button>
                  ) : (
                    <p style={{ fontSize: 14, color: '#555' }}>
                      Connectez-vous pour vous inscrire à un tournoi
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
