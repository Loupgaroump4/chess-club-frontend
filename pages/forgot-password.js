// pages/forgot-password.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/proxy/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      // On n'insiste pas sur le résultat (message générique)
      setSent(true);
    } catch (err) {
      console.error(err);
      setSent(true);
    }
  };

  return (
    <>
      <Header />
      <main className="container">
        <h1>Mot de passe oublié</h1>
        {sent ? (
          <p>Si le compte existe, un e‑mail avec les instructions a été envoyé.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Nom d'utilisateur</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit">Envoyer les instructions</button>
          </form>
        )}
      </main>
    </>
  );
}
