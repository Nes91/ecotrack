import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import API from "../api/api";
import "leaflet/dist/leaflet.css";

// ── Location Picker ────────────────────────────────────────────────────────
function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return position ? <Marker position={position} icon={createPinIcon()} /> : null;
}

function createPinIcon() {
  const html = `
    <div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:-8px;border-radius:50%;background:#22c55e;opacity:0.18;animation:leaflet-ping 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:-3px;border-radius:50%;background:#22c55e;opacity:0.25;animation:leaflet-ping 2s ease-out infinite 0.5s;"></div>
      <div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 8px #22c55e99;position:relative;z-index:1;"></div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [20, 20], iconAnchor: [10, 10] });
}

// ── Auto-catégorisation ────────────────────────────────────────────────────
function detectCategory(text) {
  const rules = [
    { type: "Voirie", keywords: ["trou", "nid de poule", "route", "chaussée"] },
    { type: "Éclairage", keywords: ["lampe", "lumière", "lampadaire", "éteint"] },
    { type: "Déchets", keywords: ["poubelle", "ordures", "déchets", "sac"] },
    { type: "Propreté", keywords: ["sale", "graffiti", "urine", "dégradation"] },
  ];
  const lower = text.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.type;
  }
  return "";
}

// ── Category config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "Voirie", icon: "🛣️" },
  { value: "Éclairage", icon: "💡" },
  { value: "Déchets", icon: "🗑️" },
  { value: "Propreté", icon: "🧹" },
  { value: "Autre", icon: "📌" },
];

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "text", as, children, rows }) {
  const [focused, setFocused] = useState(false);
  const base = {
    padding: "10px 14px", borderRadius: 10, background: focused ? "#fff" : "#f9fafb",
    border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`, color: "#111827",
    fontFamily: "'Roboto',sans-serif", fontSize: 14, outline: "none",
    boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.1)" : "0 1px 2px rgba(0,0,0,0.04)",
    transition: "all 0.2s", width: "100%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</label>
      {as === "textarea" ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows || 4}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...base, resize: "vertical", lineHeight: 1.6 }} />
      ) : as === "select" ? (
        <select name={name} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...base, cursor: "pointer" }}>
          {children}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={base} />
      )}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type = "success" }) {
  const isErr = type === "error";
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 18px", borderRadius: 12,
      background: isErr ? "#fef2f2" : "#f0fdf4", border: `1.5px solid ${isErr ? "#ef4444" : "#22c55e"}`,
      display: "flex", alignItems: "center", gap: 10, boxShadow: `0 4px 20px ${isErr ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.2)"}`,
      zIndex: 10000, animation: "slideDown 0.3s ease" }}>
      <span style={{ fontSize: 14, color: isErr ? "#ef4444" : "#22c55e" }}>{isErr ? "✕" : "✓"}</span>
      <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: isErr ? "#991b1b" : "#15803d" }}>{message}</span>
    </div>
  );
}

