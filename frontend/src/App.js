import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tournees from "./pages/Tournees";
import Containers from "./pages/ContainersPage";
import Gamification from "./pages/Gamification";
import Agents from "./pages/Agents";
import Navbar from "./components/Navbar";
import ProfilePage from "./pages/Profile";
import ProtectedRoute from "./pages/ProtectedRoute";
import "./App.css";
import SignalementPage from "./pages/SignalementsPage";
import Auth from "./components/auth";
import SignalementAdmin from "./pages/SignalementsAdmin";
import { useSocket } from "./hooks/useSocket";
import MessageToast from "./components/MessageToast";

// ─── Role config
const ROLE_META = {
  ADMIN: {
    label: "Administrateur",
    greeting: "Bienvenue, Administrateur",
    sub: "Vous avez un accès complet à toutes les fonctionnalités de la plateforme.",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
    accent: "#8b5cf6",
    icon: "⚙️",
  },
  MANAGER: {
    label: "Manager",
    greeting: "Bienvenue, Manager",
    sub: "Gérez vos équipes, tournées et conteneurs en un seul endroit.",
    gradient: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #14532d 100%)",
    accent: "#22c55e",
    icon: "👔",
  },
  AGENT: {
    label: "Agent",
    greeting: "Bonjour, Agent",
    sub: "Suivez vos tournées et gérez les conteneurs assignés.",
    gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)",
    accent: "#06b6d4",
    icon: "🦺",
  },
  CITIZEN: {
    label: "Citoyen",
    greeting: "Bonjour, Citoyen",
    sub: "Signalez des problèmes et participez à l'effort vert.",
    gradient: "linear-gradient(135deg, #ca8a04 0%, #a16207 50%, #713f12 100%)",
    accent: "#eab308",
    icon: "🌿",
  },
};

// ─── Quick-action cards par rôle
const CARDS_BY_ROLE = {
  ADMIN: [
    { path: "/dashboard",     icon: "📊", label: "Tableau de bord", color: "#22c55e",  bg: "#f0fdf4" },
    { path: "/tournees",      icon: "🚛", label: "Tournées",        color: "#0891b2",  bg: "#f0fdff" },
    { path: "/containers",    icon: "🗑️",  label: "Conteneurs",     color: "#f59e0b",  bg: "#fffbeb" },
    { path: "/signalements",  icon: "📍", label: "Signalements",    color: "#ef4444",  bg: "#fef2f2" },
    { path: "/agents",        icon: "👥", label: "Agents",         color: "#8b5cf6",  bg: "#faf5ff" },
    { path: "/gamification",  icon: "🏆", label: "Gamification",   color: "#ca8a04",  bg: "#fffbeb" },
  ],
  MANAGER: [
    { path: "/dashboard",     icon: "📊", label: "Tableau de bord", color: "#22c55e",  bg: "#f0fdf4" },
    { path: "/tournees",      icon: "🚛", label: "Tournées",        color: "#0891b2",  bg: "#f0fdff" },
    { path: "/containers",    icon: "🗑️",  label: "Conteneurs",     color: "#f59e0b",  bg: "#fffbeb" },
    { path: "/signalements",  icon: "📍", label: "Signalements",    color: "#ef4444",  bg: "#fef2f2" },
  ],
  AGENT: [
    { path: "/dashboard",     icon: "📊", label: "Tableau de bord", color: "#22c55e",  bg: "#f0fdf4" },
    { path: "/tournees",      icon: "🚛", label: "Mes Tournées",    color: "#0891b2",  bg: "#f0fdff" },
    { path: "/signalements",  icon: "📍", label: "Signalements",    color: "#ef4444",  bg: "#fef2f2" },
  ],
  CITIZEN: [
    { path: "/dashboard",     icon: "📊", label: "Tableau de bord", color: "#22c55e",  bg: "#f0fdf4" },
    { path: "/signalements",  icon: "📍", label: "Signalements",    color: "#f59e0b",  bg: "#fffbeb" },
    { path: "/gamification",  icon: "🏆", label: "Gamification",   color: "#ef4444",  bg: "#fef2f2" },
  ],
};

