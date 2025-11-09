import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
const API = "https://tpchess-backend.vercel.app";

export default function AdminTournament() {
  const router = useRouter();
  const { id } = router.query;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Charger toutes les données
  const fetchData = async () => {
  if (!id || !token) return;
  setLoading(true);

  try {
    // 🔹 Tournoi
    const resTour = await fetch(`https://tpchess-backend.vercel.app/api/tournaments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tourData = await resTour.json();

    if (tourData.ok) {
      // 🔹 Enrichir les rounds et les matches avec round_id
      const enrichedRounds = (tourData.tournament.rounds || []).map(r => ({
        ...r,
        matches: (r.matches || []).map(m => ({
          ...m,
          round_id: r.id, // ajoute round_id à chaque match
        })),
      }));

      setTournament(tourData.tournament);
      setRounds(enrichedRounds);
    }

    // 🔹 Participants
    const resPart = await fetch(`https://tpchess-backend.vercel.app/api/tournaments/${id}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const partData = await resPart.json();
    if (partData.ok) setParticipants(partData.participants);

    // 🔹 Scoreboard
    const resScore = await fetch(`https://tpchess-backend.vercel.app/api/tournaments/${id}/scoreboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const scoreData = await resScore.json();
    if (scoreData.ok) setScoreboard(scoreData.scoreboard);

  } catch (err) {
    console.error(err);
    alert('Erreur chargement des données.');
  } finally {
    setLoading(false);
  }
};

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
  
    fetchData();
  }, [id, token]);
  // --- Ajouter un participant ---
const addParticipant = async () => {
  const username = prompt("Nom d'utilisateur du joueur à ajouter :");
  if (!username) return;

  try {
    const res = await fetch(`${API}/api/tournaments/${id}/add-participant`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.ok) {
      alert(`✅ ${username} ajouté au tournoi`);
      fetchData(); // recharge les participants
    } else {
      alert(`❌ ${data.error || "Erreur serveur"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Erreur serveur");
  }
};

// --- Générer la manche suivante ---
const generateNextRound = async () => {
  if (!confirm("Voulez-vous générer la prochaine ronde ?")) return;

  try {
    const res = await fetch(`${API}/api/tournaments/${id}/next-round`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) {
      alert("✅ Nouvelle ronde générée");
      fetchData(); // recharge les rounds
    } else {
      alert(`❌ ${data.error || "Erreur serveur"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Erreur serveur");
  }
};

  // 🔹 Enregistrer un score
  const saveScore = async (matchId, result) => {
  if (!result) return alert('Sélectionnez un résultat.');

  let score1 = null, score2 = null;
  const norm = result.replace(/\s+/g, '').toLowerCase();
  if (norm === '1-0') [score1, score2] = [1, 0];
  else if (norm === '0-1') [score1, score2] = [0, 1];
  else if (norm === '0.5-0.5') [score1, score2] = [0.5, 0.5];

  if (score1 === null) return alert('Résultat invalide.');

  try {
    const res = await fetch(`https://tpchess-backend.vercel.app/api/rounds/${matchId}/score`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ score1, score2 }),
    });

    const data = await res.json();

    if (data.ok) {
      // Récupérer les nouveaux Elos renvoyés par l’API
      const eloMsg = data.newElo
        ? Object.entries(data.newElo)
            .map(([id, elo]) => `Joueur ${id}: ${elo}`)
            .join('\n')
        : '';

      alert(`✅ Score enregistré\n📈 Elo mis à jour :\n${eloMsg}`);
      fetchData(); // recharge scores, rounds et Elos
    } else {
      alert(`❌ ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert('Erreur serveur.');
  }
};

const markAbsent = async (match) => {
  const absent = prompt('Quel joueur est absent ? (1 ou 2)');
  if (absent !== '1' && absent !== '2') return alert('Choix invalide.');

  const absentName = absent === '1' ? match.player1_name : match.player2_name;

  // Debug
  console.log("absentName:", absentName);
  console.log("participants:", participants);

  const absentParticipant = participants.find(
    (p) => p.username.trim().toLowerCase() === absentName.trim().toLowerCase()
  );

  if (!absentParticipant?.id) return alert('Impossible de trouver l’ID du joueur.');

  if (!confirm('Confirmer l’absence ?')) return;
  console.log(`${match.id}`);
  try {
    const res = await fetch(`https://tpchess-backend.vercel.app/api/rounds/${match.id}/absent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ absentPlayerId: absentParticipant.id }),
    });
    const data = await res.json();
    if (data.ok) {
      alert('✅ Joueur absent mis à jour');
      fetchData();
    } else alert(`❌ ${data.error}`);
  } catch (err) {
    console.error(err);
    alert('Erreur serveur.');
  }
};

;

  if (loading) return <p>Chargement...</p>;

  if (!user || !user.admin)
    return (
      <div className="container">
        <p>{message}</p>
      </div>
    );

  return (
    <>
      <Header />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Tournoi : {tournament?.name}</h1>
        {/* Tableau des scores */}
        <h2 className="text-lg font-bold mb-2">Classement individuel</h2>
        <table className="mx-auto border border-gray-300 border-collapse">
  <thead>
    <tr className="bg-gray-100">
      <th className="border p-2">#</th>
      <th className="border p-2">Joueur</th>
      <th className="border p-2">Score</th>
    </tr>
  </thead>
  <tbody>
    {scoreboard
      .sort((a, b) => b.score - a.score) // optionnel : trier du plus grand au plus petit
      .map((p, index) => (
        <tr key={p.user_id ?? index}>
          <td className="border p-2 font-bold">{index + 1}</td>
          <td className="border p-2">{p.username}</td>
          <td className="border p-2">{p.score ?? 0}</td>
        </tr>
      ))}
  </tbody>
</table>

        {/* Participants */}
        <h2 className="text-lg font-bold mb-2">Participants</h2>
        {participants.length === 0 ? (
          <p>Aucun participant pour ce tournoi.</p>
        ) : (
          <ul className="list-disc pl-6 mb-4">
            {participants.map((p) => (
              <li key={p.id}>{p.username} (Elo: {p.elo || 'N/A'})</li>
            ))}
          </ul>
        )}

        {/* Rounds */}
          <h2 className="text-lg font-bold mb-2">Rounds</h2>
            {rounds.length === 0 ? (
          <p>Aucune ronde pour le moment.</p>
          ) : (
          rounds.map((m) => (
            <div key={m.id} className="border p-3 rounded-md mb-3 bg-white shadow">
              <p>
                <strong>Ronde {m.round_number}</strong>
              </p>

              <p>
                {m.player1_name} {m.player2_name ? `vs ${m.player2_name}` : '(bye)'}
              </p>

              {m.finished ? (
                <p className="text-sm text-gray-600">
                  Score : <strong>{m.score1 ?? '-'}</strong> - <strong>{m.score2 ?? '-'}</strong>
                </p>
                ) : (
                m.player2_name && (
                  <div className="flex gap-2 items-center mt-1">
                    <select
                      value={m.result || ''}
                      onChange={(e) =>
                        setRounds((prev) =>
                          prev.map((rm) =>
                            rm.id === m.id ? { ...rm, result: e.target.value } : rm
                          )
                        )
                      }
                      className="border rounded p-1"
                    >
                      <option value="">Résultat</option>
                      <option value="1-0">1-0</option>
                      <option value="0-1">0-1</option>
                      <option value="0.5-0.5">0.5-0.5</option>
                    </select>

                    <button
                      onClick={() => saveScore(m.id, m.result)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Enregistrer
                    </button>
                  
                    {!m.score1 && (
                      <button
                        onClick={() => markAbsent(m)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Absent
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          ))
        )}

      <div className="flex gap-3 mb-6">
          {/* Ajouter un participant */}
          <button
  onClick={async () => {
    const username = prompt("Nom du joueur à ajouter :");
    if (!username) return;

    try {
      const res = await fetch(`${API}/api/tournaments/${id}/add-participant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json().catch(() => null); // sécurité si JSON invalide
      if (res.ok && data?.ok) {
        alert("✅ Participant ajouté !");
        fetchData();
      } else {
        alert("❌ " + (data?.error || `Erreur serveur (${res.status})`));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur : " + err.message);
    }
  }}
  className="px-4 py-2 bg-green-600 text-white rounded"
>
  ➕ Ajouter un participant
</button>


          {/* Générer le prochain round */}
          <button
  onClick={async () => {
    if (!confirm("Générer le prochain round ?")) return;

    try {
      const res = await fetch(`${API}/api/tournaments/${id}/next-round`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        alert("✅ Nouveau round généré !");
        fetchData();
      } else {
        alert("❌ " + (data?.error || `Erreur serveur (${res.status})`));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur : " + err.message);
    }
  }}
  className="px-4 py-2 bg-purple-600 text-white rounded"
>
  ♟️ Générer la prochaine ronde
</button>

        </div>
      </main>
    </>
  );
}
