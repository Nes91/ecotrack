import { useState, useEffect } from "react";
import API from "../api/api";

// ── Utils ──────────────────────────────────────────────────────────────────
const fillColor = (level) => {
  if (level < 50) return { main: "#22c55e", light: "#dcfce7", border: "#bbf7d0", text: "#15803d" };
  if (level < 80) return { main: "#eab308", light: "#fef9c3", border: "#fde047", text: "#854d0e" };
  return { main: "#ef4444", light: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
};

const STATUS_CONFIG = {
  PENDING:     { label: "En attente",  bg: "#fef9c3", border: "#eab308", text: "#854d0e", dot: "#eab308" },
  ASSIGNED:    { label: "Assignée",    bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", dot: "#3b82f6" },
  IN_PROGRESS: { label: "En cours",    bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6", dot: "#8b5cf6" },
  COMPLETED:   { label: "Terminée",    bg: "#dcfce7", border: "#22c55e", text: "#14532d", dot: "#22c55e" },
  RESOLVED:    { label: "Résolu",      bg: "#dcfce7", border: "#22c55e", text: "#14532d", dot: "#22c55e" },
  REJECTED:    { label: "Rejeté",      bg: "#fee2e2", border: "#ef4444", text: "#991b1b", dot: "#ef4444" },
};

const CAT_COLORS = {
  "Voirie":    { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", icon: "🛣️" },
  "Éclairage": { bg: "#fef9c3", border: "#eab308", text: "#713f12", icon: "💡" },
  "Déchets":   { bg: "#f0fdf4", border: "#22c55e", text: "#14532d", icon: "🗑️" },
  "Propreté":  { bg: "#eff6ff", border: "#3b82f6", text: "#1e3a8a", icon: "🧹" },
  "Autre":     { bg: "#f3f4f6", border: "#6b7280", text: "#111827", icon: "📌" },
};

// ── Hook responsive ────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, bg, border, textColor, trend }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: bg || "#fff", borderRadius: 16,
        border: `1.5px solid ${hov ? (border || "#22c55e") : (border || "#e5e7eb")}`,
        boxShadow: hov ? `0 8px 32px ${border || "#22c55e"}22` : "0 2px 12px rgba(0,0,0,0.05)",
        padding: "18px 20px", transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        {trend !== undefined && (
          <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, color: trend >= 0 ? "#22c55e" : "#ef4444", background: trend >= 0 ? "#f0fdf4" : "#fef2f2", padding: "2px 8px", borderRadius: 99, border: `1px solid ${trend >= 0 ? "#bbf7d0" : "#fca5a5"}` }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 32, fontWeight: 700, color: textColor || "#111827", lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: textColor || "#374151", marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>{sub}</div>}
    </div>
  );
}

// ── Fill Bar ───────────────────────────────────────────────────────────────
function FillBar({ level, showLabel = true }) {
  const c = fillColor(Number(level) || 0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        {showLabel && <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Remplissage</span>}
        <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, fontWeight: 700, color: c.main, marginLeft: "auto" }}>{level}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${level}%`, borderRadius: 99, background: c.main, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, count, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</span>
      {count !== undefined && (
        <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, color: "#6b7280", background: "#f3f4f6", border: "1.5px solid #e5e7eb", padding: "2px 9px", borderRadius: 99 }}>{count}</span>
      )}
      <div style={{ flex: 1, height: 1, background: "#e5e7eb", minWidth: 20 }} />
      {action}
    </div>
  );
}

// ── Container Row ──────────────────────────────────────────────────────────
function ContainerRow({ container, index, isMobile }) {
  const c = fillColor(Number(container.fillLevel) || 0);
  const isCritical = Number(container.fillLevel) >= 80;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
      padding: isMobile ? "12px 12px" : "14px 16px", borderRadius: 12,
      background: isCritical ? "#fff5f5" : "#fff",
      border: `1.5px solid ${isCritical ? "#fca5a5" : "#f3f4f6"}`,
      animation: "rowIn 0.3s ease both",
      animationDelay: `${index * 40}ms`,
      flexWrap: isMobile ? "wrap" : "nowrap",
    }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.main, flexShrink: 0, boxShadow: `0 0 6px ${c.main}88` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {container.type || "Container"} {container.zone ? `— ${container.zone}` : ""}
        </div>
        <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>
          #{String(container.id).padStart(4, "0")} · {container.capacity} L
        </div>
      </div>
      {!isMobile && (
        <div style={{ width: 120, flexShrink: 0 }}>
          <FillBar level={Number(container.fillLevel) || 0} showLabel={false} />
        </div>
      )}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, background: c.light, border: `1px solid ${c.border}`, fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: c.text, flexShrink: 0 }}>
        {Number(container.fillLevel) >= 80 ? "🔴 Critique" : Number(container.fillLevel) >= 50 ? "🟡 Attention" : "🟢 OK"}
      </span>
      {isMobile && (
        <div style={{ width: "100%", marginTop: 6 }}>
          <FillBar level={Number(container.fillLevel) || 0} showLabel={false} />
        </div>
      )}
    </div>
  );
}

// ── Signalement Row ────────────────────────────────────────────────────────
function SignalementRow({ s, index, isMobile }) {
  const cat    = CAT_COLORS[s.type] || { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", icon: "📌" };
  const status = STATUS_CONFIG[s.status] || STATUS_CONFIG["PENDING"];
  const date   = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "#fff", border: "1.5px solid #f3f4f6", animation: "rowIn 0.3s ease both", animationDelay: `${index * 40}ms`, flexWrap: isMobile ? "wrap" : "nowrap" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{cat.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{s.type}</div>
        <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.comment || s.lieu || "Pas de description"} · {date}
        </div>
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, background: status.bg, border: `1px solid ${status.border}`, fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: status.text, flexShrink: 0, whiteSpace: "nowrap" }}>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: status.dot }} />
        {status.label}
      </span>
    </div>
  );
}

// ── Tournée Row ────────────────────────────────────────────────────────────
function TourneeRow({ route, index }) {
  const status = STATUS_CONFIG[route.status] || STATUS_CONFIG["PENDING"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "#fff", border: "1.5px solid #f3f4f6", animation: "rowIn 0.3s ease both", animationDelay: `${index * 40}ms` }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>🗺️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {route.name || "Tournée sans nom"}
        </div>
        <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {route.agent ? `${route.agent.firstName} ${route.agent.lastName}` : "Non assignée"}
          {route.totalDistanceKm ? ` · ${route.totalDistanceKm} km` : ""}
          {route.containersCount ? ` · ${route.containersCount} arrêts` : ""}
        </div>
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, background: status.bg, border: `1px solid ${status.border}`, fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: status.text, flexShrink: 0 }}>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: status.dot }} />
        {status.label}
      </span>
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutStat({ ok, warning, critical, total, isMobile }) {
  const pOk       = total > 0 ? Math.round((ok / total) * 100) : 0;
  const pWarning  = total > 0 ? Math.round((warning / total) * 100) : 0;
  const pCritical = total > 0 ? Math.round((critical / total) * 100) : 0;
  const segments  = [
    { color: "#22c55e", pct: pOk,       label: "OK",        count: ok },
    { color: "#eab308", pct: pWarning,  label: "Attention",  count: warning },
    { color: "#ef4444", pct: pCritical, label: "Critique",   count: critical },
  ];
  let offset = 0;
  const size = isMobile ? 100 : 128;
  const r = isMobile ? 38 : 52, cx = size/2, cy = size/2, stroke = isMobile ? 14 : 18;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24, flexWrap: isMobile ? "wrap" : "nowrap", justifyContent: isMobile ? "center" : "flex-start" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          if (seg.pct === 0) return null;
          const dashArray  = `${(seg.pct / 100) * circ} ${circ}`;
          const dashOffset = -offset * circ / 100;
          offset += seg.pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={dashArray} strokeDashoffset={dashOffset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 1s ease" }}
            />
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" style={{ fontFamily: "'Roboto',sans-serif", fontSize: isMobile ? 16 : 22, fontWeight: 700, fill: "#111827" }}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontFamily: "'Roboto',sans-serif", fontSize: 9, fill: "#9ca3af" }}>containers</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, color: "#6b7280", minWidth: 60 }}>{seg.label}</span>
            <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 14, fontWeight: 700, color: "#111827" }}>{seg.count}</span>
            <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>({seg.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const isMobile = useIsMobile();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [containers, setContainers] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [routes, setRoutes]         = useState([]);
  const [in_, setIn]                = useState(false);
  const [tab, setTab]               = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    Promise.all([
      API.get("/dashboard/manager"),
      API.get("/containers"),
      API.get("/signalements"),
      API.get("/routes"),
    ]).then(([dashRes, contRes, sigRes, routeRes]) => {
      setData(dashRes.data);
      setContainers(contRes.data || []);
      setSignalements(sigRes.data || []);
      setRoutes(routeRes.data || []);
    }).catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    setTimeout(() => setIn(true), 60);
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Roboto',sans-serif", color: "#9ca3af", background: "linear-gradient(150deg,#f0fdf4,#fafafa)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 16, fontWeight: 600 }}>Chargement du tableau de bord…</p>
      </div>
    </div>
  );

  const criticalContainers  = containers.filter(c => Number(c.fillLevel) >= 80);
  const warningContainers   = containers.filter(c => Number(c.fillLevel) >= 50 && Number(c.fillLevel) < 80);
  const okContainers        = containers.filter(c => Number(c.fillLevel) < 50);
  const pendingSignalements = signalements.filter(s => s.status === "PENDING");
  const activeRoutes        = routes.filter(r => ["PENDING","ASSIGNED","IN_PROGRESS"].includes(r.status));

  const TABS = [
    { id: "overview",     label: isMobile ? "Global"  : "Vue globale",   icon: "📊" },
    { id: "containers",   label: isMobile ? "Conteneurs" : "Containers",  icon: "🗑️" },
    { id: "signalements", label: isMobile ? "Signalements" : "Signalements", icon: "📋" },
    { id: "routes",       label: isMobile ? "Tournées" : "Tournées",      icon: "🗺️" },
  ];

  // Grilles responsive
  const kpiGrid      = isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(200px,1fr))";
  const twoColGrid   = isMobile ? "1fr" : "1fr 1fr";
  const threeColGrid = isMobile ? "repeat(3,1fr)" : "repeat(3,1fr)";
  const fourColGrid  = isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const catGrid      = isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(150px,1fr))";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes rowIn     { from { opacity:0; transform:translateY(6px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer   { 0% { background-position:-300% center; }        100% { background-position:300% center; } }
        @keyframes blink     { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(150deg,#f0fdf4 0%,#fafafa 50%,#f0fdf4 100%)", fontFamily: "'Roboto',sans-serif", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, #bbf7d0 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.4, zIndex: 0 }} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#22c55e,#16a34a)", backgroundSize: "300% auto", animation: "shimmer 4s linear infinite", zIndex: 10 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1060, margin: "0 auto", padding: isMobile ? "24px 14px 48px" : "48px 24px 64px" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: isMobile ? 20 : 32, opacity: in_?1:0, transform: in_?"none":"translateY(-10px)", transition: "all 0.65s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 11px", borderRadius: 99, background: "#dcfce7", border: "1px solid #bbf7d0", marginBottom: 10 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "blink 2s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#15803d", letterSpacing: "0.12em", textTransform: "uppercase" }}>Manager</span>
                </div>
                <h1 style={{ fontFamily: "'Roboto',sans-serif", fontSize: isMobile ? "clamp(22px,6vw,32px)" : "clamp(28px,4vw,44px)", fontWeight: 700, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1.1, marginBottom: 4 }}>
                  Tableau de{" "}
                  <span style={{ background: "linear-gradient(135deg,#15803d,#22c55e,#16a34a)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 4s linear infinite" }}>Bord</span>
                </h1>
                {!isMobile && (
                  <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: "#6b7280" }}>
                    Vue opérationnelle · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Bouton actualiser */}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: isMobile ? "8px 12px" : "8px 16px",
                  borderRadius: 10, border: "1.5px solid #e5e7eb",
                  background: "#fff", color: "#374151",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Roboto',sans-serif",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.18s", flexShrink: 0,
                  opacity: refreshing ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.borderColor="#22c55e"; e.currentTarget.style.color="#16a34a"; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.color="#374151"; }}
              >
                <span style={{ display: "inline-block", animation: refreshing ? "spin 0.7s linear infinite" : "none", fontSize: 14 }}>↻</span>
                {!isMobile && "Actualiser"}
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: "flex", gap: isMobile ? 4 : 6, marginBottom: isMobile ? 20 : 28,
            background: "#fff", borderRadius: 12, border: "1.5px solid #e5e7eb",
            padding: isMobile ? 4 : 6,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            overflowX: "auto", WebkitOverflowScrolling: "touch",
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 4 : 6,
                  padding: isMobile ? "7px 10px" : "8px 16px",
                  borderRadius: 8, border: "none",
                  background: tab === t.id ? "#22c55e" : "transparent",
                  color: tab === t.id ? "#fff" : "#6b7280",
                  fontFamily: "'Roboto',sans-serif",
                  fontSize: isMobile ? 11 : 13,
                  fontWeight: 600, cursor: "pointer",
                  transition: "all 0.18s",
                  boxShadow: tab === t.id ? "0 2px 8px rgba(34,197,94,0.25)" : "none",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                <span style={{ fontSize: isMobile ? 12 : 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB : VUE GLOBALE ── */}
          {tab === "overview" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: kpiGrid, gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 28 }}>
                <KpiCard icon="🗑️" label="Containers"        value={containers.length}        sub={`${criticalContainers.length} critique(s)`} border="#e5e7eb" />
                <KpiCard icon="🔴" label="Critiques"          value={criticalContainers.length} sub="≥ 80%"                                      bg="#fff5f5"  border="#fca5a5" textColor="#991b1b" />
                <KpiCard icon="🟡" label="En attention"       value={warningContainers.length}  sub="50–80%"                                      bg="#fffbeb"  border="#fde047" textColor="#854d0e" />
                <KpiCard icon="📋" label="Signalements"       value={signalements.length}       sub={`${pendingSignalements.length} en attente`}   border="#e5e7eb" />
                <KpiCard icon="🗺️" label="Tournées actives"   value={activeRoutes.length}       sub={`${routes.filter(r=>r.status==="COMPLETED").length} terminée(s)`} border="#e5e7eb" />
                <KpiCard icon="👥" label="Agents"             value={data?.agents || "—"}       sub="disponibles"                                  border="#e5e7eb" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: isMobile ? 12 : 20, marginBottom: isMobile ? 12 : 28 }}>
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <SectionHeader title="Répartition containers" />
                  <DonutStat ok={okContainers.length} warning={warningContainers.length} critical={criticalContainers.length} total={containers.length} isMobile={isMobile} />
                </div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <SectionHeader title="🔴 Containers critiques" count={criticalContainers.length} />
                  {criticalContainers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontFamily: "'Roboto',sans-serif", fontSize: 13 }}>✅ Aucun container critique</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {criticalContainers.slice(0, 5).map((c, i) => <ContainerRow key={c.id} container={c} index={i} isMobile={isMobile} />)}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: isMobile ? 12 : 20 }}>
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <SectionHeader title="📋 Signalements récents" count={pendingSignalements.length} action={
                    <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#22c55e", fontWeight: 600, cursor: "pointer" }} onClick={() => setTab("signalements")}>Voir tout →</span>
                  } />
                  {signalements.length === 0
                    ? <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 13 }}>Aucun signalement</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{signalements.slice(0, 5).map((s, i) => <SignalementRow key={s.id} s={s} index={i} isMobile={isMobile} />)}</div>
                  }
                </div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <SectionHeader title="🗺️ Tournées actives" count={activeRoutes.length} action={
                    <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#22c55e", fontWeight: 600, cursor: "pointer" }} onClick={() => setTab("routes")}>Voir tout →</span>
                  } />
                  {activeRoutes.length === 0
                    ? <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 13 }}>Aucune tournée active</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{activeRoutes.slice(0, 5).map((r, i) => <TourneeRow key={r.id} route={r} index={i} />)}</div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── TAB : CONTAINERS ── */}
          {tab === "containers" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: threeColGrid, gap: isMobile ? 8 : 14, marginBottom: isMobile ? 12 : 20 }}>
                <KpiCard icon="🟢" label="OK"       value={okContainers.length}       bg="#f0fdf4" border="#bbf7d0" textColor="#15803d" />
                <KpiCard icon="🟡" label="Attention" value={warningContainers.length}  bg="#fffbeb" border="#fde047" textColor="#854d0e" />
                <KpiCard icon="🔴" label="Critique"  value={criticalContainers.length} bg="#fff5f5" border="#fca5a5" textColor="#991b1b" />
              </div>
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <SectionHeader title="Tous les containers" count={containers.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...containers].sort((a,b) => Number(b.fillLevel) - Number(a.fillLevel)).map((c, i) => <ContainerRow key={c.id} container={c} index={i} isMobile={isMobile} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB : SIGNALEMENTS ── */}
          {tab === "signalements" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: catGrid, gap: isMobile ? 8 : 14, marginBottom: isMobile ? 12 : 20 }}>
                {Object.entries(CAT_COLORS).map(([type, c]) => {
                  const count = signalements.filter(s => s.type === type).length;
                  return (
                    <div key={type} style={{ background: c.bg, borderRadius: 14, border: `1.5px solid ${c.border}`, padding: isMobile ? "12px 14px" : "16px 18px" }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 4 }}>{c.icon}</div>
                      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: c.text }}>{count}</div>
                      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: isMobile ? 10 : 11, color: c.text, fontWeight: 600 }}>{type}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <SectionHeader title="Tous les signalements" count={signalements.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {signalements.map((s, i) => <SignalementRow key={s.id} s={s} index={i} isMobile={isMobile} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB : TOURNÉES ── */}
          {tab === "routes" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: fourColGrid, gap: isMobile ? 8 : 14, marginBottom: isMobile ? 12 : 20 }}>
                {Object.entries(STATUS_CONFIG).filter(([s]) => ["PENDING","ASSIGNED","IN_PROGRESS","COMPLETED"].includes(s)).map(([status, cfg]) => {
                  const count = routes.filter(r => r.status === status).length;
                  return (
                    <div key={status} style={{ background: cfg.bg, borderRadius: 14, border: `1.5px solid ${cfg.border}`, padding: isMobile ? "12px 14px" : "16px 18px" }}>
                      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: cfg.text }}>{count}</div>
                      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: isMobile ? 10 : 11, color: cfg.text, fontWeight: 600 }}>{cfg.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: isMobile ? "16px" : "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <SectionHeader title="Toutes les tournées" count={routes.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {routes.map((r, i) => <TourneeRow key={r.id} route={r} index={i} />)}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}