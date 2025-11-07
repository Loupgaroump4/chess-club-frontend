import Header from '../components/Header'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Compte() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ username: '', password: '', email: '' })

  // Vérifie si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch('https://tpchess-backend.vercel.app/proxy/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch(() => {})
    }
  }, [])

  async function register() {
    const res = await fetch('https://tpchess-backend.vercel.app/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (res.ok) {
      alert(`Inscription réussie pour "${data.user.username}" !`)
      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/') // redirection vers l'accueil
    } else {
      alert(data.error || 'Erreur lors de l\'inscription')
    }
  }
  async function login() {
    const res = await fetch('https://tpchess-backend.vercel.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json() // lecture unique du JSON

    if (res.ok) {
      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      alert(`Connexion réussie ! Bienvenue ${data.user.username}`)
      router.push('/') // redirection vers l'accueil
    } else {
      alert(data.error || 'Erreur lors de la connexion')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    alert('Déconnecté avec succès')
  }

  return (
    <>
      <Header />
      <main className="container">
        <h1>Mon Compte</h1>

        {user ? (
          <div className="card">
            <h3>Bonjour {user.username}</h3>
            <p className="small">Elo: {user.elo}</p>
            <p className="small">Admin: {user.admin ? 'Oui' : 'Non'}</p>
            <button className="button" onClick={logout}>Déconnexion</button>
          </div>
        ) : (
          <div className="card">
            <h3>Se connecter / s'inscrire</h3>
            <div className="form-row">
              <input
                className="input"
                type="email"
                placeholder="Email (si inscription)"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
            </div>
            <div classname="form-row">
              <input
                className="input"
                placeholder="Nom d'utilisateur"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="form-row">
              <input
                type="password"
                className="input"
                placeholder="Mot de passe"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button className="button" onClick={login}>Se connecter</button>
            <button style={{ marginLeft: 8 }} className="button" onClick={register}>S'inscrire</button>
            <button style={{ marginLeft: 8 }} className="button" onClick={()=> router.push ("/forgot-password")}>Mot de passe oublié ? </button>
          </div>
        )}
      </main>
    </>
  )
}
