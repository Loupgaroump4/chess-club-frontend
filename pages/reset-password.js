import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query; // token passé dans l'URL
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null); // null / 'success' / 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return alert('Token manquant');
    if (password.length < 6) return alert('Mot de passe trop court (>=6 caractères)');
    if (password !== confirm) return alert('Les mots de passe ne correspondent pas');

    try {
      const res = await fetch('https://tpchess-backend.vercel.app/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <>
      <Header />
      <main className="container">
        <h1>Réinitialiser le mot de passe</h1>

        {status === 'success' ? (
          <p>Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button type="submit">Réinitialiser</button>
          </form>
        )}
      </main>
    </>
  );
}


