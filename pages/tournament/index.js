// pages/tournois/index.js
import { useEffect, useState } from 'react'
import Header from '../../components/Header'

export default function Tournois() {
  const [tournois, setTournois] = useState([])
  const [user, setUser] = useState(null)

  // Chargement utilisateur
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  // Chargement des tournois
  useEffect(() => {
    fetch('http://localhost:5000/api/tournaments')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setTournois(data.tournaments)
      })
      .catch(err => console.error('Erreur chargement tournois:', err))
  }, [])

  async function rejoindreTournoi(id) {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Connecte-toi avant de rejoindre un tournoi.')
      return
    }

    const res = await fetch(`http://localhost:5000/api/tournaments/${id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await res.json()
    if (data.ok) {
      alert('✅ Inscription au tournoi réussie !')
    } else {
      alert(`❌ ${data.error || 'Erreur lors de l’inscription.'}`)
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <h1 className="title">Tournois</h1>

        {tournois.length === 0 ? (
          <p>Aucun tournoi trouvé.</p>
        ) : (
          <div className="grid">
            {tournois.map(t => (
              <div key={t.id} className="card">
                <h3>{t.name}</h3>
                <p>Date : {new Date(t.created_at).toLocaleDateString()}</p>
                <p>Rondes prévues : {t.rounds_total}</p>

                {user ? (
                  <button
                    className="button"
                    onClick={() => rejoindreTournoi(t.id)}
                  >
                    S’inscrire
                  </button>
                ) : (
                  <p className="small">Connecte-toi pour t’inscrire.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
