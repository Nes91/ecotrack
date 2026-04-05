import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import API from "../api/api";
import { useSocket } from "../hooks/useSocket";
import { useNavigate } from 'react-router-dom';

// ── Toast mission enrichi (mission + signalement + tournée) ─────────────────
function MissionToast({ mission, signalement, tournee, onClose }) {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState("mission"); // "mission" | "tournee"

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 15000);
    return () => clearTimeout(t);
  }, []);

  const close = () => { setVisible(false); setTimeout(onClose, 400); };

  const date = (signalement?.createdAt || mission?.createdAt)
    ? new Date(signalement?.createdAt || mission?.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const hasTournee = tournee && tournee.stops && tournee.stops.length > 0;

  return ReactDOM.createPortal(
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 99999,
      width: 400,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(100px)",
      transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
      fontFamily: "'Roboto', sans-serif",
      filter: "drop-shadow(0 24px 48px rgba(139,92,246,0.35))",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.08)",
      }}>
        {/* Barre accent */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #8b5cf6, #6366f1, #a855f7)" }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px 12px",
          display: "flex", alignItems: "center", gap: 12,
          borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg, #faf5ff, #eef2ff)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 4px 14px rgba(139,92,246,0.4)",
          }}>👷</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
              Nouvelle mission assignée
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {mission?.title || (signalement ? `Signalement #${signalement.id}` : "Mission")}
            </div>
          </div>
          <button onClick={close} style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "1px solid #e2e8f0", background: "#f8fafc",
            color: "#94a3b8", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Onglets si tournée disponible */}
        {hasTournee && (
          <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
            {["mission", "tournee"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "10px 0", fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer",
                borderBottom: tab === t ? "2px solid #8b5cf6" : "2px solid transparent",
                background: tab === t ? "#faf5ff" : "#fff",
                color: tab === t ? "#7c3aed" : "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.06em",
                transition: "all 0.2s ease",
              }}>
                {t === "mission" ? "📋 Mission" : "🚛 Tournée"}
              </button>
            ))}
          </div>
        )}

        {/* Contenu — onglet Mission */}
        {tab === "mission" && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
            {mission?.description && (
              <Row icon="📝" label="Description" value={mission.description} />
            )}
            {signalement && <>
              <Row icon="👤" label="Citoyen"    value={signalement.citoyen} />
              <Row icon="🏷️" label="Catégorie"  value={signalement.type} />
              <Row icon="📍" label="Lieu"        value={signalement.lieu} />
              <Row icon="💬" label="Commentaire" value={signalement.comment} />
            </>}
            <Row icon="📅" label="Date" value={date} />
            {mission?.status && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Statut</span>
                <span style={{
                  padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe",
                }}>⏳ En attente</span>
              </div>
            )}
          </div>
        )}

        {/* Contenu — onglet Tournée */}
        {tab === "tournee" && hasTournee && (
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tournee.name}</span>
              <span style={{
                padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
              }}>{tournee.stops.length} arrêts</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {tournee.stops.map((stop, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 10,
                  background: "#f8fafc", border: "1px solid #f1f5f9",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#fff",
                  }}>{stop.order ?? i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                      {stop.container?.type || "Conteneur"} {stop.container?.zone ? `— ${stop.container.zone}` : ""}
                    </div>
                    {stop.container?.latitude && (
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {stop.container.latitude.toFixed(4)}, {stop.container.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#ede9fe", color: "#7c3aed", fontWeight: 600 }}>
                    Arrêt {stop.order ?? i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
          <button onClick={close} style={{
            flex: 1, padding: "9px", borderRadius: 10,
            border: "1px solid #e2e8f0", background: "#f8fafc",
            color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Fermer</button>
          <button onClick={() => { close(); window.location.href = "/mes-missions"; }} style={{
            flex: 2, padding: "9px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
          }}>Voir mes missions →</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Ligne de détail réutilisable dans le toast
function Row({ icon, label, value }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label} </span>
        <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, wordBreak: "break-word" }}>{value}</span>
      </div>
    </div>
  );
}

// ── AgentDashboard ────────────────────────────────────────────────────────────
export default function AgentDashboard({ user }) {
  const [stats, setStats]       = useState(null);
  const [missions, setMissions] = useState([]);
  const [toasts, setToasts]     = useState([]);
  const [visible, setVisible]   = useState(false);
  const navigate = useNavigate();

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Charger les missions de l'agent
  // FIX 500: la route /missions/mes-missions doit recevoir l'identité depuis
  // le token JWT (middleware auth). Vérifiez que votre intercepteur Axios
  // envoie bien le header Authorization. Si la route diffère, adaptez ici.
  useEffect(() => {
    API.get('/missions/mes-missions')
      .then(res => setMissions(res.data))
      .catch(console.error);
  }, []);

  // Charger les stats
  // FIX 404: suppression de l'id dans l'URL — le backend identifie l'agent
  // via le token JWT. Si votre backend requiert l'id, utilisez :
  // API.get(`/dashboard/agent?id=${user.id}`)
  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
    API.get('/dashboard/agent')
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  // Socket : écouter les nouvelles missions assignées
  useSocket(user?.id, user?.role || "AGENT", (data) => {
    if (data.eventType === "nouvelle_mission") {
      // Ajouter la mission à la liste en temps réel
      if (data.mission) {
        setMissions(prev => [data.mission, ...prev]);
      }
      // Afficher le toast enrichi (mission + signalement + tournée)
      const id = Date.now();
      setToasts(prev => [...prev, {
        id,
        mission:     data.mission     || null,
        signalement: data.signalement || null,
        tournee:     data.tournee     || null,
      }]);
    }
  });

  // Marquer une mission comme terminée
  const terminerMission = async (id) => {
    try {
      await API.put(`/missions/${id}/terminer`);
      setMissions(prev =>
        prev.map(m => m.id === id ? { ...m, status: 'DONE' } : m)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (!stats) {
    return (
      <div style={styles.container}>
        {/* Dot pattern */}
        <div style={styles.dotPattern} />
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Chargement...</p>
        </div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Dot pattern — même style que AdminDashboard */}
      <div style={styles.dotPattern} />

      <div style={styles.content}>

        {/* Header — même style que AdminDashboard */}
        <div style={{
          marginBottom: 56,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(-12px)",
          transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 6px #8b5cf6", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b", letterSpacing: "0.04em", textTransform: "capitalize" }}>{dateStr}</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1.05, margin: "0 0 14px" }}>
            Tableau de{" "}
            <span style={{ color: "#8b5cf6", position: "relative", display: "inline-block" }}>
              bord
              <span style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8b5cf6, #a855f7)", borderRadius: 99 }} />
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", fontWeight: 400, margin: "0 0 4px", letterSpacing: "0.01em" }}>
            Vue d'ensemble — Agent EcoTrack
          </p>
          {user && (
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
              Bienvenue, <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{user.firstName || user.name || 'Agent'}</span>
            </p>
          )}
          <div style={{ marginTop: 28, height: 1, background: "linear-gradient(90deg, #8b5cf630, #e2e8f0, transparent)" }} />
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard
            title="Mes Tournées"
            value={stats.nbTournees}
            icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
            accent="#8b5cf6"
            light="#faf5ff"
            border="#ddd6fe"
            tag="Logistique"
            description="Tournées assignées"
          />
          <StatCard
            title="Containers à Collecter"
            value={stats.nbContainers}
            icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
            accent="#6366f1"
            light="#eef2ff"
            border="#c7d2fe"
            tag="Collecte"
            description="En attente de collecte"
          />
        </div>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 style={styles.infoTitle}>Informations</h3>
            <p style={styles.infoText}>Consultez vos tournées et gérez vos collectes depuis cette interface. Vos statistiques sont mises à jour en temps réel.</p>
          </div>
        </div>

        {/* Liste des missions */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ color: '#0f172a', fontSize: 22, fontWeight: 700, marginBottom: 16, fontFamily: "'Roboto', sans-serif" }}>
            Mes Missions
            {missions.filter(m => m.status !== 'DONE').length > 0 && (
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "rgba(139,92,246,0.1)", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
                {missions.filter(m => m.status !== 'DONE').length} en cours
              </span>
            )}
          </h2>
          {missions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: "'Roboto', sans-serif" }}>Aucune mission assignée pour le moment.</p>
          ) : (
            missions.map(mission => (
              <div key={mission.id} style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16, padding: '20px 24px', marginBottom: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s ease',
              }}>
                <div>
                  <p style={{ color: '#0f172a', fontWeight: 600, margin: '0 0 4px 0', fontFamily: "'Roboto', sans-serif" }}>{mission.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, fontFamily: "'Roboto', sans-serif" }}>{mission.description || 'Aucune description'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: mission.status === 'DONE' ? '#dcfce7' : mission.status === 'IN_PROGRESS' ? '#fef9c3' : '#f5f3ff',
                    color: mission.status === 'DONE' ? '#16a34a' : mission.status === 'IN_PROGRESS' ? '#854d0e' : '#7c3aed',
                  }}>
                    {mission.status === 'DONE' ? '✅ Terminée' : mission.status === 'IN_PROGRESS' ? '🔄 En cours' : '⏳ En attente'}
                  </span>
                  {mission.status !== 'DONE' && (
                    <button onClick={() => terminerMission(mission.id)} style={{
                      padding: '8px 16px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                    }}>Terminer</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toasts missions */}
      {toasts.map((t, i) => (
        <div key={t.id} style={{ position: "fixed", bottom: 28 + i * 24, right: 28, zIndex: 99999 - i }}>
          <MissionToast
            mission={t.mission}
            signalement={t.signalement}
            tournee={t.tournee}
            onClose={() => removeToast(t.id)}
          />
        </div>
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, accent, light, border, tag, description }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 20,
        border: `1px solid ${isHovered ? border : '#f1f5f9'}`,
        padding: 28,
        boxShadow: isHovered ? `0 20px 48px ${accent}18, 0 4px 16px rgba(0,0,0,0.06)` : '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: mounted ? (isHovered ? 'translateY(-6px)' : 'translateY(0)') : 'translateY(20px)',
        opacity: mounted ? 1 : 0,
        overflow: 'hidden',
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: isHovered ? `linear-gradient(90deg, ${accent}, ${accent}88)` : "transparent", transition: "all 0.3s ease", borderRadius: "20px 20px 0 0" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: light, border: `1px solid ${border}`, marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: accent, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Roboto', sans-serif" }}>{tag}</span>
      </div>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: light, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: accent }}>
        {icon}
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, color: '#0f172a', lineHeight: 1, marginBottom: 8, fontFamily: "'Roboto', sans-serif", letterSpacing: '-2px' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4, fontFamily: "'Roboto', sans-serif" }}>{title}</div>
      {description && <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'Roboto', sans-serif" }}>{description}</div>}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f8fafc 0%, #f5f3ff 50%, #fafaf8 100%)',
    fontFamily: "'Roboto', sans-serif",
    overflow: 'hidden',
  },
  dotPattern: {
    position: 'fixed', inset: 0,
    backgroundImage: 'radial-gradient(#8b5cf612 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  content: {
    position: 'relative', zIndex: 1,
    maxWidth: 1100, margin: '0 auto',
    padding: '52px 28px 80px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 18,
    marginBottom: 32,
  },
  infoCard: {
    position: 'relative', background: '#fff', backdropFilter: 'blur(40px)',
    borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px 24px',
    display: 'flex', gap: 20, alignItems: 'flex-start',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  infoIconWrapper: {
    width: 44, height: 44, borderRadius: 12,
    background: '#f5f3ff', border: '1px solid #ddd6fe',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#8b5cf6', flexShrink: 0,
  },
  infoTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', fontFamily: "'Roboto', sans-serif" },
  infoText:  { fontSize: 14, color: '#64748b', lineHeight: '1.6', margin: 0, fontFamily: "'Roboto', sans-serif" },
  loadingWrapper: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
  },
  spinner: {
    width: 44, height: 44,
    border: '4px solid #ede9fe',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16,
  },
  loadingText: { fontSize: 16, color: '#64748b', fontWeight: 500, fontFamily: "'Roboto', sans-serif" },
};