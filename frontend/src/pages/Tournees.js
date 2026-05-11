import { useState, useEffect } from "react";
import API from "../api/api";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOSRMRoute } from "../hooks/useOSRMRoute";

// ── Role theming ───────────────────────────────────────────────────────────
const ROLE_THEME = {
  ADMIN:   { label: "Administrateur", accent: "#8b5cf6" },
  MANAGER: { label: "Manager",        accent: "#22c55e" },
  AGENT:   { label: "Agent",          accent: "#06b6d4" },
};

// ── Timeline step colors ───────────────────────────────────────────────────
const stepColor = (status) => ({
  done:    { bg: "#dcfce7", border: "#22c55e", text: "#15803d" },
  active:  { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
  pending: { bg: "#f3f4f6", border: "#e5e7eb", text: "#9ca3af" },
}[status] || { bg: "#f3f4f6", border: "#e5e7eb", text: "#9ca3af" });

const stepIcon = (step, status) => {
  if (status === "done") return "✓";
  if (step.includes("Initialisation")) return "✎";
  if (step.includes("Prise")) return "⟳";
  if (step.includes("Départ")) return "↗";
  return "⚑";
};

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }) {
  const parts = name?.split(" ") || [];
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  const hue = (name?.charCodeAt(0) || 0) * 37 % 50;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${128+hue},45%,78%), hsl(${138+hue},55%,68%))`,
      border: "1.5px solid rgba(34,197,94,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Roboto', sans-serif",
      fontSize: size * 0.38, fontWeight: 700, color: "hsl(140,45%,22%)",
    }}>
      {initials.toUpperCase()}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ timeline }) {
  const done = timeline.every(t => t.status === "done");
  const active = timeline.find(t => t.status === "active");
  if (done) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:99, background:"#dcfce7", border:"1px solid #bbf7d0", fontFamily:"'Roboto',sans-serif", fontSize:10, fontWeight:600, color:"#15803d", letterSpacing:"0.08em", textTransform:"uppercase" }}>
      <span style={{ width:4, height:4, borderRadius:"50%", background:"#22c55e" }} />Terminée
    </span>
  );
  if (active) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:99, background:"#fef9c3", border:"1px solid #fde047", fontFamily:"'Roboto',sans-serif", fontSize:10, fontWeight:600, color:"#854d0e", letterSpacing:"0.08em", textTransform:"uppercase" }}>
      <span style={{ width:4, height:4, borderRadius:"50%", background:"#eab308" }} />En cours
    </span>
  );
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:99, background:"#f3f4f6", border:"1px solid #e5e7eb", fontFamily:"'Roboto',sans-serif", fontSize:10, fontWeight:600, color:"#6b7280", letterSpacing:"0.08em", textTransform:"uppercase" }}>
      <span style={{ width:4, height:4, borderRadius:"50%", background:"#9ca3af" }} />En attente
    </span>
  );
}

// ── Timeline ───────────────────────────────────────────────────────────────
function Timeline({ timeline }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {timeline.map((item, i) => {
        const c = stepColor(item.status);
        const isLast = i === timeline.length - 1;
        return (
          <div key={i} style={{ display:"flex", gap:12, position:"relative" }}>
            {!isLast && <div style={{ position:"absolute", left:14, top:28, width:1, height:"calc(100% - 4px)", background: item.status==="done" ? "#bbf7d0" : "#e5e7eb", zIndex:0 }} />}
            <div style={{ width:28, height:28, borderRadius:"50%", background:c.bg, border:`1.5px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1, fontFamily:"'Roboto',sans-serif", fontSize:11, fontWeight:700, color:c.text }}>
              {stepIcon(item.step, item.status)}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 18, paddingTop: 4 }}>
              <div style={{ fontFamily:"'Roboto',sans-serif", fontSize:12, fontWeight:600, color: item.status==="pending" ? "#9ca3af" : "#374151" }}>
                {item.step}
              </div>
              <div style={{ fontFamily:"'Roboto',sans-serif", fontSize:11, color:"#9ca3af" }}>
                {item.time ? item.time : item.status==="active" ? "En cours…" : "En attente"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mission card ───────────────────────────────────────────────────────────
function MissionCard({ mission, index, onEdit, onDelete, onAdvance }) {
  const [hov, setHov] = useState(false);
  const isDone = mission.timeline.every(t => t.status === "done");
  const hasActive = mission.timeline.some(t => t.status === "active");

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 16,
        border: `1.5px solid ${hov ? "#bbf7d0" : "#e5e7eb"}`,
        boxShadow: hov ? "0 8px 32px rgba(34,197,94,0.1)" : "0 2px 12px rgba(0,0,0,0.05)",
        padding: "20px", transition: "all 0.2s",
        animation: "rowIn 0.4s ease both",
        animationDelay: `${index * 60}ms`,
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Roboto', sans-serif", fontSize:18, fontWeight:700, color:"#111827", lineHeight:1.2, marginBottom:6 }}>
            {mission.title}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Avatar name={mission.agent} size={22} />
            <span style={{ fontFamily:"'Roboto',sans-serif", fontSize:12, color:"#6b7280" }}>{mission.agent || "—"}</span>
          </div>
        </div>
        <StatusBadge timeline={mission.timeline} />
        {mission.totalDistanceKm && (
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <StatPill icon="📏" value={`${mission.totalDistanceKm} km`} />
            <StatPill icon="✅" value={`-${mission.improvement}`} color="#15803d" />
            <StatPill icon="🗑️" value={`${mission.containersCount} bacs`} />
          </div>
        )}
      </div>

      <div style={{ height:1, background:"#f3f4f6" }} />

      <Timeline timeline={mission.timeline} />

      <div style={{ display:"flex", gap:6, marginTop:2 }}>
        {hasActive && !isDone && (
          <button onClick={() => onAdvance(mission.id)}
            style={{ flex:1, padding:"7px 0", borderRadius:9, background:"#f0fdf4", border:"1.5px solid #bbf7d0", color:"#15803d", fontFamily:"'Roboto',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.18s", letterSpacing:"0.03em" }}
            onMouseEnter={e => { e.currentTarget.style.background="#dcfce7"; e.currentTarget.style.borderColor="#22c55e"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#f0fdf4"; e.currentTarget.style.borderColor="#bbf7d0"; }}
          >
            Avancer →
          </button>
        )}
        <ActionBtn onClick={() => onEdit(mission)} color="#22c55e" hoverBg="#f0fdf4" title="Modifier"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
        />
        <ActionBtn onClick={() => onDelete(mission.id)} color="#ef4444" hoverBg="#fef2f2" title="Supprimer"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
        />
      </div>
    </div>
  );
}

function ActionBtn({ onClick, color, hoverBg, title, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${hov ? color+"60" : "#e5e7eb"}`, background: hov ? hoverBg : "#fff", color: hov ? color : "#d1d5db", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s", boxShadow: hov ? `0 2px 8px ${color}25` : "none" }}
    >
      {icon}
    </button>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "text", options }) {
  const [focused, setFocused] = useState(false);
  const baseStyle = {
    padding:"10px 14px", borderRadius:10,
    background: focused ? "#fff" : "#f9fafb",
    border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`,
    color:"#111827", fontFamily:"'Roboto',sans-serif", fontSize:14,
    outline:"none", boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.1)" : "0 1px 2px rgba(0,0,0,0.04)",
    transition:"all 0.2s", width:"100%",
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontFamily:"'Roboto',sans-serif", fontSize:10, fontWeight:600, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" }}>
        {label}
      </label>
      {type === "select" ? (
        <select name={name} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={baseStyle}>
          <option value="">— Sélectionner —</option>
          {(options||[]).map(a => (
            <option key={a.id} value={`${a.firstName} ${a.lastName}`}>{a.firstName} {a.lastName}</option>
          ))}
        </select>
      ) : (
        <input name={name} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={baseStyle} placeholder={label} />
      )}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(2px)" }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"28px", width:440, maxWidth:"90%", boxShadow:"0 24px 64px rgba(0,0,0,0.12)", border:"1.5px solid #e5e7eb", animation:"slideDown 0.3s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
          <span style={{ fontFamily:"'Roboto',sans-serif", fontSize:20, fontWeight:700, color:"#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:18, lineHeight:1, padding:"2px 6px", borderRadius:6 }}
            onMouseEnter={e => e.currentTarget.style.color="#374151"} onMouseLeave={e => e.currentTarget.style.color="#9ca3af"}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Search ─────────────────────────────────────────────────────────────────
function SearchBox({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      <svg style={{ position:"absolute", left:11, pointerEvents:"none", color: focused ? "#22c55e" : "#9ca3af", transition:"color 0.2s" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Rechercher..."
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ paddingLeft:32, paddingRight:14, paddingTop:8, paddingBottom:8, borderRadius:9, width:200, background: focused?"#fff":"#f9fafb", border:`1.5px solid ${focused?"#22c55e":"#e5e7eb"}`, color:"#111827", fontFamily:"'Roboto',sans-serif", fontSize:13, outline:"none", transition:"all 0.2s", boxShadow: focused?"0 0 0 3px rgba(34,197,94,0.08)":"none" }}
      />
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, padding:"12px 18px", borderRadius:12, background:"#f0fdf4", border:"1.5px solid #22c55e", display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 20px rgba(34,197,94,0.2)", zIndex:1000, animation:"slideDown 0.3s ease" }}>
      <span style={{ fontSize:14 }}>✓</span>
      <span style={{ fontFamily:"'Roboto',sans-serif", fontSize:13, fontWeight:600, color:"#15803d" }}>{message}</span>
    </div>
  );
}

function MapBounds({ stops, depot }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      [depot.lat, depot.lng],
      ...stops.map(s => [Number(s.container.latitude), Number(s.container.longitude)]),
    ];

    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [stops, depot]);

  return null;
}

function AgentRouteMap({ stops, depot }) {
  const { routeCoords, isLoading, duration, distance } = useOSRMRoute(stops, depot);

  if (!stops || stops.length === 0) return null;

  const validStops = stops.filter(
    s => s.container?.latitude && s.container?.longitude
  );

  if (validStops.length === 0) return null;

  const center = [
    Number(validStops[0].container.latitude),
    Number(validStops[0].container.longitude),
  ];

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const h   = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${min}min` : `${min} min`;
  };

  const formatDistance = (meters) => {
    if (!meters) return null;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div>
      {(duration || distance) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {distance && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
              <span style={{ fontSize: 14 }}>📏</span>
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: "#15803d" }}>{formatDistance(distance)}</span>
            </div>
          )}
          {duration && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: "#fef9c3", border: "1.5px solid #fde047" }}>
              <span style={{ fontSize: 14 }}>⏱️</span>
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: "#854d0e" }}>{formatDuration(duration)} estimé</span>
            </div>
          )}
        </div>
      )}

      <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", height: 420, position: "relative" }}>
        {isLoading && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "#fff", borderRadius: 99, padding: "6px 14px", border: "1.5px solid #e5e7eb" }}>
            ⏳ Calcul de l'itinéraire...
          </div>
        )}

        <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.85 }} />}

          <Marker position={[depot.lat, depot.lng]} icon={L.divIcon({ html: `<div style="background:#111827;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏁</div>`, iconSize: [34, 34], iconAnchor: [17, 17] })}>
            <Popup><strong>Dépôt de départ</strong></Popup>
          </Marker>

          {validStops.map((stop, i) => {
            const isDone = !!stop.collectedAt;
            const isNext = !isDone && validStops.slice(0, i).every(s => s.collectedAt);
            return (
              <Marker
                key={stop.id}
                position={[Number(stop.container.latitude), Number(stop.container.longitude)]}
                icon={L.divIcon({
                  html: `<div style="background:${isDone ? "#22c55e" : "#ef4444"};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2.5px solid #fff;">${isDone ? "✓" : stop.order}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })}
              >
                <Popup>
                  <div>
                    <strong>Arrêt #{stop.order}</strong><br />
                    🗑️ {stop.container?.type}<br />
                    📍 {stop.container?.zone || "—"}<br />
                    💧 {stop.container?.fillLevel}%
                    <br />
                    {isDone
                      ? `✅ Collecté à ${new Date(stop.collectedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : isNext ? "👉 Prochain arrêt" : "⏳ En attente"
                    }
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Auto-zoom sur l'itinéraire */}
          <MapBounds stops={validStops} depot={depot} />
        </MapContainer>
      </div>
    </div>
  );
}

function AgentTourView({ tour, loading, onAdvanceStop }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: "64px 0" }}>
      <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 16, color: "#9ca3af" }}>⏳ Chargement de votre tournée...</p>
    </div>
  );

  if (!tour) return (
    <div style={{ textAlign: "center", padding: "64px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>Aucune tournée assignée</p>
    </div>
  );

  const totalStops    = tour.stops?.length || 0;
  const doneStops     = tour.stops?.filter(s => s.collectedAt).length || 0;
  const progress      = totalStops > 0 ? Math.round((doneStops / totalStops) * 100) : 0;
  const progressColor = progress === 100 ? "#22c55e" : progress > 50 ? "#eab308" : "#ef4444";
  const depot = { lat: 48.8566, lng: 2.3522 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Roboto',sans-serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{tour.name}</h2>
            <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, color: "#6b7280" }}>📅 {new Date(tour.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <AgentRouteMap stops={tour.stops} depot={depot} />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#6b7280" }}>Progression : {doneStops}/{totalStops} collectes</span>
          <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 700, color: progressColor }}>{progress}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: progressColor, transition: "width 0.5s ease" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ fontFamily: "'Roboto',sans-serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>Itinéraire</h3>
        {tour.stops?.map((stop, i) => {
          const isDone = !!stop.collectedAt;
          const isNext = !isDone && tour.stops.slice(0, i).every(s => s.collectedAt);

          return (
            <div key={stop.id} style={{
              background: "#fff", borderRadius: 14, border: `1.5px solid ${isNext ? "#22c55e" : isDone ? "#bbf7d0" : "#e5e7eb"}`,
              padding: "16px 20px", display: "flex", alignItems: "center", gap: 16
            }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: isDone ? "#dcfce7" : isNext ? "#22c55e" : "#f3f4f6", color: isDone ? "#22c55e" : isNext ? "#fff" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {isDone ? "✓" : stop.order}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{stop.container?.type || `Conteneur #${stop.containerId}`}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  📍 {stop.container?.zone} • 🗑️ {stop.container?.fillLevel}%
                </div>
              </div>
              {isNext && (
                <button onClick={() => onAdvanceStop(tour.id, stop.id)} style={{ padding: "8px 16px", borderRadius: 9, background: "#22c55e", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
                  ✓ Collecté
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Tournees({ user, missions: initialMissions }) {
  const role = localStorage.getItem('role');
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDelete, setModalDelete] = useState({ open: false, missionId: null });
  const [editingMission, setEditingMission] = useState(null);
  const [form, setForm] = useState({ title: "", agent: "" });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [myTour, setMyTour] = useState(null);
  const [loadingTour, setLoadingTour] = useState(false);
  const [in_, setIn] = useState(false);

  // Chargement tournée AGENT
  useEffect(() => {
    if (role === 'AGENT') {
      setLoadingTour(true);
      API.get('/tournees')
        .then(r => {
          const tour = r.data.find(t => t.agentId === parseInt(localStorage.getItem('userId') || '0')) || r.data[0] || null;
          setMyTour(tour);
        })
        .catch(console.error)
        .finally(() => setLoadingTour(false));
    }
  }, [role]);

  useEffect(() => { setTimeout(() => setIn(true), 60); }, []);

  useEffect(() => {
    API.get("/agents").then(r => setAgents(r.data)).catch(console.error);
  }, []);

  // Chargement des tournées
  useEffect(() => {
    API.get("/tournees")
      .then(r => {
        const formatted = r.data.map(route => ({
          id: route.id,
          title: route.name,
          agent: route.agent ? `${route.agent.firstName} ${route.agent.lastName}` : "—",
          totalDistanceKm: route.totalDistanceKm,
          improvement: route.improvement,
          containersCount: route.containersCount,
          timeline: buildTimeline(route.status),
          stops: route.stops || [],
        }));
        setMissions(formatted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function buildTimeline(status) {
    const steps = ["Initialisation", "Prise en compte", "Départ", "Fini"];
    const statusMap = { PENDING: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 3 };
    const activeIndex = statusMap[status] ?? 0;

    return steps.map((step, i) => ({
      step,
      time: i < activeIndex ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      status: i < activeIndex ? "done" : i === activeIndex ? "active" : "pending",
    }));
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleAdvanceStop = async (tourId, stopId) => {
    try {
      await API.patch(`/tournees/${tourId}/stops/${stopId}/collect`);
      setMyTour(prev => ({
        ...prev,
        stops: prev.stops.map(s => s.id === stopId ? { ...s, collectedAt: new Date().toISOString() } : s)
      }));
      showToast("Collecte validée ✅");
    } catch (err) {
      showToast("Erreur lors de la validation ❌");
      console.error(err);
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.title) newErrors.title = true;
    if (!form.agent) newErrors.agent = true;
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    try {
      const agent = agents.find(a => `${a.firstName} ${a.lastName}` === form.agent);
      if (!agent) throw new Error("Agent non trouvé");

      if (editingMission) {
        await API.put(`/tournees/${editingMission.id}`, { name: form.title });
        showToast("Mission modifiée !");
      } else {
        await API.post('/tournees', { agentId: agent.id, name: form.title });
        showToast(`Tournée "${form.title}" créée ! 🚀`);
      }

      const updated = await API.get("/tournees");
      const formatted = updated.data.map(route => ({
        id: route.id,
        title: route.name,
        agent: route.agent ? `${route.agent.firstName} ${route.agent.lastName}` : "—",
        totalDistanceKm: route.totalDistanceKm,
        improvement: route.improvement,
        containersCount: route.containersCount,
        timeline: buildTimeline(route.status),
        stops: route.stops || [],
      }));
      setMissions(formatted);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la sauvegarde ❌");
    }

    setModalOpen(false);
    setEditingMission(null);
    setForm({ title: "", agent: "" });
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setForm({ title: mission.title, agent: mission.agent });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/tournees/${modalDelete.missionId}`);
      setMissions(prev => prev.filter(m => m.id !== modalDelete.missionId));
      showToast("Mission supprimée.");
    } catch (err) {
      showToast("Erreur lors de la suppression ❌");
    }
    setModalDelete({ open: false, missionId: null });
  };

  const advanceStep = async (missionId) => {
    try {
      const mission = missions.find(m => m.id === missionId);
      const activeIndex = mission.timeline.findIndex(t => t.status === "active");
      const statusMap = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];
      const newStatus = statusMap[activeIndex + 1] || "COMPLETED";

      await API.patch(`/tournees/${missionId}`, { status: newStatus });

      setMissions(prev => prev.map(m => {
        if (m.id !== missionId) return m;
        const tl = [...m.timeline];
        const ai = tl.findIndex(t => t.status === "active");
        if (ai !== -1) {
          tl[ai] = { ...tl[ai], status: "done", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
          if (ai + 1 < tl.length) tl[ai + 1] = { ...tl[ai + 1], status: "active" };
        }
        return { ...m, timeline: tl };
      }));
    } catch (err) {
      showToast("Erreur lors de la mise à jour ❌");
    }
  };

  const filtered = missions.filter(m => {
    const matchSearch = `${m.title} ${m.agent}`.toLowerCase().includes(search.toLowerCase());
    const isDone = m.timeline.every(t => t.status === "done");
    const isActive = m.timeline.some(t => t.status === "active");
    if (filter === "done" && !isDone) return false;
    if (filter === "active" && !isActive) return false;
    if (filter === "pending" && (isDone || isActive)) return false;
    return matchSearch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #d1d5db; font-family: 'Roboto', sans-serif; }
        select option { background: #fff; color: #111827; }
        @keyframes rowIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-300% center; } 100% { background-position:300% center; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>

      <div style={{ minHeight:"100vh", background:"linear-gradient(150deg,#f0fdf4 0%,#fafafa 50%,#f0fdf4 100%)", fontFamily:"'Roboto',sans-serif", position:"relative" }}>
        {/* Background décor */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"radial-gradient(circle, #bbf7d0 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.45 }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#22c55e,#16a34a)", backgroundSize:"300% auto", animation:"shimmer 4s linear infinite" }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:1060, margin:"0 auto", padding:"48px 24px 64px" }}>
          {/* Header */}
          <div style={{ marginBottom:36, opacity:in_?1:0, transform:in_?"none":"translateY(-10px)", transition:"all 0.65s cubic-bezier(0.22,1,0.36,1)" }}>
            <h1 style={{ fontFamily:"'Roboto',sans-serif", fontSize:"clamp(30px,4vw,48px)", fontWeight:700, color:"#111827", letterSpacing:"-0.3px", lineHeight:1.1 }}>
              Gestion des <span style={{ background:"linear-gradient(135deg,#15803d,#22c55e,#16a34a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Tournées</span>
            </h1>
          </div>

          {/* Toolbar */}
          <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e5e7eb", padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {[["all","Toutes"],["active","En cours"],["pending","En attente"],["done","Terminées"]].map(([val,lab]) => (
                <FilterBtn key={val} active={filter===val} onClick={() => setFilter(val)} label={lab} />
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <SearchBox value={search} onChange={setSearch} />
              <button onClick={() => { setEditingMission(null); setForm({ title:"", agent:"" }); setModalOpen(true); }}
                style={{ padding:"8px 16px", borderRadius:9, background:"#22c55e", color:"#fff", border:"none", fontWeight:600, cursor:"pointer" }}>
                + Nouvelle mission
              </button>
            </div>
          </div>

          {/* Contenu */}
          {role === 'AGENT' ? (
            <AgentTourView tour={myTour} loading={loadingTour} onAdvanceStop={handleAdvanceStop} />
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>Aucune mission trouvée</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:18 }}>
              {filtered.map((mission, i) => (
                <MissionCard key={mission.id} mission={mission} index={i}
                  onEdit={handleEdit} onDelete={(id) => setModalDelete({ open:true, missionId:id })} onAdvance={advanceStep} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalOpen && (
        <Modal title={editingMission ? "Modifier la mission" : "Nouvelle mission"} onClose={() => { setModalOpen(false); setEditingMission(null); }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:22 }}>
            <Field label="Titre de la mission" name="title" value={form.title} onChange={handleChange} />
            <Field label="Agent assigné" name="agent" value={form.agent} onChange={handleChange} type="select" options={agents} />
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button onClick={() => { setModalOpen(false); setEditingMission(null); }} style={{ padding:"9px 18px", border:"1.5px solid #e5e7eb", borderRadius:9 }}>Annuler</button>
            <button onClick={handleSave} style={{ padding:"9px 20px", background:"#22c55e", color:"white", border:"none", borderRadius:9, fontWeight:600 }}>Enregistrer</button>
          </div>
        </Modal>
      )}

      {modalDelete.open && (
        <Modal title="Supprimer la mission ?" onClose={() => setModalDelete({ open: false, missionId: null })}>
          <p style={{ marginBottom: 22, color: "#6b7280" }}>Cette action est irréversible.</p>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button onClick={() => setModalDelete({ open: false, missionId: null })} style={{ padding:"9px 18px", border:"1.5px solid #e5e7eb", borderRadius:9 }}>Annuler</button>
            <button onClick={handleDelete} style={{ padding:"9px 18px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:9 }}>Supprimer</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} />}
    </>
  );
}

function FilterBtn({ active, onClick, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      style={{ padding:"5px 12px", borderRadius:8, border:`1.5px solid ${active?"#22c55e":"#e5e7eb"}`, background: active?"#22c55e": hov?"#f0fdf4":"#fff", color: active?"#fff": hov?"#15803d":"#6b7280", cursor:"pointer" }}>
      {label}
    </button>
  );
}

function StatPill({ icon, value, color = "#6b7280" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: "#f9fafb", border: "1.5px solid #e5e7eb", color, fontSize:10, fontWeight:600 }}>
      {icon} {value}
    </span>
  );
}