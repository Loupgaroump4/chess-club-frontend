import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
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
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u); // on garde info user si connecté
    }
    fetchEvents(); // on charge le planning même si non connecté
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/planning", {
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
        ? `http://localhost:5000/api/planning-update/${currentEvent.id}`
        : "http://localhost:5000/api/planning-add";
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
      const res = await fetch(`http://localhost:5000/api/planning-delete/${currentEvent.id}`, {
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

  return (
    <>
      <Header />
      <main className="container">
        <h1>Planning du club</h1>
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
    editable={false}
    selectable={false}
    height="auto"
    slotMinTime="15:00:00"
    slotMaxTime="23:00:00"
    allDaySlot={false}
  />
        {/* Modal */}
        

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
