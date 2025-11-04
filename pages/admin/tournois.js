import { useEffect, useState } from 'react';
import Header from '../../components/Header';

export default function AdminTournois() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', start_date: '', rounds_total: 5, cadence: '10+0', location: 'Salle C410'});
  const [message, setMessage] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTournament, setExpandedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Charger l'utilisateur
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (!u.admin) setMessage('❌ Accès refusé : cette page est réservée aux administrateurs.');
      else fetchTournaments();
    } else {
      setMessage('⚠️ Vous devez être connecté pour accéder à cette page.');
      setLoading(false);
    }
  }, []);

  // Charger les tournois
  const fetchTournaments = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/tournaments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setTournaments(data.tournaments);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  // Création d’un tournoi
  const createTournament = async () => {
    if (!form.name || !form.start_date) return alert('Veuillez remplir tous les champs');
    if (!token) return alert('Non autorisé');

    try {
      const res = await fetch('http://localhost:5000/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        alert('✅ Tournoi créé avec succès !');
        setForm({ name: '', start_date: '', rounds_total: 5 });
        fetchTournaments();
      } else alert(`❌ ${data.error}`);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur');
    }
  };

  // Charger participants
  const loadParticipants = async (tournamentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setParticipants(data.participants);
        setExpandedTournament(tournamentId);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des participants');
    }
  };

  const addParticipant = async (tournamentId) => {
    if (!newParticipant) return alert('Veuillez saisir le nom d’utilisateur à ajouter.');
    if (participants.find(p => p.username === newParticipant)) return alert('Utilisateur déjà inscrit.');

    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/add-participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newParticipant }),
      });
      const data = await res.json();
      if (data.ok) {
        setParticipants(prev => [...prev, data.user]);
        setNewParticipant('');
        alert(`✅ ${data.user.username} ajouté au tournoi`);
      } else alert(`❌ ${data.error}`);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur');
    }
  };

  // Retirer un participant
  const removeParticipant = async (tournamentId, userId) => {
    if (!confirm('Retirer ce participant ?')) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/tournaments/${tournamentId}/participants/${userId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.ok) setParticipants(p => p.filter(p => p.id !== userId));
      else alert(data.error);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur');
    }
  };

  // Supprimer un tournoi
  const deleteTournament = async (tournamentId) => {
    if (!confirm('Supprimer ce tournoi ?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setTournaments(t => t.filter(t => t.id !== tournamentId));
        if (expandedTournament === tournamentId) setExpandedTournament(null);
      } else alert(data.error);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur');
    }
  };

  // Lancer un tournoi
  const startTournament = async (tournamentId) => {
    if (!confirm('Lancer ce tournoi ?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        alert('✅ Tournoi lancé !');
        setTournaments(prev =>
          prev.map(t => (t.id === tournamentId ? { ...t, status: 'started' } : t))
        );
        window.location.href = `/admin/${tournamentId}`; // redirection vers la page du tournoi
      } else alert(`❌ ${data.error}`);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur');
    }
  };

  if (!user || !user.admin)
    return (
      <div className="container">
        <p>{message}</p>
      </div>
    );

  return (
    <>
      <Header />
      <main className="container" style={{ display: 'flex', gap: 32 }}>
        {/* Partie création de tournoi */}
        <div style={{ flex: 1, maxWidth: 400 }}>
          <h2>Créer un tournoi</h2>
          <div className="card">
            <div className="form-row">
              <label>Nom du tournoi</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du tournoi"
              />
            </div>

            <div className="form-row">
              <label>Date de début</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
            </div>

            <div className="form-row">
              <label>Nombre de rondes</label>
              <input
                type="number"
                className="input"
                value={form.rounds_total}
                onChange={e => setForm({ ...form, rounds_total: e.target.value })}
                min={1}
              />
            </div>
            
            <div className="form-row">
              <label>Cadence</label>
              <select
                value={form.cadence}
                onChange={e => setForm({ ...form, cadence: e.target.value })}
                className="border rounded w-full p-2">
                  <option value="10+0">10+0</option>
                  <option value="5+0">5+0</option>
                  <option value="3+2">3+2</option>
                </select>
            </div>

            <div className="form-row">
              <label>Lieu</label>
              <select
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="border rounded w-full p-2">
                  <option value="C410">Salle C410</option>
                  <option value="Fouaille">Fouaille</option>
                  <option value="N/A">A préciser</option>
                </select>
            </div>

            <button className="button" style={{ marginTop: 16 }} onClick={createTournament}>
              Créer le tournoi
            </button>
          </div>
        </div>

        {/* Partie liste des tournois et gestion */}
        <div style={{ flex: 2 }}>
          <h2>Liste des tournois</h2>
          {loading ? (
            <p>Chargement...</p>
          ) : tournaments.length === 0 ? (
            <p>Aucun tournoi actuellement.</p>
          ) : (
            <div className="grid" style={{ display: 'grid', gap: 16 }}>
              {tournaments.map(t => (
                <div key={t.id} className="card" style={{ padding: 16 }}>
                  <h3>{t.name}</h3>
                  <p>
                    🗓️ Début : {new Date(t.start_date).toLocaleDateString()}<br />
                    🎯 Rondes : {t.rounds_total}<br />
                    ⏱️ Cadence : {t.cadence}<br />
                    📍 Lieu : {t.location}<br />
                    👤 Créé par : {t.created_by_name || 'Inconnu'}<br />
                    🏁 Statut : {t.status || 'non lancé'}
                    </p>

                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => deleteTournament(t.id)}
                      style={{ color: 'red', marginRight: 8 }}
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() =>
                        expandedTournament === t.id
                          ? setExpandedTournament(null)
                          : loadParticipants(t.id)
                      }
                      style={{ marginRight: 8 }}
                    >
                      {expandedTournament === t.id ? 'Masquer participants' : 'Gérer participants'}
                    </button>
                    {t.status !== 'started' && (
                      <button onClick={() => startTournament(t.id)} style={{ color: 'green' }}>
                        Lancer le tournoi
                      </button>
                    )}
                  </div>

                  {expandedTournament === t.id && (
                    <div style={{ marginTop: 16 }}>
                      <h4>Participants ({participants.length})</h4>
                      {participants.length === 0 ? (
                        <p>Aucun participant pour ce tournoi.</p>
                      ) : (
                        <ul>
                          {participants.map(p => (
                            <li key={p.id}>
                            {p?.username || 'Inconnu'} (Elo: {p?.elo ?? 'N/A'})
                              <button
                                onClick={() => removeParticipant(t.id, p.id)}
                                style={{ color: 'red' }}
                              >
                                Retirer
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="Nom d’utilisateur à ajouter"
                          className="input"
                          value={newParticipant}
                          onChange={e => setNewParticipant(e.target.value)}
                        />
                        <button
                          className="button"
                          style={{ marginLeft: 8 }}
                          onClick={() => addParticipant(t.id)}
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
