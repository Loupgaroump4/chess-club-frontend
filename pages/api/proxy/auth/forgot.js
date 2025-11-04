export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
  }

  try {
    const backendRes = await fetch("http://localhost:5000/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json();
    return res.status(backendRes.status).json(data);

  } catch (err) {
    console.error("Erreur proxy forgot:", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur proxy" });
  }
}
