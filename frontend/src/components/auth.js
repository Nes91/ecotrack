import { useState } from "react";
import API from "../api/api";
import socket from '../socket/socket';

export default function Auth({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFACode, setTwoFACode] = useState("");

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
        await API.post("/auth/register", { firstName, lastName, email, password });
        setIsError(false);
        setMessage("Inscription réussie ! Connectez-vous maintenant.");
        setIsSignup(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
      } else {
        const res = await API.post("/auth/login", { email, password });

        if (res.data.requires2FA) {
          setTempToken(res.data.tempToken);
          setRequires2FA(true);
          // pas de return ici, le finally s'occupera de setLoading(false)
        } else {
          const nameParts = (res.data.name || "").split(" ");
          const extractedFirstName = nameParts[0] || "";
          const extractedLastName = nameParts.slice(1).join(" ") || "";

          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", res.data.role);
          localStorage.setItem("userId", res.data.id);
          localStorage.setItem("firstName", extractedFirstName);
          localStorage.setItem("lastName", extractedLastName);
          localStorage.setItem("user", JSON.stringify({
            ...res.data,
            firstName: extractedFirstName,
            lastName: extractedLastName,
          }));
socket.emit('register', res.data.id);
setIsError(false);
setMessage(`Bienvenue ${res.data.name} !`);
if (onLoginSuccess) onLoginSuccess(res.data);
          setIsError(false);
          setMessage(`Bienvenue ${res.data.name} !`);
          if (onLoginSuccess) onLoginSuccess(res.data);
        }
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || err.response?.data?.error || "Erreur serveur");
    } finally {
      setLoading(false); // ✅ toujours exécuté, même si requires2FA
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    console.log("tempToken:", tempToken);
    console.log("code saisi:", twoFACode);
    try {
      const res = await API.post("/auth/2fa/verify", {
        tempToken,
        token: twoFACode,
      });

      const nameParts = (res.data.name || "").split(" ");
      const extractedFirstName = nameParts[0] || "";
      const extractedLastName = nameParts.slice(1).join(" ") || "";

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("firstName", extractedFirstName);
      localStorage.setItem("lastName", extractedLastName);
      socket.emit('register', res.data.id);
      if (onLoginSuccess) onLoginSuccess(res.data);
    } catch (err) {
      setIsError(true);
      setMessage("Code 2FA invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Un seul bloc 2FA, placé avant le return principal
  if (requires2FA) {
    return (
      <div style={styles.container}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />
        <div style={styles.orb4} />
        <div style={styles.cardWrapper}>
          <div style={styles.glowEffect} />
          <div style={styles.card}>
            <div style={styles.logoSection}>
              <div style={styles.logoCircle}>
                <span style={{ fontSize: 36 }}>🛡️</span>
              </div>
              <h1 style={styles.brandName}>Eco<span style={styles.brandAccent}>Track</span></h1>
            </div>
            <div style={styles.titleSection}>
              <h2 style={styles.title}>Vérification 2FA</h2>
              <p style={styles.subtitle}>Entrez le code de votre application d'authentification</p>
            </div>
            <form onSubmit={handle2FASubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Code à 6 chiffres</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="123456"
                    value={twoFACode}
                    onChange={e => setTwoFACode(e.target.value)}
                    style={{ ...styles.input, textAlign: "center", fontSize: "22px", letterSpacing: "8px" }}
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
              </div>
<button 
  type="button"  
  onClick={handle2FASubmit} 
  style={styles.submitButton} 
  disabled={loading}
>
  {loading ? (
    <div style={styles.spinnerWrapper}>
      <div style={styles.spinner} />
      <span>Vérification...</span>
    </div>
  ) : (
    <span>Confirmer</span>
  )}
</button>
            </form>
            {message && (
              <div style={styles.errorMessage}>
                <span>{message}</span>
              </div>
            )}
            <div style={styles.toggleSection}>
              <button type="button" onClick={() => { setRequires2FA(false); setTwoFACode(""); setMessage(""); }}
                style={styles.toggleButton}>
                ← Retour à la connexion
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-30px)}}@keyframes glow{0%,100%{opacity:.3}50%{opacity:.5}}@keyframes slideIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.orb4} />

      <div style={styles.cardWrapper}>
        <div style={styles.glowEffect} />
        <div style={styles.card}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>
              <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" fill="url(#authGrad)" opacity="0.2" />
                <path d="M14 4C14 4 22 10 22 17c0 4.4-3.6 8-8 8s-8-3.6-8-8c0-7 8-13 8-13z" fill="url(#authGrad)" />
                <path d="M14 10v8M11 14l3-3 3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="authGrad" x1="6" y1="4" x2="22" y2="24">
                    <stop stopColor="#8b5cf6" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 style={styles.brandName}>Eco<span style={styles.brandAccent}>Track</span></h1>
          </div>

          <div style={styles.titleSection}>
            <h2 style={styles.title}>{isSignup ? "Créer un compte" : "Bon retour"}</h2>
            <p style={styles.subtitle}>{isSignup ? "Rejoignez la communauté EcoTrack" : "Connectez-vous pour continuer"}</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {isSignup && (
              <div style={styles.nameFieldsWrapper}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Prénom</label>
                  <div style={styles.inputWrapper}>
                    <input type="text" placeholder="Jean" value={firstName} onChange={e => setFirstName(e.target.value)} style={styles.input} required={isSignup} />
                  </div>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Nom</label>
                  <div style={styles.inputWrapper}>
                    <input type="text" placeholder="Dupont" value={lastName} onChange={e => setLastName(e.target.value)} style={styles.input} required={isSignup} />
                  </div>
                </div>
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
              </div>
            </div>

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? (
                <div style={styles.spinnerWrapper}>
                  <div style={styles.spinner} />
                  <span>Chargement...</span>
                </div>
              ) : (
                <span>{isSignup ? "S'inscrire" : "Se connecter"}</span>
              )}
            </button>
          </form>

          {message && (
            <div style={isError ? styles.errorMessage : styles.successMessage}>
              <span>{message}</span>
            </div>
          )}

          <div style={styles.toggleSection}>
            <span style={styles.toggleText}>{isSignup ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}</span>
            <button type="button" onClick={toggleForm} style={styles.toggleButton}>
              {isSignup ? "Se connecter" : "S'inscrire"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -30px); } }
        @keyframes glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  container: { position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  orb1: { position: "absolute", top: "10%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)", animation: "float 20s ease-in-out infinite", pointerEvents: "none" },
  orb2: { position: "absolute", bottom: "15%", right: "12%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)", animation: "float 15s ease-in-out infinite", animationDelay: "5s", pointerEvents: "none" },
  orb3: { position: "absolute", top: "50%", right: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite", animationDelay: "10s", pointerEvents: "none" },
  orb4: { position: "absolute", bottom: "20%", left: "15%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)", animation: "float 22s ease-in-out infinite", animationDelay: "15s", pointerEvents: "none" },
  cardWrapper: { position: "relative", zIndex: 1 },
  glowEffect: { position: "absolute", inset: "-2px", borderRadius: "32px", background: "linear-gradient(135deg, #8b5cf6, #6366f1, #a855f7)", opacity: 0.3, filter: "blur(20px)", animation: "glow 3s ease-in-out infinite", pointerEvents: "none" },
  card: { position: "relative", width: "100%", maxWidth: "480px", background: "rgba(30, 27, 75, 0.7)", backdropFilter: "blur(40px)", borderRadius: "32px", border: "1px solid rgba(139, 92, 246, 0.2)", padding: "48px 40px", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4), 0 0 80px rgba(139, 92, 246, 0.1)", animation: "slideIn 0.6s ease-out" },
  logoSection: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" },
  logoCircle: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "2px solid rgba(139, 92, 246, 0.3)", boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)" },
  brandName: { fontSize: "32px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.5px" },
  brandAccent: { background: "linear-gradient(135deg, #8b5cf6, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  titleSection: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#fff", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "rgba(255, 255, 255, 0.6)", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  nameFieldsWrapper: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "600", color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.3px" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  input: { width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid rgba(139, 92, 246, 0.2)", background: "rgba(255, 255, 255, 0.95)", color: "#000000", fontSize: "15px", fontWeight: "500", outline: "none", transition: "all 0.3s ease", boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2)" },
  submitButton: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "16px 32px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)", marginTop: "8px" },
  spinnerWrapper: { display: "flex", alignItems: "center", gap: "12px" },
  spinner: { width: "20px", height: "20px", border: "3px solid rgba(255, 255, 255, 0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errorMessage: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "14px", fontWeight: "500", marginTop: "16px" },
  successMessage: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "16px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#86efac", fontSize: "14px", fontWeight: "500", marginTop: "16px" },
  toggleSection: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(139, 92, 246, 0.1)" },
  toggleText: { fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" },
  toggleButton: { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#6366f1", fontSize: "14px", fontWeight: "700", cursor: "pointer", padding: "4px 8px" },
};