// ─── App root
export default function App() {
  const [socketToast, setSocketToast] = useState(null);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

useEffect(() => {
    if (user?.role === "CITIZEN") {
      // Ici tu peux fetch le dernier message du citoyen
      (async () => {
        try {
          // Pour tester, tu peux mettre un faux message d'abord
          const lastMessage = {
            signalementId: 123,
            message: "Votre signalement a été pris en charge par l'admin."
          };

          setSocketToast({
            title: `Signalement #${lastMessage.signalementId}`,
            message: lastMessage.message,
            type: "info",
            onClick: () => {
              window.location.href = `/signalements/${lastMessage.signalementId}`;
            }
          });
        } catch (err) {
          console.error("Erreur toast citoyen :", err);
        }
      })();
    }
  }, [user]);


  const handleLoginSuccess = async (userData) => {
    console.log("✅ Login success:", userData);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("userId", userData.id);
    localStorage.setItem("userName", userData.name);

    const nameParts = (userData.name || "").split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const userWithNames = { ...userData, firstName, lastName };
  localStorage.setItem("user", JSON.stringify(userWithNames));
  setUser(userWithNames);

  // ── Si c'est un citoyen, récupérer son dernier signalement
  if (userWithNames.role === "CITIZEN") {
    try {
      const res = await fetch(`/api/signalements/last/${userWithNames.id}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération du dernier signalement");

      const lastSignalement = await res.json();

      // Vérifie qu'on a bien un signalement avec id et message
      if (lastSignalement?.id && lastSignalement?.message) {
        setSocketToast({
          title: `Signalement #${lastSignalement.id}`,
          message: lastSignalement.message,
          type: "info",
          onClick: () => window.location.href = "/signalements"
        });
      }

    } catch (err) {
      console.error("Erreur lors de la récupération du dernier signalement :", err);
    }
  }
  };

useSocket(user?.id, user?.role, (data) => {
  if (!data || user.role !== "CITIZEN") return;

  let toastConfig = {
    title: `Signalement #${data.signalementId}`,
    type: "info",
    message: ""
  };

  switch (data.status) {
    case "PENDING":
      toastConfig.type = "info";
      toastConfig.message = "Votre signalement a bien été reçu.";
      break;

    case "IN_PROGRESS":
      toastConfig.type = "warning";
      toastConfig.message = "Votre signalement est en cours de traitement.";
      break;

    case "RESOLVED":
      toastConfig.type = "success";
      toastConfig.message = "Votre signalement a été traité avec succès.";
      break;

    case "REJECTED":
      toastConfig.type = "error";
      toastConfig.message = "Votre signalement a été rejeté.";
      break;

    default:
      toastConfig.message = "Mise à jour de votre signalement.";
  }

  setSocketToast({
    ...toastConfig,
    onClick: () => window.location.href = "/signalements"
  });
});

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

return (
  <Router>
    <Navbar user={user} onLogout={handleLogout} />

    <main style={S.main}>
      <div style={S.ambientBg} aria-hidden="true" />

      <div style={S.content}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />

          <Route
            path="/dashboard"
            element={<HomeShell user={user}><Dashboard user={user} /></HomeShell>}
          />

          <Route
            path="/tournees"
            element={
              <ProtectedRoute user={user} allowedRoles={["ADMIN", "AGENT", "MANAGER"]}>
                <Tournees />
              </ProtectedRoute>
            }
          />

          {/* Signalements : liste admin pour ADMIN/MANAGER, formulaire pour AGENT/CITIZEN */}
          <Route
            path="/signalements"
            element={isAdminOrManager ? <SignalementAdmin /> : <SignalementPage />}
          />

          <Route
            path="/containers"
            element={
              <ProtectedRoute user={user} allowedRoles={["ADMIN", "AGENT", "MANAGER"]}>
                <Containers />
              </ProtectedRoute>
            }
          />

          <Route path="/gamification" element={<Gamification />} />

          <Route
            path="/agents"
            element={
              <ProtectedRoute user={user} allowedRoles={["ADMIN", "MANAGER"]}>
                <Agents />
              </ProtectedRoute>
            }
          />

          <Route path="/profile" element={<ProfilePage user={user} />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </main>

    {/* <-- MessageToast doit être en dehors de <Routes> */}
    {socketToast && (
      <MessageToast
        data={socketToast}
        onClose={() => setSocketToast(null)}
      />
    )}
  </Router>
);
}

