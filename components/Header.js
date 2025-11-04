import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Vérifie si l'utilisateur est connecté
  useEffect(() => {
    const storedUser = localStorage.getItem('user'); // ou 'token' si tu stockes seulement le JWT
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erreur parsing user:', e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const goToAccount = () => {
    if (user) {
      // Redirige vers la page de stats du compte
      router.push('/compte');
    } else {
      // Redirige vers la page connexion/inscription
      router.push('/auth');
    }
  };

  return (
    <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: 'lightgray',
          color: '#1E3A8A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 24
        }}>♞</div>
        <div>
          <div style={{ fontWeight: 800, color: 'lightgray' }}>Club d'échecs</div>
          <div style={{ fontSize: 12 }}>Meilleur club d'échecs de tout Strasbourgl</div>
        </div>
      </div>

      <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/">Accueil</Link>
        <Link href="/tournois">Tournois</Link>
        <Link href="/joueurs"> Joueurs </Link>
        <Link href="/planning">Planning</Link>
        <Link href="/blog">Blog</Link>
        <button className="button" onClick={goToAccount}>Mon Compte</button>
      </nav>
    </header>
  )
}
