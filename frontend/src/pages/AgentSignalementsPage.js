import { useState, useEffect, useRef } from "react";
import API from "../api/api";

// ── Constantes ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:     { label: "En attente",    color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", icon: "⏳" },
  IN_PROGRESS: { label: "En cours",      color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6", icon: "🔧" },
  RESOLVED:    { label: "Résolu",        color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", icon: "✅" },
  VALIDATED:   { label: "Validé",        color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", icon: "✅" },
  REJECTED:    { label: "Rejeté",        color: "#ef4444", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", icon: "✕" },
};

const TYPE_CONFIG = {
  Voirie:    { icon: "🛣️", color: "#64748b", bg: "#f1f5f9" },
  Éclairage: { icon: "💡", color: "#f59e0b", bg: "#fffbeb" },
  Déchets:   { icon: "🗑️", color: "#22c55e", bg: "#f0fdf4" },
  Propreté:  { icon: "🧹", color: "#06b6d4", bg: "#ecfeff" },
  Autre:     { icon: "📌", color: "#8b5cf6", bg: "#faf5ff" },
};

const FILTERS = ["Tous", "PENDING", "IN_PROGRESS", "RESOLVED", "VALIDATED", "REJECTED"];
const FILTER_LABELS = { Tous: "Tous", PENDING: "En attente", IN_PROGRESS: "En cours", RESOLVED: "Résolu", VALIDATED: "Validé", REJECTED: "Rejeté" };

// ── Utilitaires ─────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

// ── Badge statut ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: cfg.bg, border: `1.5px solid ${cfg.border}`,
      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
      color: cfg.color, letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Carte signalement ───────────────────────────────────────────────────────

function SignalementCard({ s, onUpdateStatus, isUpdating, currentUser, geocoded }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const typeCfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.Autre;
  const isAssigned = s.assignedToId === currentUser?.id;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1.5px solid ${hovered ? "#22c55e44" : isAssigned ? "#bbf7d0" : "#e5e7eb"}`,
        boxShadow: hovered
          ? "0 8px 32px rgba(34,197,94,0.12), 0 2px 8px rgba(0,0,0,0.04)"
          : isAssigned
          ? "0 2px 12px rgba(34,197,94,0.08)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
        overflow: "hidden",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      {/* Barre latérale colorée */}
      <div style={{
        height: 3,
        background: isAssigned
          ? "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)"
          : "linear-gradient(90deg, #e5e7eb, #f3f4f6)",
      }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
          {/* Icône type */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: typeCfg.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, border: `1px solid ${typeCfg.color}22`,
          }}>
            {typeCfg.icon}
          </div>

          {/* Infos principales */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827",
              }}>
                Signalement #{s.id}
              </span>
              <StatusBadge status={s.status} />
              {isAssigned && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 99,
                  background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
                  border: "1px solid #bbf7d0",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700,
                  color: "#15803d", letterSpacing: "0.08em",
                }}>
                  👤 Assigné à vous
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6b7280",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ color: typeCfg.color }}>●</span> {s.type}
              </span>
              {(s.lieu || geocoded?.[s.id]) && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                  📍 {s.lieu || geocoded[s.id]}
                </span>
              )}
              {(!s.lieu && !geocoded?.[s.id] && s.lat && s.lng) && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9ca3af" }}>
                  📍 Localisation en cours…
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#374151" }}>
              {formatDate(s.createdAt)}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
              {timeAgo(s.createdAt)}
            </div>
          </div>
        </div>

        {/* Commentaire */}
        {s.comment && (
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#374151",
            background: "#f9fafb", borderRadius: 10, padding: "10px 14px",
            marginBottom: 12, lineHeight: 1.55,
            borderLeft: "3px solid #e5e7eb",
          }}>
            "{s.comment}"
          </div>
        )}

        {/* Citoyen */}
        {s.user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
            padding: "8px 12px", borderRadius: 10, background: "#f9fafb",
            border: "1px solid #f3f4f6",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "#fff",
            }}>
              {(s.user.firstName?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {s.user.firstName} {s.user.lastName}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9ca3af" }}>Citoyen</div>
            </div>
          </div>
        )}

        {/* Photo expandable */}
        {s.photoUrl && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                color: "#22c55e", display: "flex", alignItems: "center", gap: 4,
                padding: 0, marginBottom: expanded ? 8 : 0,
              }}
            >
              📷 {expanded ? "Masquer la photo" : "Voir la photo"}
            </button>
            {expanded && (
              <img
                src={`${process.env.REACT_APP_API_URL || "http://localhost:3001"}${s.photoUrl}`}
                alt="Signalement"
                style={{ width: "100%", borderRadius: 10, border: "1.5px solid #e5e7eb", maxHeight: 220, objectFit: "cover" }}
              />
            )}
          </div>
        )}

        {/* Actions statut */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["PENDING", "IN_PROGRESS", "RESOLVED"].map((st) => {
            const cfg = STATUS_CONFIG[st];
            const isActive = s.status === st;
            return (
              <button
                key={st}
                disabled={isActive || isUpdating}
                onClick={() => onUpdateStatus(s.id, st)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 13px", borderRadius: 8, cursor: isActive ? "default" : "pointer",
                  border: `1.5px solid ${isActive ? cfg.border : "#e5e7eb"}`,
                  background: isActive ? cfg.bg : "#fff",
                  color: isActive ? cfg.color : "#6b7280",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                  transition: "all 0.18s",
                  opacity: isUpdating ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isActive && !isUpdating) { e.currentTarget.style.background = cfg.bg; e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.color = cfg.color; } }}
                onMouseLeave={(e) => { if (!isActive && !isUpdating) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; } }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton loader ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f3f4f6", padding: "18px 20px", overflow: "hidden" }}>
      <div style={{ height: 3, background: "#f3f4f6", marginBottom: 18, marginLeft: -20, marginRight: -20, marginTop: -18 }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f3f4f6", animation: "shimmer 1.5s linear infinite" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: "60%", background: "#f3f4f6", borderRadius: 6, marginBottom: 8, animation: "shimmer 1.5s linear infinite" }} />
          <div style={{ height: 10, width: "40%", background: "#f3f4f6", borderRadius: 6, animation: "shimmer 1.5s linear infinite" }} />
        </div>
      </div>
      <div style={{ height: 48, background: "#f9fafb", borderRadius: 10, marginTop: 14, animation: "shimmer 1.5s linear infinite" }} />
    </div>
  );
}

// ── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      padding: "12px 18px", borderRadius: 12,
      background: isErr ? "#fef2f2" : "#f0fdf4",
      border: `1.5px solid ${isErr ? "#ef4444" : "#22c55e"}`,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: `0 4px 20px ${isErr ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.2)"}`,
      zIndex: 9999, animation: "slideUp 0.3s ease",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{ fontSize: 14, color: isErr ? "#ef4444" : "#22c55e" }}>{isErr ? "✕" : "✓"}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: isErr ? "#991b1b" : "#15803d" }}>{message}</span>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div style={{
      background: bg || "#fff", borderRadius: 14,
      border: "1.5px solid #e5e7eb",
      padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      flex: "1 1 140px",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 800, color: color || "#111827" }}>
          {value}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6b7280", fontWeight: 500, marginTop: 1 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────────────

export default function AgentSignalementsPage() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState("all"); // "all" | "mine"
  const searchRef = useRef(null);
  const [geocoded, setGeocoded] = useState({});

  async function reverseGeocode(lat, lng) {
  try {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return null;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lngNum}&format=json&accept-language=fr`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address;
    return [
      a.road || a.pedestrian || a.path || "",
      a.suburb || a.quarter || a.neighbourhood || "",
      a.city || a.town || a.village || a.municipality || "",
    ].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 2).join(", ") || null;
  } catch { return null; }
}

useEffect(() => {
  const toGeocode = signalements.filter(s => !s.lieu && s.lat && s.lng);
  toGeocode.forEach(async (s) => {
    if (geocoded[s.id]) return;
    const adresse = await reverseGeocode(s.lat, s.lng);
    if (adresse) setGeocoded(prev => ({ ...prev, [s.id]: adresse }));
  });
}, [signalements]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
    setTimeout(() => setMounted(true), 50);
    fetchSignalements();
  }, []);

  const fetchSignalements = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await API.get("/signalements", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setSignalements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast("Impossible de charger les signalements.", "error");
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      await API.put(`/signalements/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setSignalements(prev =>
        prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
      );
      showToast(`Statut mis à jour : ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filtres ──────────────────────────────────────────────────────────────

  const filtered = signalements.filter(s => {
    if (view === "mine" && s.assignedToId !== currentUser?.id) return false;
    if (filter !== "Tous" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(s.id).includes(q) ||
        (s.type || "").toLowerCase().includes(q) ||
        (s.comment || "").toLowerCase().includes(q) ||
        (s.lieu || "").toLowerCase().includes(q) ||
        (s.user?.firstName || "").toLowerCase().includes(q) ||
        (s.user?.lastName || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: signalements.length,
    pending: signalements.filter(s => s.status === "PENDING").length,
    inProgress: signalements.filter(s => s.status === "IN_PROGRESS").length,
    resolved: signalements.filter(s => s.status === "RESOLVED" || s.status === "VALIDATED").length,
    mine: signalements.filter(s => s.assignedToId === currentUser?.id).length,
  };

  const agentName = currentUser
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || "Agent"
    : "Agent";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes spin    { to{transform:rotate(360deg);} }
        @keyframes blink   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .agent-card-enter { animation: slideUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        input::placeholder { color: #d1d5db; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f9fafb; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f0fdf4 0%, #fafafa 45%, #f0fdf4 100%)",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
      }}>
        {/* Grille de fond */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, #bbf7d030 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Barre de shimmer */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 100,
          background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#22c55e,#16a34a)",
          backgroundSize: "300% auto",
          animation: "shimmer 4s linear infinite",
        }} />

        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 900, margin: "0 auto",
          padding: "52px 24px 80px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(12px)",
          transition: "all 0.55s cubic-bezier(0.22,1,0.36,1)",
        }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 12px", borderRadius: 99,
                background: "#dcfce7", border: "1px solid #bbf7d0",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "blink 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Interface agent
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: 800, color: "#111827",
                  letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6,
                }}>
                  Mes{" "}
                  <span style={{
                    background: "linear-gradient(135deg, #15803d, #22c55e)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>Signalements</span>
                </h1>
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  Bonjour <strong style={{ color: "#374151" }}>{agentName}</strong> — {signalements.length} signalement{signalements.length !== 1 ? "s" : ""} au total
                </p>
              </div>

              <button
                onClick={fetchSignalements}
                disabled={loading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 18px", borderRadius: 10,
                  background: "#fff", border: "1.5px solid #e5e7eb",
                  color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.18s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#22c55e"; e.currentTarget.style.color = "#16a34a"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
              >
                <span style={{ display: "inline-block", animation: loading ? "spin 0.7s linear infinite" : "none" }}>↻</span>
                Actualiser
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            <StatCard icon="📋" label="Total" value={stats.total} color="#374151" />
            <StatCard icon="⏳" label="En attente" value={stats.pending} color="#f59e0b" bg="#fffbeb" />
            <StatCard icon="🔧" label="En cours" value={stats.inProgress} color="#3b82f6" bg="#eff6ff" />
            <StatCard icon="✅" label="Résolus" value={stats.resolved} color="#22c55e" bg="#f0fdf4" />
            {stats.mine > 0 && (
              <StatCard icon="👤" label="Assignés à moi" value={stats.mine} color="#8b5cf6" bg="#faf5ff" />
            )}
          </div>

          {/* ── Vue tabs ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
            padding: "4px", background: "#f3f4f6", borderRadius: 12, width: "fit-content",
          }}>
            {[["all", "📋 Tous"], ["mine", "👤 Assignés à moi"]].map(([key, label]) => (
              <button key={key} onClick={() => setView(key)} style={{
                padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                background: view === key ? "#fff" : "transparent",
                color: view === key ? "#111827" : "#6b7280",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: view === key ? 700 : 500,
                boxShadow: view === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.18s",
              }}>
                {label}
                {key === "mine" && stats.mine > 0 && (
                  <span style={{
                    marginLeft: 6, padding: "1px 6px", borderRadius: 99,
                    background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 700,
                  }}>
                    {stats.mine}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Filtres & Recherche ── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
            {/* Recherche */}
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>🔍</span>
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par ID, type, commentaire…"
                style={{
                  width: "100%", padding: "9px 12px 9px 34px",
                  borderRadius: 10, border: "1.5px solid #e5e7eb",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111827",
                  background: "#fff", outline: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "border-color 0.18s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#22c55e"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
              />
            </div>

            {/* Filtres statuts */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FILTERS.map(f => {
                const cfg = f !== "Tous" ? STATUS_CONFIG[f] : null;
                const active = filter === f;
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "7px 14px", borderRadius: 9,
                    border: `1.5px solid ${active ? (cfg?.border || "#22c55e44") : "#e5e7eb"}`,
                    background: active ? (cfg?.bg || "#f0fdf4") : "#fff",
                    color: active ? (cfg?.color || "#15803d") : "#6b7280",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: active ? 700 : 500,
                    cursor: "pointer", transition: "all 0.15s",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    {cfg && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />}
                    {FILTER_LABELS[f]}
                    <span style={{
                      padding: "0 5px", borderRadius: 99,
                      background: active ? (cfg?.color + "22" || "#22c55e22") : "#f3f4f6",
                      color: active ? (cfg?.color || "#15803d") : "#9ca3af",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {f === "Tous" ? signalements.length : signalements.filter(s => s.status === f).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Liste ── */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb",
              padding: "56px 32px", textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🌿</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                Aucun signalement
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {search || filter !== "Tous" ? "Essayez d'autres filtres." : "Aucun signalement pour le moment."}
              </div>
              {(search || filter !== "Tous") && (
                <button
                  onClick={() => { setSearch(""); setFilter("Tous"); }}
                  style={{
                    marginTop: 16, padding: "8px 18px", borderRadius: 9,
                    background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                    color: "#15803d", fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Compteur résultats */}
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9ca3af", marginBottom: -4 }}>
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}{search && ` pour "${search}"`}
              </div>

              {filtered.map((s, i) => (
                <div
                  key={s.id}
                  className="agent-card-enter"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <SignalementCard
                    s={s}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={updatingId === s.id}
                    currentUser={currentUser}
                    geocoded={geocoded}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </>
  );
}