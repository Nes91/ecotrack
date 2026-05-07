import { useState } from "react";
import API from "../api/api";
import socket from '../socket/socket';

const ROLES = [
  {
    id: "ADMIN",
    label: "Administrateur",
    desc: "Gestion complète de la plateforme",
    icon: "🛡️",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.15)",
    border: "rgba(124,58,237,0.4)",
  },
  {
    id: "MANAGER",
    label: "Manager",
    desc: "Supervision des équipes et zones",
    icon: "💼",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.15)",
    border: "rgba(37,99,235,0.4)",
  },
  {
    id: "AGENT",
    label: "Agent",
    desc: "Gestion des tournées de collecte",
    icon: "🚛",
    color: "#d97706",
    bg: "rgba(217,119,6,0.15)",
    border: "rgba(217,119,6,0.4)",
  },
  {
    id: "CITIZEN",
    label: "Citoyen",
    desc: "Signalement et suivi citoyen",
    icon: "👤",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.15)",
    border: "rgba(22,163,74,0.4)",
  },
];

export default function Auth({ onLoginSuccess }) {
  // Étapes : "role" | "login" | "signup" | "2fa"
  const [step, setStep] = useState("role");
  const [selectedRole, setSelectedRole] = useState(null);

  // Champs login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Champs signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // 2FA
  const [tempToken, setTempToken] = useState("");
  const [twoFACode, setTwoFACode] = useState("");

  // UI
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(true);
  const [loading, setLoading] = useState(false);

  const role = ROLES.find((r) => r.id === selectedRole);

  const resetMessage = () => { setMessage(""); setIsError(true); };

  // ── Helpers localStorage ───────────────────────────────────────────────────
  const saveUserToStorage = (data) => {
    const nameParts = (data.name || "").split(" ");
    const fn = nameParts[0] || "";
    const ln = nameParts.slice(1).join(" ") || "";
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userId", data.id);
    localStorage.setItem("firstName", fn);
    localStorage.setItem("lastName", ln);
    localStorage.setItem("user", JSON.stringify({ ...data, firstName: fn, lastName: ln }));
  };

  // ── Connexion ──────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessage();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data.requires2FA) {
        setTempToken(res.data.tempToken);
        setStep("2fa");
      } else {
        saveUserToStorage(res.data);
        socket.emit('register', res.data.id);
        setIsError(false);
        setMessage(`Bienvenue ${res.data.name} !`);
        if (onLoginSuccess) onLoginSuccess(res.data);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || err.response?.data?.error || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  // ── Inscription ────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    resetMessage();
    setLoading(true);
    try {
      const name = `${firstName} ${lastName}`.trim();
      await API.post("/auth/register", { firstName, lastName, name, email: signupEmail, password: signupPassword });
      setIsError(false);
      setMessage("Inscription réussie ! Connectez-vous maintenant.");
      setStep("role");
      setFirstName(""); setLastName(""); setSignupEmail(""); setSignupPassword("");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // ── 2FA ───────────────────────────────────────────────────────────────────
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    resetMessage();
    setLoading(true);
    try {
      const res = await API.post("/auth/2fa/verify", { tempToken, token: twoFACode });
      saveUserToStorage(res.data);
      socket.emit('register', res.data.id);
      if (onLoginSuccess) onLoginSuccess(res.data);
    } catch (err) {
      setIsError(true);
      setMessage("Code 2FA invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  // ── Rendu : Logo commun ────────────────────────────────────────────────────
  const Logo = () => (
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
  );

  const Orbs = () => (
    <>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.orb4} />
    </>
  );

  const Animations = () => (
    <style>{`
      @keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-30px)} }
      @keyframes glow  { 0%,100%{opacity:.3} 50%{opacity:.5} }
      @keyframes slideIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin  { to{transform:rotate(360deg)} }
    `}</style>
  );

  // ── Étape 1 : Choix du rôle ────────────────────────────────────────────────
  if (step === "role") {
    return (
      <div style={styles.container}>
        <Orbs />
        <div style={styles.cardWrapper}>
          <div style={styles.glowEffect} />
          <div style={{ ...styles.card, maxWidth: "520px" }}>
            <Logo />
            <div style={styles.titleSection}>
              <h2 style={styles.title}>Qui êtes-vous ?</h2>
              <p style={styles.subtitle}>Choisissez votre rôle pour accéder à votre espace</p>
            </div>

            <div style={styles.rolesGrid}>
              {ROLES.map((r) => (
                <div
                  key={r.id}
                  style={{
                    ...styles.roleCard,
                    border: selectedRole === r.id ? `2px solid ${r.color}` : "1px solid rgba(139,92,246,0.2)",
                    background: selectedRole === r.id ? r.bg : "rgba(255,255,255,0.05)",
                  }}
                  onClick={() => setSelectedRole(r.id)}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{r.icon}</div>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>{r.label}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: "1.4" }}>{r.desc}</div>
                  {selectedRole === r.id && (
                    <div style={{ ...styles.checkBadge, background: r.color }}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {selectedRole ? (
              <button
                style={{ ...styles.submitButton, background: `linear-gradient(135deg, ${role?.color}, ${role?.color}cc)` }}
                onClick={() => { resetMessage(); setStep("login"); }}
              >
                Continuer →
              </button>
            ) : (
              <button style={{ ...styles.submitButton, opacity: 0.4, cursor: "not-allowed" }} disabled>
                Choisissez un rôle
              </button>
            )}

            <div style={styles.toggleSection}>
              <span style={styles.toggleText}>Pas encore de compte ?</span>
              <button type="button" onClick={() => { resetMessage(); setStep("signup"); }} style={styles.toggleButton}>
                S'inscrire
              </button>
            </div>

            {message && (
              <div style={isError ? styles.errorMessage : styles.successMessage}>
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>
        <Animations />
      </div>
    );
  }

  // ── Étape 2 : Connexion ────────────────────────────────────────────────────
  if (step === "login") {
    return (
      <div style={styles.container}>
        <Orbs />
        <div style={styles.cardWrapper}>
          <div style={styles.glowEffect} />
          <div style={styles.card}>
            <Logo />

            <button style={styles.backBtn} onClick={() => { resetMessage(); setStep("role"); }}>
              ← Retour
            </button>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 16px", borderRadius: "20px",
              background: role?.bg, border: `1px solid ${role?.border}`,
              marginBottom: "20px",
            }}>
              <span>{role?.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: role?.color }}>{role?.label}</span>
            </div>

            <div style={styles.titleSection}>
              <h2 style={styles.title}>Bon retour</h2>
              <p style={styles.subtitle}>Connectez-vous pour continuer</p>
            </div>

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrapper}>
                  <input type="email" placeholder="vous@exemple.com" value={email}
                    onChange={e => setEmail(e.target.value)} style={styles.input} required />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Mot de passe</label>
                <div style={styles.inputWrapper}>
                  <input type="password" placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} style={styles.input} required />
                </div>
              </div>
              <button type="submit" style={{ ...styles.submitButton, background: `linear-gradient(135deg, ${role?.color}, ${role?.color}cc)` }} disabled={loading}>
                {loading ? (
                  <div style={styles.spinnerWrapper}><div style={styles.spinner} /><span>Connexion...</span></div>
                ) : <span>Se connecter</span>}
              </button>
            </form>

            {message && (
              <div style={isError ? styles.errorMessage : styles.successMessage}>
                <span>{message}</span>
              </div>
            )}

            <div style={styles.toggleSection}>
              <span style={styles.toggleText}>Pas encore de compte ?</span>
              <button type="button" onClick={() => { resetMessage(); setStep("signup"); }} style={styles.toggleButton}>
                S'inscrire
              </button>
            </div>
          </div>
        </div>
        <Animations />
      </div>
    );
  }

  // ── Étape 3 : Inscription ──────────────────────────────────────────────────
  if (step === "signup") {
    return (
      <div style={styles.container}>
        <Orbs />
        <div style={styles.cardWrapper}>
          <div style={styles.glowEffect} />
          <div style={styles.card}>
            <Logo />

            <button style={styles.backBtn} onClick={() => { resetMessage(); setStep("role"); }}>
              ← Retour
            </button>

            <div style={styles.titleSection}>
              <h2 style={styles.title}>Créer un compte</h2>
              <p style={styles.subtitle}>Rejoignez la communauté EcoTrack</p>
            </div>

            <form onSubmit={handleSignup} style={styles.form}>
              <div style={styles.nameFieldsWrapper}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Prénom</label>
                  <div style={styles.inputWrapper}>
                    <input type="text" placeholder="Jean" value={firstName}
                      onChange={e => setFirstName(e.target.value)} style={styles.input} required />
                  </div>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Nom</label>
                  <div style={styles.inputWrapper}>
                    <input type="text" placeholder="Dupont" value={lastName}
                      onChange={e => setLastName(e.target.value)} style={styles.input} required />
                  </div>
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrapper}>
                  <input type="email" placeholder="vous@exemple.com" value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)} style={styles.input} required />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Mot de passe</label>
                <div style={styles.inputWrapper}>
                  <input type="password" placeholder="••••••••" value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)} style={styles.input} required minLength={8} />
                </div>
              </div>
              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? (
                  <div style={styles.spinnerWrapper}><div style={styles.spinner} /><span>Création...</span></div>
                ) : <span>S'inscrire</span>}
              </button>
            </form>

            {message && (
              <div style={isError ? styles.errorMessage : styles.successMessage}>
                <span>{message}</span>
              </div>
            )}

            <div style={styles.toggleSection}>
              <span style={styles.toggleText}>Déjà un compte ?</span>
              <button type="button" onClick={() => { resetMessage(); setStep("role"); }} style={styles.toggleButton}>
                Se connecter
              </button>
            </div>
          </div>
        </div>
        <Animations />
      </div>
    );
  }

  // ── Étape 4 : 2FA ─────────────────────────────────────────────────────────
  if (step === "2fa") {
    return (
      <div style={styles.container}>
        <Orbs />
        <div style={styles.cardWrapper}>
          <div style={styles.glowEffect} />
          <div style={styles.card}>
            <Logo />
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
              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? (
                  <div style={styles.spinnerWrapper}><div style={styles.spinner} /><span>Vérification...</span></div>
                ) : <span>Confirmer</span>}
              </button>
            </form>
            {message && (
              <div style={isError ? styles.errorMessage : styles.successMessage}>
                <span>{message}</span>
              </div>
            )}
            <div style={styles.toggleSection}>
              <button type="button"
                onClick={() => { setStep("login"); setTwoFACode(""); resetMessage(); }}
                style={styles.toggleButton}>
                ← Retour à la connexion
              </button>
            </div>
          </div>
        </div>
        <Animations />
      </div>
    );
  }
}

