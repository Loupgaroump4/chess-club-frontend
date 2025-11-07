import { useState, useEffect } from "react";
import Header from "../components/Header";

export default function Home() {
  const [newsList, setNewsList] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 5;
  const [upcoming, setUpcoming] = useState([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ✅ FORMATAGE TEXTE DES ACTUALITÉS
  function parseNewsText(text) {
    if (!text) return "";

    return text
      // Titres
      .replace(/<<<<(.*?)>>>>/g, "<h2>$1</h2>")
      .replace(/<<<(.*?)>>>/g, "<h3>$1</h3>")
      .replace(/<<(.*?)>>/g, "<h4>$1</h4>")
      // Mise en forme
      .replace(/\/\/(.*?)\/\//g, "<i>$1</i>")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/__(.*?)__/g, "<u>$1</u>");
  }

  // ✅ CHARGEMENT DES DONNÉES
  useEffect(() => {
    fetchUpcoming();
    fetchNews();
  }, [page]);

  const fetchUpcoming = async () => {
    try {
      const res = await fetch("https://tpchess-backend.vercel.app/api/tournaments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!data.ok) return;

      const today = new Date();
      setUpcoming(data.tournaments.filter(t =>
        new Date(t.start_date) >= today
      ));
    } catch (err) {
      console.error("Erreur chargement tournois :", err);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://tpchess-backend.vercel.app/api/news?page=${page}&limit=${pageSize}`);
      const data = await res.json();
      if (!data.ok) return;

      setNewsList(prev =>
        page === 1 ? data.news : [...prev, ...data.news]
      );
    } catch (err) {
      console.error("Erreur chargement actualités :", err);
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="container">
        <h1>Bienvenue au Club d'échecs</h1>

        {/* ✅ TOURNOIS */}
        <div className="card">
          <h3>Prochains tournois</h3>
          {upcoming.length === 0 ? (
            <p className="small">Aucun tournoi à venir pour l’instant.</p>
          ) : (
            <ul>
              {upcoming.map(t => (
                <li key={t.id} style={{ marginBottom: 12 }}>
                  <strong>{t.name}</strong><br />
                  📅 {new Date(t.start_date).toLocaleDateString()}<br />
                  📍 {t.location || "Non spécifié"}<br />
                  ⏱️ {t.cadence || "Non spécifiée"}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ ACTUALITÉS */}
        <div className="card">
  <h3>Actualités</h3>

  {newsList.length === 0 ? (
    <p className="small">Aucune actualité pour l'instant.</p>
  ) : (
    newsList.map(n => (
      <div 
        key={n.id} 
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          borderBottom: "1px solid #ddd",
          paddingBottom: "15px",
          marginBottom: "15px"
        }}
      >
        {/* ✅ Image */}
        {n.image_url && (
          <img
            src={`https://tpchess-backend.vercel.app/${n.image_url}`}
            alt="actualité"
            style={{
              height: "150px",
              width: "auto",
              borderRadius: "6px",
              objectFit: "cover"
            }}
          />
        )}
        {/* ✅ Texte */}
        <div style={{ flex: 1 }}>
          <div 
            dangerouslySetInnerHTML={{ __html: parseNewsText(n.message) }} 
          />
        </div>
      </div>
    ))
  )}

  {loading && <p>Chargement...</p>}
  {!loading && newsList.length % pageSize === 0 && newsList.length > 0 && (
    <button onClick={() => setPage(prev => prev + 1)}>Voir plus</button>
  )}
</div>

      </main>
    </>
  );
}