// ── Level theme ────────────────────────────────────────────────────────────
function getLevelTheme(level) {
  const n = parseInt(level) || 1;
  if (n <= 2)  return {
    bg: "linear-gradient(135deg,#0f2010,#1a3a1a)",
    border: "#22c55e", glow: "rgba(34,197,94,0.45)",
    accent: "#22c55e", accentLight: "#86efac",
    bar: "linear-gradient(90deg,#15803d,#22c55e,#86efac,#22c55e,#15803d)",
    particles: ["#22c55e","#4ade80","#86efac","#bbf7d0","#16a34a","#dcfce7"],
    icon: "🌱", label: "Débutant",
  };
  if (n <= 5)  return {
    bg: "linear-gradient(135deg,#0c1a2e,#0f2a4a)",
    border: "#38bdf8", glow: "rgba(56,189,248,0.45)",
    accent: "#38bdf8", accentLight: "#7dd3fc",
    bar: "linear-gradient(90deg,#0369a1,#38bdf8,#bae6fd,#38bdf8,#0369a1)",
    particles: ["#38bdf8","#7dd3fc","#bae6fd","#0ea5e9","#0284c7","#e0f2fe"],
    icon: "⚡", label: "Confirmé",
  };
  if (n <= 10) return {
    bg: "linear-gradient(135deg,#1a1a2e,#2d1b4e)",
    border: "#a78bfa", glow: "rgba(167,139,250,0.45)",
    accent: "#a78bfa", accentLight: "#c4b5fd",
    bar: "linear-gradient(90deg,#6d28d9,#a78bfa,#ddd6fe,#a78bfa,#6d28d9)",
    particles: ["#a78bfa","#c4b5fd","#818cf8","#f0abfc","#e879f9","#ddd6fe"],
    icon: "🔮", label: "Expert",
  };
  if (n <= 20) return {
    bg: "linear-gradient(135deg,#1f0a00,#3a1a00)",
    border: "#f97316", glow: "rgba(249,115,22,0.45)",
    accent: "#f97316", accentLight: "#fdba74",
    bar: "linear-gradient(90deg,#c2410c,#f97316,#fed7aa,#f97316,#c2410c)",
    particles: ["#f97316","#fb923c","#fdba74","#fde047","#ef4444","#fbbf24"],
    icon: "🔥", label: "Maître",
  };
  return {
    bg: "linear-gradient(135deg,#1a1500,#2d2500)",
    border: "#fbbf24", glow: "rgba(251,191,36,0.55)",
    accent: "#fbbf24", accentLight: "#fde68a",
    bar: "linear-gradient(90deg,#b45309,#fbbf24,#fef3c7,#fbbf24,#b45309)",
    particles: ["#fbbf24","#fde68a","#f59e0b","#fff","#f97316","#fcd34d"],
    icon: "👑", label: "Légendaire",
  };
}

// ── Particles ──────────────────────────────────────────────────────────────
function Particles({ colors }) {
  const particles = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * 360;
    const dist = 90 + Math.random() * 90;
    const size = 5 + Math.random() * 8;
    const color = colors[i % colors.length];
    const delay = Math.random() * 0.3;
    const dur = 0.7 + Math.random() * 0.5;
    const tx = Math.cos((angle * Math.PI) / 180) * dist;
    const ty = Math.sin((angle * Math.PI) / 180) * dist;
    return { size, color, delay, dur, tx, ty, i };
  });
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none", zIndex: 10 }}>
      {particles.map(p => (
        <div key={p.i} style={{
          position: "absolute", width: p.size, height: p.size,
          borderRadius: p.i % 3 === 0 ? "50%" : p.i % 3 === 1 ? "2px" : "50% 0",
          background: p.color, top: -p.size / 2, left: -p.size / 2,
          animation: `particle-burst ${p.dur}s ease-out ${p.delay}s both`,
          "--tx": `${p.tx}px`, "--ty": `${p.ty}px`,
        }} />
      ))}
    </div>
  );
}