// ─── HomeShell — banner + cards
function HomeShell({ user, children }) {
  const meta = ROLE_META[user.role] || ROLE_META.CITIZEN;
  const cards = CARDS_BY_ROLE[user.role] || CARDS_BY_ROLE.CITIZEN;

  const firstName = user.firstName || user.name?.split(' ')[0] || 'Utilisateur';
  const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || '';

  return (
    <div>
      {/* ── Hero / Welcome Banner ── */}
      <div style={S.banner}>
        <div style={S.bannerBlob1} aria-hidden="true" />
        <div style={S.bannerBlob2} aria-hidden="true" />
        <div style={S.bannerBlob3} aria-hidden="true" />

        <div style={S.bannerInner}>
          <div style={S.bannerLeft}>
            <div style={S.roleBadge}>
              <span style={S.roleDot(meta.accent)} />
              <span style={S.roleBadgeLabel}>{meta.icon} {meta.label}</span>
            </div>

            <h1 style={S.bannerTitle}>
              {meta.greeting},<br />
              <span style={S.bannerName}>{firstName} {lastName}</span>
            </h1>
            <p style={S.bannerSub}>{meta.sub}</p>
          </div>

          <div style={S.statsGrid}>
            <StatCard icon="📊" value="12" label="Activités" delay={0} />
            <StatCard icon="✅" value="8"  label="Complétées" delay={60} />
            <StatCard icon="⏳" value="4"  label="En cours" delay={120} />
          </div>
        </div>
      </div>

      {/* ── Quick-access cards ── */}
      <div style={S.sectionHeader}>
        <span style={S.sectionLine} />
        <span style={S.sectionTitle}>Accès rapide</span>
        <span style={S.sectionLine} />
      </div>

      <div style={S.cardsGrid}>
        {cards.map((card, i) => (
          <QuickCard key={card.path} {...card} index={i} />
        ))}
      </div>

      <div style={S.divider}>
        <span style={S.dividerLine} />
        <span style={S.dividerLabel}>Tableau de bord</span>
        <span style={S.dividerLine} />
      </div>

      {children}
    </div>
  );
}

// ─── StatCard
function StatCard({ icon, value, label, delay }) {
  return (
    <div style={{ ...S.statCard, animationDelay: `${delay}ms` }} className="stat-card-anim">
      <span style={S.statIcon}>{icon}</span>
      <span style={S.statValue}>{value}</span>
      <span style={S.statLabel}>{label}</span>
    </div>
  );
}

