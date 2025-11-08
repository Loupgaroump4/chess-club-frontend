import { useEffect, useState } from "react";
import Header from "../components/Header";

export default function Joueurs() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchClassement();
  }, []);

  const fetchClassement = async () => {
    try {
      const res = await fetch("https://tpchess-backend.vercel.app/api/classement");
      const data = await res.json();
      if (data.ok) setPlayers(data.players);
    } catch (err) {
      console.error("Erreur chargement classement :", err);
    }
  };

  return (
    <>
      <Header/>
      <main className="container">
        <h1>Classement des joueurs</h1>

        <table className="ranking">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Joueur</th>
              <th>ELO</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td>{p.username}</td>
                <td>{p.elo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <style jsx>{`
          .ranking {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #222;
            color: #fff;
          }
          tr:hover {
            background: #f2f2f2;
          }
        `}</style>
      </main>
    </>
  );
}