// ── Badge Unlock Animation ──────────────────────────────────────────────────
function BadgeUnlockAnimation({ badges, points, level, onDone }) {
  const [step, setStep] = useState(0);
  const theme = getLevelTheme(level);

  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => setStep(1), 1900);
      return () => clearTimeout(t);
    }
    if (badges && step > 0 && step <= badges.length) {
      const t = setTimeout(() => setStep(s => s + 1), 2400);
      return () => clearTimeout(t);
    }
    if (step > (badges?.length || 0)) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
  }, [step, badges]);

  const currentBadge = badges && step > 0 && step <= badges.length ? badges[step - 1] : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", animation: "fadeIn 0.3s ease" }}>

      {/* ── Points popup ── */}
      {step === 0 && (
        <div style={{ textAlign: "center", animation: "levelup-zoom 0.5s cubic-bezier(0.34,1.56,0.64,1) both", position: "relative" }}>
          <Particles colors={theme.particles} />
          <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: 24, padding: "48px 64px", boxShadow: `0 0 70px ${theme.glow}, inset 0 0 40px ${theme.glow}` }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 99, marginBottom: 20, background: "rgba(255,255,255,0.07)", border: `1px solid ${theme.border}55`, animation: "slideDown 0.4s 0.1s both" }}>
              <span style={{ fontSize: 14 }}>{theme.icon}</span>
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 700, color: theme.accentLight, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Niveau {level} · {theme.label}
              </span>
            </div>
            <div style={{ fontSize: 52, marginBottom: 12, animation: "bounce-in 0.6s 0.2s both" }}>⚡</div>
            <div style={{ fontFamily: "'Roboto',sans-serif", fontWeight: 900, fontSize: 68, color: theme.accent, textShadow: `0 0 40px ${theme.glow}`, letterSpacing: "-2px", animation: "counter-up 0.8s ease both" }}>
              +{points}
            </div>
            <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 4, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7 }}>
              points gagnés
            </div>
            <div style={{ marginTop: 24, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: theme.bar, backgroundSize: "200% auto", animation: "shimmer-bar 1.5s linear infinite" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Badge popup ── */}
      {currentBadge && (
        <div key={step} style={{ textAlign: "center", animation: "levelup-zoom 0.5s cubic-bezier(0.34,1.56,0.64,1) both", position: "relative" }}>
          <Particles colors={theme.particles} />
          <div style={{ background: theme.bg, border: `2px solid ${theme.border}`, borderRadius: 24, padding: "48px 64px", boxShadow: `0 0 70px ${theme.glow}, inset 0 0 40px ${theme.glow}`, minWidth: 320 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 99, background: `${theme.accent}22`, border: `1px solid ${theme.accent}55`, marginBottom: 20, animation: "slideDown 0.4s 0.1s both" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }} />
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 700, color: theme.accentLight, letterSpacing: "0.2em", textTransform: "uppercase" }}>Badge débloqué !</span>
            </div>
            <div style={{ fontSize: 72, marginBottom: 16, animation: "badge-spin 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both", display: "block", filter: `drop-shadow(0 0 24px ${theme.accent})` }}>
              🏅
            </div>
            <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", textShadow: `0 0 20px ${theme.glow}`, marginBottom: 8, animation: "slideDown 0.4s 0.3s both" }}>
              {currentBadge.name}
            </div>
            {currentBadge.description && (
              <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 14, color: theme.accentLight, opacity: 0.85, animation: "slideDown 0.4s 0.4s both" }}>
                {currentBadge.description}
              </div>
            )}
            <div style={{ marginTop: 24, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: theme.bar, backgroundSize: "200% auto", animation: "shimmer-bar 1.5s linear infinite" }} />
            </div>
            {badges.length > 1 && (
              <div style={{ marginTop: 12, fontFamily: "'Roboto',sans-serif", fontSize: 11, color: `${theme.accentLight}66` }}>{step} / {badges.length}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────────────────
function SuccessScreen({ reward, onReset }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #e5e7eb", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", padding: "52px 40px", textAlign: "center", animation: "slideDown 0.4s ease" }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
      <h2 style={{ fontFamily: "'Roboto',sans-serif", fontSize: 30, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
        Signalement envoyé !
      </h2>
      <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 14, color: "#6b7280", marginBottom: 28 }}>
        Merci pour votre contribution. Nos équipes vont traiter votre signalement rapidement.
      </p>

      {reward && (
        <div style={{ background: "linear-gradient(135deg,#fefce8,#fff7ed)", border: "1.5px solid #fde047", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
          <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 22, fontWeight: 700, color: "#854d0e", marginBottom: 14 }}>
            +{reward.pointsEarned} points gagnés !
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
            {[["Total", `${reward.totalPoints} pts`, "#b45309"], ["Niveau", reward.level, "#c2410c"]].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 26, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          {reward.newBadges?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #fde047" }}>
              <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, color: "#854d0e", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>🏅 Nouveaux badges</p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                {reward.newBadges.map((b, i) => (
                  <span key={i} style={{ padding: "4px 12px", borderRadius: 99, background: "#fff", border: "1.5px solid #fde047", fontFamily: "'Roboto',sans-serif", fontSize: 12, fontWeight: 600, color: "#854d0e" }}>
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onReset}
          style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "#22c55e", border: "none", color: "#fff", fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background="#16a34a"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#22c55e"; }}>
          + Nouveau signalement
        </button>
        <a href="/gamification"
          style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#15803d", fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.background="#dcfce7"; e.currentTarget.style.borderColor="#22c55e"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#f0fdf4"; e.currentTarget.style.borderColor="#bbf7d0"; }}>
          🏆 Mes récompenses
        </a>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SignalementPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [in_, setIn] = useState(false);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [position, setPosition] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [reward, setReward] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); } }
    setLoadingUser(false);
    setTimeout(() => setIn(true), 60);
  }, []);

  useEffect(() => {
    const detected = detectCategory(description);
    if (detected && !category) setCategory(detected);
  }, [description, category]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) { showToast("Veuillez sélectionner une position sur la carte.", "error"); return; }
    if (!category) { showToast("Veuillez sélectionner une catégorie.", "error"); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("type", category);
      formData.append("comment", description);
      formData.append("lat", position.lat);
      formData.append("lng", position.lng);
      if (photo) formData.append("photo", photo);
      const res = await API.post("/signalements", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${user?.token}` }
      });
      if (res.data.gamification) {
        setReward(res.data.gamification);
        if (res.data.gamification.pointsEarned || res.data.gamification.newBadges?.length > 0) {
          setShowAnimation(true);
        } else {
          setSubmitted(true);
        }
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de l'envoi du signalement.", "error");
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setSubmitted(false); setReward(null); setDescription(""); setCategory(""); setPosition(null); setPhoto(null); setShowAnimation(false);
  };

  if (loadingUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(150deg,#f0fdf4,#fafafa,#f0fdf4)", fontFamily: "'Roboto',sans-serif", color: "#6b7280" }}>
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(150deg,#f0fdf4,#fafafa,#f0fdf4)" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #e5e7eb", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", padding: "48px 40px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Accès refusé</p>
          <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 14, color: "#6b7280" }}>Vous devez être connecté pour signaler un problème.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #d1d5db; font-family: 'Roboto', sans-serif; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-300% center; } 100% { background-position:300% center; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes levelup-zoom { from { opacity:0; transform:scale(0.3) rotate(-8deg); } to { opacity:1; transform:scale(1) rotate(0deg); } }
        @keyframes bounce-in { from { opacity:0; transform:scale(0.4) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes counter-up { from { opacity:0; transform:translateY(30px) scale(0.6); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes badge-spin { from { opacity:0; transform:scale(0) rotate(-180deg); } to { opacity:1; transform:scale(1) rotate(0deg); } }
        @keyframes shimmer-bar { 0% { background-position:200% center; } 100% { background-position:-200% center; } }
        @keyframes particle-burst { 0% { opacity:1; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0); } }
        .leaflet-container { font-family: 'Roboto', sans-serif !important; }
        .leaflet-div-icon { background: transparent !important; border: none !important; }
        textarea { font-family: 'Roboto', sans-serif; }
        select { font-family: 'Roboto', sans-serif; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(150deg,#f0fdf4 0%,#fafafa 50%,#f0fdf4 100%)", fontFamily: "'Roboto',sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, #bbf7d0 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.45 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#22c55e,#16a34a)", backgroundSize: "300% auto", animation: "shimmer 4s linear infinite" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "48px 24px 64px" }}>

          {/* Header */}
          <div style={{ marginBottom: 36, opacity: in_ ? 1 : 0, transform: in_ ? "none" : "translateY(-10px)", transition: "all 0.65s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 11px", borderRadius: 99, background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "blink 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#15803d", letterSpacing: "0.12em", textTransform: "uppercase" }}>Nouveau signalement</span>
              </div>
            </div>
            <h1 style={{ fontFamily: "'Roboto',sans-serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1.1, marginBottom: 8 }}>
              Signaler un{" "}
              <span style={{ background: "linear-gradient(135deg,#15803d,#22c55e,#16a34a)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 4s linear infinite" }}>Problème</span>
            </h1>
            <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: "#6b7280" }}>
              Décrivez le problème, choisissez sa position et aidez votre ville
            </p>
          </div>

          {/* Content */}
          {submitted ? (
            <SuccessScreen reward={reward} onReset={handleReset} />
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Description */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: "24px" }}>
                  <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Description</div>
                  <Field label="Décrivez le problème *" name="description" value={description}
                    onChange={e => setDescription(e.target.value)} as="textarea" rows={4} />
                </div>

                {/* Catégorie */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: "24px" }}>
                  <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Catégorie</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 10 }}>
                    {CATEGORIES.map(cat => {
                      const active = category === cat.value;
                      return (
                        <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                          style={{ padding: "12px 8px", borderRadius: 12, border: `1.5px solid ${active ? "#22c55e" : "#e5e7eb"}`, background: active ? "#f0fdf4" : "#f9fafb", color: active ? "#15803d" : "#6b7280", fontFamily: "'Roboto',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: active ? "0 0 0 3px rgba(34,197,94,0.1)" : "none" }}>
                          <span style={{ fontSize: 22 }}>{cat.icon}</span>
                          {cat.value}
                        </button>
                      );
                    })}
                  </div>
                  {category && (
                    <p style={{ marginTop: 10, fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#22c55e" }}>
                      ✓ Catégorie sélectionnée : {category}
                    </p>
                  )}
                </div>

                {/* Photo */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: "24px" }}>
                  <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
                    Photo <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af", fontFamily: "'Roboto',sans-serif" }}>(optionnel)</span>
                  </div>
                  <label style={{ display: "block", padding: "20px", borderRadius: 12, border: "1.5px dashed #d1d5db", background: "#f9fafb", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#22c55e"; e.currentTarget.style.background="#f0fdf4"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#d1d5db"; e.currentTarget.style.background="#f9fafb"; }}>
                    <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} style={{ display: "none" }} />
                    {photo ? (
                      <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: "#22c55e", fontWeight: 600 }}>✓ {photo.name}</span>
                    ) : (
                      <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: "#9ca3af" }}>📷 Cliquez pour ajouter une photo</span>
                    )}
                  </label>
                </div>

                {/* Carte */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 17, fontWeight: 700, color: "#111827" }}>Position *</div>
                    <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>Cliquez sur la carte pour placer le marqueur</span>
                  </div>
                  {position && (
                    <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#22c55e", marginBottom: 10 }}>
                      📍 {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                    </p>
                  )}
                  <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
                    <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ height: 360, width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                      <LocationPicker position={position} setPosition={setPosition} />
                    </MapContainer>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: loading ? "#d1d5db" : "#22c55e", border: "none", color: "#fff", fontFamily: "'Roboto',sans-serif", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 20px rgba(34,197,94,0.3)", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background="#16a34a"; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background="#22c55e"; }}>
                  {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Envoi en cours…
                    </span>
                  ) : "📍 Envoyer le signalement"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
      {showAnimation && reward && (
        <BadgeUnlockAnimation
          badges={reward.newBadges || []}
          points={reward.pointsEarned}
          level={reward.level}
          onDone={() => { setShowAnimation(false); setSubmitted(true); }}
        />
      )}
    </>
  );
}