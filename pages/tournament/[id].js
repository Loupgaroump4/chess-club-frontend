import { useState, useEffect, useMemo } from "react";
import Header from "../../components/Header";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TournamentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roundGroups, setRoundGroups] = useState([]); // [{ round_number, matches: [...] }]
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // --- Load tournament, participants, user and rounds ---
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        // 1) Tournament
        const res = await fetch(`${API}/api/tournaments/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Erreur tournoi");
        setTournament(data.tournament || null);

        // 2) Participants (endpoint separate)
        try {
          const resPart = await fetch(`${API}/api/tournaments/${id}/participants`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const partData = await resPart.json();
          if (partData.ok) setParticipants(partData.participants || []);
        } catch (e) {
          console.warn('Impossible de charger participants:', e);
          setParticipants([]);
        }

        // 3) Rounds (flat list) -> group by round_number
        try {
          const resRounds = await fetch(`${API}/api/tournaments/${id}/rounds`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const roundsJson = await resRounds.json();
          if (roundsJson.ok && Array.isArray(roundsJson.rounds)) {
            const rows = roundsJson.rounds;
            const grouped = Object.values(
              rows.reduce((acc, r) => {
                const rn = r.round_number || 0;
                if (!acc[rn]) acc[rn] = { round_number: rn, matches: [] };
                // Normalize match row to expected shape
                acc[rn].matches.push({
                  id: r.id,
                  round_id: r.id, // keep id for score/absent endpoints
                  player1_id: r.player1_id,
                  player1_name: r.player1_name || r.player1_name,
                  player2_id: r.player2_id,
                  player2_name: r.player2_name || r.player2_name,
                  score1: r.score1,
                  score2: r.score2,
                  finished: !!r.finished,
                });
                return acc;
              }, {})
            ).sort((a, b) => a.round_number - b.round_number);

            setRoundGroups(grouped);
          } else {
            setRoundGroups([]);
          }
        } catch (e) {
          console.warn('Impossible de charger rounds:', e);
          setRoundGroups([]);
        }

        // 4) current user
        if (token) {
          try {
            const userRes = await fetch(`${API}/api/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const userData = await userRes.json();
            if (userData.ok && userData.user) setUser(userData.user);
          } catch (e) {
            console.warn('Impossible de charger user:', e);
            setUser(null);
          }
        }
      } catch (err) {
        console.error(err);
        alert("Erreur chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, token]);

  // --- Derived values ---
  const roundsSorted = useMemo(() => {
    return roundGroups.map(r => ({
      ...r,
      finished: r.matches.length > 0 && r.matches.every(m => !!m.finished),
    }));
  }, [roundGroups]);

  // current round = first not finished, else null
  const currentRound = roundsSorted.find(r => !r.finished) || null;
  const previousRounds = roundsSorted.filter(r => r.finished);

  // helper to find player's match in a list of matches
  const findPlayerMatch = (matches, username) => {
    if (!Array.isArray(matches)) return null;
    return matches.find(m => m.player1_name === username || m.player2_name === username) || null;
  };

  // --- Actions ---
  const saveScore = async (matchId, result) => {
    if (!token) return alert('Connecte-toi pour enregistrer un score');
    if (!result) return alert('Sélectionnez un résultat.');

    let score1 = null, score2 = null;
    const norm = result.replace(/\s+/g, '').toLowerCase();
    if (norm === '1-0') [score1, score2] = [1, 0];
    else if (norm === '0-1') [score1, score2] = [0, 1];
    else if (norm === '0.5-0.5' || norm === '0.5-0.5') [score1, score2] = [0.5, 0.5];
    if (score1 === null) return alert('Résultat invalide.');

    try {
      const res = await fetch(`${API}/api/rounds/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score1, score2 }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('✅ Score enregistré');
        // refresh rounds
        const ev = new Event('refreshRounds');
        window.dispatchEvent(ev);
      } else alert(`❌ ${data.error}`);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur.');
    }
  };

  const markAbsent = async (match) => {
    if (!token) return alert('Connecte-toi pour marquer une absence');
    const absent = prompt('Quel joueur est absent ? (1 ou 2)');
    const absentId = absent === '1' ? match.player1_id : absent === '2' ? match.player2_id : null;
    if (!absentId) return alert('Choix invalide.');
    if (!confirm('Confirmer l\'absence ?')) return;

    try {
      const res = await fetch(`${API}/api/rounds/${match.id}/absent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ absentPlayerId: absentId }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('✅ Joueur absent mis à jour');
        const ev = new Event('refreshRounds');
        window.dispatchEvent(ev);
      } else alert(`❌ ${data.error}`);
    } catch (err) {
      console.error(err);
      alert('Erreur serveur.');
    }
  };

  // listen for manual refresh events (after score/absent)
  useEffect(() => {
    const handler = () => {
      // re-trigger the load by programmatically calling the useEffect dependency
      // simpler: reload rounds only
      (async () => {
        if (!id) return;
        try {
          const resRounds = await fetch(`${API}/api/tournaments/${id}/rounds`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const roundsJson = await resRounds.json();
          if (roundsJson.ok && Array.isArray(roundsJson.rounds)) {
            const rows = roundsJson.rounds;
            const grouped = Object.values(
              rows.reduce((acc, r) => {
                const rn = r.round_number || 0;
                if (!acc[rn]) acc[rn] = { round_number: rn, matches: [] };
                acc[rn].matches.push({
                  id: r.id,
                  round_id: r.id,
                  player1_id: r.player1_id,
                  player1_name: r.player1_name,
                  player2_id: r.player2_id,
                  player2_name: r.player2_name,
                  score1: r.score1,
                  score2: r.score2,
                  finished: !!r.finished,
                });
                return acc;
              }, {})
            ).sort((a, b) => a.round_number - b.round_number);

            setRoundGroups(grouped);
          }
        } catch (e) {
          console.warn('reloadRounds error', e);
        }
      })();
    };

    window.addEventListener('refreshRounds', handler);
    return () => window.removeEventListener('refreshRounds', handler);
  }, [id, token]);

  // --- Loading / not found states ---
  if (loading || !tournament) return (
    <>
      <Header />
      <div className="container mt-10">Chargement...</div>
    </>
  );

  // --- CASES ---
  if (tournament.status === 'not_started' || !tournament.status) {
    return (
      <>
        <Header />
        <main className="container mt-10">
          <h1 className="text-2xl font-bold mb-6">{tournament.name}</h1>
          <p>Le tournoi n’a pas encore commencé.</p>
          <h3 className="mt-4 font-semibold">Joueurs inscrits :</h3>
          {participants.length === 0 ? (
            <p>Aucun participant pour le moment.</p>
          ) : (
            <ul className="list-disc pl-6">
              {participants.map((p) => (
                <li key={p.id}>{p.username} (Elo: {p.elo || 'N/A'})</li>
              ))}
            </ul>
          )}
        </main>
      </>
    );
  }

  if (tournament.status === 'finished') {
    // If backend provides results in tournament.results use that, otherwise compute from participants/rounds
    const results = tournament.results || [];
    const myRankIndex = results.findIndex(r => r.username === user?.username);
    const myScore = myRankIndex >= 0 ? results[myRankIndex].score : null;

    return (
      <>
        <Header />
        <main className="container mt-10 text-center">
          <h1 className="text-3xl font-bold mb-6">🏁 Résultats du tournoi</h1>
          {user && myRankIndex >= 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-semibold">Ton classement : <span className="text-blue-600">{myRankIndex + 1}ᵉ</span></h2>
              <p>Score total : {myScore}</p>
            </div>
          )}

          <h3 className="text-xl font-semibold mb-3">Classement général</h3>
          <table className="mx-auto border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">#</th>
                <th className="border p-2">Joueur</th>
                <th className="border p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, index) => (
                <tr key={r.user_id} className={r.username === user?.username ? 'bg-yellow-100' : ''}>
                  <td className="border p-2 font-bold">{index + 1}</td>
                  <td className="border p-2">{r.username}</td>
                  <td className="border p-2">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </>
    );
  }

  // --- tournament.status === 'started' ---
  const myMatch = currentRound ? findPlayerMatch(currentRound.matches, user?.username) : null;
  const opponent = myMatch ? (myMatch.player1_name === user?.username ? myMatch.player2_name : myMatch.player1_name) : null;

  // Compute my total score from previousRounds
  const myScore = previousRounds.reduce((acc, r) => {
    const m = findPlayerMatch(r.matches, user?.username);
    if (!m) return acc;
    // If scores are stored numeric
    if (typeof m.score1 === 'number' && typeof m.score2 === 'number') {
      if (m.player1_name === user?.username) return acc + (m.score1 || 0);
      if (m.player2_name === user?.username) return acc + (m.score2 || 0);
      return acc;
    }
    // fallback to result string
    if (m.result === '1-0' && m.player1_name === user?.username) return acc + 1;
    if (m.result === '0-1' && m.player2_name === user?.username) return acc + 1;
    if (m.result === '0.5-0.5') return acc + 0.5;
    return acc;
  }, 0);

  return (
    <>
      <Header />
      <main className="container mt-10">
        <h1 className="text-2xl font-bold mb-6">{tournament.name}</h1>
        <p className="mb-4">Tournoi en cours !</p>

        <div className="card mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Ta ronde actuelle</h2>

          {currentRound ? (
            <>
              {Array.isArray(currentRound.matches) && currentRound.matches.length === 0 ? (
                <p>En attente des appariements...</p>
              ) : myMatch ? (
                <>
                  <p>Adversaire : {opponent || 'Bye'}</p>
                  <p>Tu joues avec les pièces : {myMatch.player1_name === user?.username ? 'Blanches' : 'Noires'}</p>

                  {!myMatch.finished && (
                    <div className="mt-2 flex gap-2 items-center">
                      <select id={`result-${myMatch.id}`} defaultValue="" className="border rounded p-1">
                        <option value="">Résultat</option>
                        <option value="1-0">1-0</option>
                        <option value="0-1">0-1</option>
                        <option value="0.5-0.5">0.5-0.5</option>
                      </select>
                      <button onClick={() => {
                        const sel = document.getElementById(`result-${myMatch.id}`);
                        saveScore(myMatch.id, sel.value);
                      }} className="bg-blue-500 text-white px-3 py-1 rounded">Enregistrer</button>

                      <button onClick={() => markAbsent(myMatch)} className="bg-red-500 text-white px-3 py-1 rounded">Absent</button>
                    </div>
                  )}
                </>
              ) : (
                <p>Aucun match trouvé pour cette ronde.</p>
              )}
            </>
          ) : (
            <p>Aucune ronde courante trouvée.</p>
          )}
        </div>

        {previousRounds.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-2">Résultats précédents</h3>
            <ul className="list-disc pl-6">
              {previousRounds.map((r) => {
                const m = findPlayerMatch(r.matches, user?.username);
                if (!m) return null;
                return (
                  <li key={r.round_number}>
                    Ronde {r.round_number}: {m.player1_name} vs {m.player2_name || 'Bye'} → {m.finished ? `${m.score1 ?? '-'} - ${m.score2 ?? '-'}` : 'en attente'}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 font-semibold">Score total : {myScore}</p>
          </>
        )}
      </main>
    </>
  );
}
