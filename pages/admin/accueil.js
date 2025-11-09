import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";

export default function AdminAccueil() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [newsList, setNewsList] = useState([]);

  // Fonction pour parser le texte
function parseNewsText(text) {
  if (!text) return "";

  // Titres
  text = text
    .replace(/<<<<(.*?)>>>>/g, "<h2>$1</h2>")   // Grand titre
    .replace(/<<<(.*?)>>>/g, "<h3>$1</h3>")     // Moyen titre
    .replace(/<<(.*?)>>/g, "<h4>$1</h4>"); // Petit titre simple

  // Mise en forme combinable
  text = text
    .replace(/\/\/(.*?)\/\//g, "<i>$1</i>")     // italique
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")     // gras
    .replace(/__(.*?)__/g, "<u>$1</u>");        // souligné

  return text;
}


  // Vérification utilisateur/admin et chargement des actualités
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setErrorMsg("⚠️ Vous devez être connecté");
      router.push("/login");
      return;
    }

    const u = JSON.parse(storedUser);
    setUser(u);

    if (!u.admin) {
      setErrorMsg("⛔ Accès réservé aux administrateurs");
      router.push("/");
      return;
    }

    fetchNews();
  }, [router]);

  const fetchNews = async () => {
    try {
      const res = await fetch("https://tpchess-backend.vercel.app/api/news");
      const data = await res.json();
      if (data.ok) setNewsList(data.news);
    } catch (err) {
      console.error("Erreur chargement actualités :", err);
    }
  };

  const handlePublish = async () => {
    if (!message.trim()) return alert("Veuillez saisir un message.");
    if (!token) return alert("Non autorisé.");

    const formData = new FormData();
    formData.append("message", message);
    if (image) formData.append("image", image);

    try {
      const res = await fetch("https://tpchess-backend.vercel.app/api/news", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        alert("✅ Actualité publiée !");
        setMessage("");
        setImage(null);
        fetchNews(); // recharger la liste
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!confirm("Supprimer cette actualité ?")) return;

    try {
      const res = await fetch(`https://tpchess-backend.vercel.app/api/news/${newsId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Actualité supprimée");
        setNewsList(prev => prev.filter(n => n.id !== newsId));
      } else alert(`❌ ${data.error}`);
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    }
  };

  if (!user || !user.admin) return <p>{errorMsg}</p>;

    return (
    <>
      <Header />
      <main className="container">
        <h1>Administration du Club</h1>

        {/* Publication actu */}
        <div className="card">
          <h3>Publier une actualité</h3>
          <textarea
            className="input"
            placeholder="**test1** => gras;  __test2__ => souligné ; //test3// => italique ;  <<test4>> => petit titre ;  <<<test5>>> => moyen titre ; <<<<test6>>>> => gr titre"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ marginTop: 10 }}
          />
          <button className="btn" onClick={handlePublish}>
            ✅ Publier
          </button>
        </div>

        {/* Liste des actualités publiées */}
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
         <button
          className="btn"
          onClick={() => handleDeleteNews(n.id)}
          style={{ marginTop: 5, color: "red" }}
        >
          Supprimer l'actualité
        </button>
      </div>
    ))
  )}
</div>

      </main>
    </>
    );

}



