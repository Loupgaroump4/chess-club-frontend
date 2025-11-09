import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";

export default function AdminPlanning() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [formData, setFormData] = useState({ title: "", format: "cours", début: "", fin: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("../planning");
      return;
    }
    const u = JSON.parse(storedUser);
    setUser(u);
    if (!u.admin) {
      router.push("/");
      return;
    }
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("https://tpchess-backend.vercel.app/ping/api/planning", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.ok) setEvents(data.events);
    } catch (err) {
      console.error("Erreur chargement planning :", err);
    }
  };

  const handleDateClick = (info) => {
    setFormData({ title: "", format: "cours", début: info.dateStr, fin: info.dateStr });
    setCurrentEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (info) => {
    const ev = info.event;
    setFormData({
      title: ev.title,
      format: ev.extendedProps.format,
      début: ev.start.toISOString(),
      fin: ev.end ? ev.end.toISOString() : ev.start.toISOString(),
    });
    setCurrentEvent(ev);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = currentEvent ? "PUT" : "POST";
      const url = currentEvent
        ? `https://tpchess-backend.vercel.app/api/planning-update/${currentEvent.id}`
        : "https://tpchess-backend.vercel.app/api/planning-add";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        fetchEvents();
        setModalOpen(false);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    }
  };

  const handleDelete = async () => {
    if (!currentEvent) return;
    if (!confirm("Supprimer cet événement ?")) return;
    try {
      const res = await fetch(`https://tpchess-backend.vercel.app/api/planning-delete/${currentEvent.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        fetchEvents();
        setModalOpen(false);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    }
  };

  if (!user || !user.admin) return <p>Chargement...</p>;

  return (
    <>
      <Header />
      <main className="container">
        <h1>Planning du club - vue admin</h1>
        <FullCalendar
  plugins={[timeGridPlugin, interactionPlugin]}
  locales={[frLocale]}
  locale="fr"
  initialView="timeGridWeek"
  events={events.map(ev => {
    let color = "#5A5A5A"; // défaut

    switch (ev.format) {
      case "cours":
        color = "#2ecc71"; // vert
        break;
      case "tournoi":
        color = "#e74c3c"; // rouge
        break;
      case "afterwork":
        color = "#1f3a93"; // bleu foncé
        break;
      case "chessbar":
        color = "#8e44ad"; // violet
        break;
    }

    return {
      id: ev.id,
      title: ev.title,
      start: ev.début,
      end: ev.fin,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { format: ev.format }
    };
  })}
  dateClick={handleDateClick}
  eventClick={handleEventClick}
  editable={true}
  selectable={true}
  height="auto"
  slotMinTime="15:00:00"
  slotMaxTime="23:00:00"
  allDaySlot={false}
/>


        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{currentEvent ? "Modifier l'événement" : "Ajouter un événement"}</h3>
              <form onSubmit={handleSubmit}>
                <label>Titre:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <label>Type:</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <option value="cours">Cours</option>
                  <option value="tournoi">Tournoi</option>
                  <option value="afterwork">Afterwork</option>
                  <option value="chessbar">ChessBar</option>
                </select>
                <label>Début:</label>
                <input
                  type="datetime-local"
                  value={formData.début.slice(0,16)}
                  onChange={(e) => setFormData({ ...formData, début: e.target.value })}
                  required
                />
                <label>Fin:</label>
                <input
                  type="datetime-local"
                  value={formData.fin.slice(0,16)}
                  onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
                  required
                />
                <div style={{ marginTop: 10 }}>
                  <button type="submit" className="btn">Enregistrer</button>
                  {currentEvent && (
                    <button type="button" className="btn" style={{ marginLeft: 10, color: "red" }} onClick={handleDelete}>
                      Supprimer
                    </button>
                  )}
                  <button type="button" className="btn" style={{ marginLeft: 10 }} onClick={() => setModalOpen(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000;
          }
          .modal {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 350px;
          }
          .modal label {
            display: block;
            margin-top: 10px;
          }
          .modal input, .modal select {
            width: 100%;
            margin-top: 5px;
            padding: 5px;
          }
        `}</style>
      </main>
    </>
  );
}