// ─── QuickCard
function QuickCard({ path, icon, label, color, bg, index }) {
  return (
    <Link
      to={path}
      style={{ ...S.quickCard(bg, color), animationDelay: `${index * 70}ms` }}
      className="quick-card-anim"
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 32px ${color}22, 0 4px 12px rgba(0,0,0,0.08)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      <div style={S.quickCardIconWrap(color)}>
        <span style={S.quickCardIcon}>{icon}</span>
      </div>
      <span style={S.quickCardLabel}>{label}</span>
      <svg style={S.quickCardArrow(color)} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ─── 404 Page
function NotFoundPage() {
  return (
    <div style={NF.wrapper}>
      <div style={NF.circle1} aria-hidden="true" />
      <div style={NF.circle2} aria-hidden="true" />
      <div style={NF.circle3} aria-hidden="true" />

      <div style={NF.card}>
        <div style={NF.iconWrap}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" fill="url(#nfG)" opacity="0.12" />
            <path d="M26 8C26 8 38 17 38 27c0 6.6-5.4 12-12 12s-12-5.4-12-12c0-10 12-19 12-19z" fill="url(#nfG)" />
            <path d="M26 17v10M22 23l4-4 4 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="nfG" x1="14" y1="8" x2="38" y2="39">
                <stop stopColor="#22c55e" /><stop offset="1" stopColor="#16a34a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p style={NF.code}>404</p>
        <h2 style={NF.title}>Page non trouvée</h2>
        <p style={NF.desc}>Cette page n'existe pas ou a été déplacée.<br />Retournez à la page d'accueil pour continuer.</p>
        <Link
          to="/dashboard"
          style={NF.backBtn}
          onMouseEnter={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, #16a34a, #15803d)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(34,197,94,0.45)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, #22c55e, #16a34a)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(34,197,94,0.35)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >← Retour au tableau de bord</Link>
      </div>
    </div>
  );
}

const S = {
  main: { minHeight: "100vh", paddingTop: "67px" },
  ambientBg: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 80% 50% at 15% 85%, rgba(34,197,94,0.05) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 85% 15%, rgba(34,197,94,0.03) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 70% 70%, rgba(6,182,212,0.03) 0%, transparent 70%), linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)` },
  content: { maxWidth: "1200px", margin: "0 auto", padding: "28px 20px 48px" },
  banner: { position: "relative", borderRadius: "24px", background: "linear-gradient(135deg, #16a34a 0%, #15803d 45%, #14532d 100%)", padding: "40px 40px 36px", overflow: "hidden", marginBottom: "36px", boxShadow: "0 8px 40px rgba(22,163,74,0.25), 0 2px 8px rgba(0,0,0,0.08)" },
  bannerBlob1: { position: "absolute", top: "-60px", right: "-40px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" },
  bannerBlob2: { position: "absolute", bottom: "-50px", left: "30%", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" },
  bannerBlob3: { position: "absolute", top: "20px", left: "-30px", width: "120px", height: "120px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", pointerEvents: "none" },
  bannerInner: { position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" },
  bannerLeft: { flex: "1 1 280px" },
  roleBadge: { display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: "20px", padding: "6px 14px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.18)" },
  roleDot: (color) => ({ width: "8px", height: "8px", borderRadius: "50%", background: "#fff", boxShadow: `0 0 8px ${color}`, animation: "pulse 2s ease-in-out infinite" }),
  roleBadgeLabel: { fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.95)", letterSpacing: "0.3px" },
  bannerTitle: { margin: "0 0 10px", fontSize: "28px", fontWeight: "700", color: "#fff", lineHeight: "1.25", letterSpacing: "-0.5px" },
  bannerName: { fontSize: "34px", fontWeight: "800", letterSpacing: "-1px" },
  bannerSub: { margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5", maxWidth: "440px" },
  statsGrid: { display: "flex", gap: "12px", flexShrink: 0 },
  statCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100px", padding: "18px 10px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", opacity: 0, animation: "fadeInUp 0.45s cubic-bezier(0.4,0,0.2,1) forwards" },
  statIcon: { fontSize: "20px", marginBottom: "6px" },
  statValue: { fontSize: "22px", fontWeight: "800", color: "#fff", lineHeight: "1", marginBottom: "4px" },
  statLabel: { fontSize: "11px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600", textAlign: "center" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" },
  sectionLine: { flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #d1d5db, transparent)" },
  sectionTitle: { fontSize: "13px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1.2px", whiteSpace: "nowrap" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginBottom: "40px" },
  quickCard: (bg, color) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "28px 16px 22px", borderRadius: "18px", background: bg, border: `1px solid ${color}18`, textDecoration: "none", position: "relative", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", opacity: 0, animation: "fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards" }),
  quickCardIconWrap: (color) => ({ width: "52px", height: "52px", borderRadius: "14px", background: `${color}12`, border: `2px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }),
  quickCardIcon: { fontSize: "24px" },
  quickCardLabel: { fontSize: "14px", fontWeight: "600", color: "#1f2937", textAlign: "center" },
  quickCardArrow: (color) => ({ position: "absolute", top: "14px", right: "14px", color: color, opacity: 0.4, transition: "opacity 0.2s, transform 0.2s" }),
  divider: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" },
  dividerLine: { flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #d1d5db, transparent)" },
  dividerLabel: { fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", background: "#f9fafb", padding: "0 10px", whiteSpace: "nowrap" },
};

const NF = {
  wrapper: { position: "relative", minHeight: "calc(100vh - 67px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  circle1: { position:"absolute", width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", top:"-80px", left:"-100px", pointerEvents:"none" },
  circle2: { position:"absolute", width:"200px", height:"200px", borderRadius:"50%", background:"radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", bottom:"40px", right:"-60px", pointerEvents:"none" },
  circle3: { position:"absolute", width:"140px", height:"140px", borderRadius:"50%", border:"2px dashed rgba(34,197,94,0.15)", bottom:"120px", left:"10%", pointerEvents:"none" },
  card: { position:"relative", zIndex:1, textAlign:"center", padding:"56px 48px", background:"#fff", borderRadius:"24px", boxShadow:"0 8px 40px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)", border:"1px solid rgba(34,197,94,0.1)", maxWidth:"440px", width:"100%" },
  iconWrap: { marginBottom:"20px", display:"flex", justifyContent:"center" },
  code: { margin:"0 0 4px", fontSize:"72px", fontWeight:"800", lineHeight:"1", background:"linear-gradient(135deg, #22c55e, #16a34a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", letterSpacing:"-3px" },
  title: { margin:"0 0 12px", fontSize:"22px", fontWeight:"700", color:"#1f2937" },
  desc: { margin:"0 0 32px", fontSize:"14px", color:"#6b7280", lineHeight:"1.6" },
  backBtn: { display:"inline-block", padding:"12px 28px", borderRadius:"12px", background:"linear-gradient(135deg, #22c55e, #16a34a)", color:"#fff", textDecoration:"none", fontSize:"14px", fontWeight:"600", boxShadow:"0 4px 14px rgba(34,197,94,0.35)", transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)" },
};