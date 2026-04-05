import { useState } from "react";
import API from "../api/api";
import "../App.css";

export default function Auth({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleForm = () => {
    setIsSignup(!isSignup);
    setMessage("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        // ✅ CHANGEMENT ICI : /signup → /auth/register
        // Et on envoie "name" au lieu de firstName/lastName
        const name = `${firstName} ${lastName}`.trim();
        await API.post("/auth/register", { name, email, password });
        setIsError(false);
        setMessage("Inscription réussie ! Connectez-vous maintenant.");
        setIsSignup(false);
        // Réinitialiser les champs
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
      } else {
        // ✅ CHANGEMENT ICI : /login → /auth/login
        const res = await API.post("/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role); // 👈 Sauvegarder le rôle aussi
        localStorage.setItem("userId", res.data.id); // 👈 Sauvegarder l'ID
        
        // 👇 Extraire et sauvegarder firstName et lastName depuis le name
        const nameParts = res.data.name.split(' ');
        const extractedFirstName = nameParts[0] || '';
        const extractedLastName = nameParts.slice(1).join(' ') || '';
        localStorage.setItem("firstName", extractedFirstName);
        localStorage.setItem("lastName", extractedLastName);
        
        setIsError(false);
        setMessage(`Bienvenue ${res.data.name} !`);
        if (onLoginSuccess) onLoginSuccess(res.data);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || err.response?.data?.error || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Décor en arrière-plan */}
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />
      <div className="auth-bg-orb auth-orb-3" />

      <div className="auth-card">
        {/* Logo / icône */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        {/* Titre avec transition */}
        <div className="auth-header">
          <h2 className="auth-title">{isSignup ? "Créer un compte" : "Bienvenue"}</h2>
          <p className="auth-subtitle">
            {isSignup ? "Remplissez les informations ci-dessous" : "Connectez-vous pour continuer"}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`auth-fields-wrap ${isSignup ? "auth-fields-visible" : ""}`}>
            <div className="auth-field-group">
              <label className="auth-label">Prénom</label>
              <input
                type="text"
                placeholder="Jean"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="auth-input"
                required={isSignup}
              />
            </div>
            <div className="auth-field-group">
              <label className="auth-label">Nom</label>
              <input
                type="text"
                placeholder="Dupont"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="auth-input"
                required={isSignup}
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label">Email</label>
            <input
              type="email"
              placeholder="jean@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-label">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            <span className={`auth-btn-text ${loading ? "auth-btn-text-hidden" : ""}`}>
              {isSignup ? "S'inscrire" : "Se connecter"}
            </span>
            {loading && <span className="auth-btn-spinner" />}
          </button>
        </form>

        {/* Message de retour */}
        {message && (
          <p className={`auth-message ${isError ? "auth-message-error" : "auth-message-success"}`}>
            {message}
          </p>
        )}

        {/* Basculer signup / login */}
        <div className="auth-toggle">
          <span>{isSignup ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}</span>
          <button type="button" onClick={toggleForm} className="auth-toggle-btn">
            {isSignup ? "Se connecter" : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}