const styles = {
  container: { position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  orb1: { position: "absolute", top: "10%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", animation: "float 20s ease-in-out infinite", pointerEvents: "none" },
  orb2: { position: "absolute", bottom: "15%", right: "12%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", animation: "float 15s ease-in-out infinite", animationDelay: "5s", pointerEvents: "none" },
  orb3: { position: "absolute", top: "50%", right: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite", animationDelay: "10s", pointerEvents: "none" },
  orb4: { position: "absolute", bottom: "20%", left: "15%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", animation: "float 22s ease-in-out infinite", animationDelay: "15s", pointerEvents: "none" },
  cardWrapper: { position: "relative", zIndex: 1 },
  glowEffect: { position: "absolute", inset: "-2px", borderRadius: "32px", background: "linear-gradient(135deg, #8b5cf6, #6366f1, #a855f7)", opacity: 0.3, filter: "blur(20px)", animation: "glow 3s ease-in-out infinite", pointerEvents: "none" },
  card: { position: "relative", width: "100%", maxWidth: "480px", background: "rgba(30,27,75,0.7)", backdropFilter: "blur(40px)", borderRadius: "32px", border: "1px solid rgba(139,92,246,0.2)", padding: "48px 40px", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 80px rgba(139,92,246,0.1)", animation: "slideIn 0.6s ease-out" },
  logoSection: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" },
  logoCircle: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "2px solid rgba(139,92,246,0.3)", boxShadow: "0 8px 32px rgba(139,92,246,0.3)" },
  brandName: { fontSize: "32px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.5px" },
  brandAccent: { background: "linear-gradient(135deg, #8b5cf6, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  titleSection: { textAlign: "center", marginBottom: "28px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#fff", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "rgba(255,255,255,0.6)", margin: 0 },
  rolesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" },
  roleCard: { position: "relative", borderRadius: "16px", padding: "18px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", transition: "all 0.2s", backdropFilter: "blur(10px)" },
  checkBadge: { position: "absolute", top: "8px", right: "8px", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: "700" },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", padding: "0" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  nameFieldsWrapper: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.9)", letterSpacing: "0.3px" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  input: { width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid rgba(139,92,246,0.2)", background: "rgba(255,255,255,0.95)", color: "#000", fontSize: "15px", fontWeight: "500", outline: "none", transition: "all 0.3s ease", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)" },
  submitButton: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "16px 32px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 8px 24px rgba(139,92,246,0.4)", marginTop: "8px", width: "100%" },
  spinnerWrapper: { display: "flex", alignItems: "center", gap: "12px" },
  spinner: { width: "20px", height: "20px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errorMessage: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "14px", fontWeight: "500", marginTop: "16px" },
  successMessage: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "16px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", fontSize: "14px", fontWeight: "500", marginTop: "16px" },
  toggleSection: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(139,92,246,0.1)" },
  toggleText: { fontSize: "14px", color: "rgba(255,255,255,0.6)" },
  toggleButton: { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#6366f1", fontSize: "14px", fontWeight: "700", cursor: "pointer", padding: "4px 8px" },
};