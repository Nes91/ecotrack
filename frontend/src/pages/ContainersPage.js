import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import API from "../api/api";
// Remplace ta ligne d'import react-leaflet par :
import { MapContainer, TileLayer, useMapEvents, Marker, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Fill level utils ───────────────────────────────────────────────────────
const fillColor = (level) => {
  if (level < 50) return { main: "#22c55e", light: "#dcfce7", border: "#bbf7d0", text: "#15803d" };
  if (level < 80) return { main: "#eab308", light: "#fef9c3", border: "#fde047", text: "#854d0e" };
  return { main: "#ef4444", light: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
};

const fillLabel = (level) => {
  if (level < 25) return "Vide";
  if (level < 50) return "À moitié";
  if (level < 80) return "Presque plein";
  return "Plein";
};

// ── Create ping DivIcon ────────────────────────────────────────────────────
const createPingIcon = (color, isSelected = false) => {
  const size = isSelected ? 22 : 16;
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="position:absolute;inset:-8px;border-radius:50%;background:${color};opacity:0.18;animation:leaflet-ping 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:-3px;border-radius:50%;background:${color};opacity:0.25;animation:leaflet-ping 2s ease-out infinite 0.5s;"></div>
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSelected ? "3px" : "2.5px"} solid #fff;box-shadow:0 2px 8px ${color}99;position:relative;z-index:1;"></div>
    </div>
  `;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
};

// ── Ping Markers ───────────────────────────────────────────────────────────
function PingMarkers({ containers, selected, onSelect }) {
  return (
    <>
      {containers
        // ✅ Utilise latitude/longitude au lieu de lat/lng
        .filter(c => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude))
        .map(c => {
          const fc = fillColor(Number(c.fillLevel) || 0);
          const isSelected = selected?.id === c.id;
          return (
            <Marker
              key={c.id}              
              position={[Number(c.latitude), Number(c.longitude)]}
              icon={createPingIcon(fc.main, isSelected)}
              eventHandlers={{ click: () => onSelect(isSelected ? null : c) }}
            />
          );
        })}
    </>
  );
}
// ── Route Polyline ─────────────────────────────────────────────────────────
function RoutePolyline({ stops, depot }) {
  if (!stops || stops.length === 0) return null;

  const positions = [
    [depot.lat, depot.lng],
    ...stops
      .filter(s => s.container?.latitude && s.container?.longitude)
      .map(s => [Number(s.container.latitude), Number(s.container.longitude)]),
    [depot.lat, depot.lng], // retour au dépôt
  ];

  return (
    <>
      {/* Ligne pointillée de la tournée */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#8b5cf6",
          weight: 3,
          opacity: 0.85,
          dashArray: "8, 5",
        }}
      />

      {/* Marqueur dépôt */}
      <Marker
        position={[depot.lat, depot.lng]}
        icon={L.divIcon({
          className: "",
          html: `<div style="
            background:#8b5cf6;color:white;border-radius:50%;
            width:32px;height:32px;display:flex;align-items:center;
            justify-content:center;font-size:15px;border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(139,92,246,0.4);
          ">🏁</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })}
      />

      {/* Marqueurs numérotés pour chaque arrêt */}
      {stops
        .filter(s => s.container?.latitude && s.container?.longitude)
        .map(stop => (
          <Marker
            key={stop.id}
            position={[Number(stop.container.latitude), Number(stop.container.longitude)]}
            icon={L.divIcon({
              className: "",
              html: `<div style="
                background:#8b5cf6;color:white;border-radius:50%;
                width:26px;height:26px;display:flex;align-items:center;
                justify-content:center;font-weight:700;font-size:12px;
                border:2.5px solid #fff;
                box-shadow:0 2px 6px rgba(139,92,246,0.4);
              ">${stop.order}</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            })}
          />
        ))}
    </>
  );
}

// ── Map click handler ──────────────────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

// ── Map auto-center on selected ────────────────────────────────────────────
function MapFlyTo({ container }) {
  const map = useMap();
  useEffect(() => {
    // ✅ Utilise latitude/longitude
    if (container?.latitude && container?.longitude) {
      map.flyTo([Number(container.latitude), Number(container.longitude)], 15, { duration: 1 });
    }
  }, [container]);
  return null;
}

// ── Fill bar ───────────────────────────────────────────────────────────────
function FillBar({ level }) {
  const c = fillColor(level);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Remplissage</span>
        <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, fontWeight: 700, color: c.main }}>{level}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${level}%`, borderRadius: 99, background: c.main, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
      <div style={{ marginTop: 5, display: "flex", justifyContent: "flex-end" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: c.light, border: `1px solid ${c.border}`, fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: c.text }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.main }} />
          {fillLabel(level)}
        </span>
      </div>
    </div>
  );
}

// ── Container card ─────────────────────────────────────────────────────────
function ContainerCard({ container, index, onEdit, onDelete, onLocate }) {
  const [hov, setHov] = useState(false);
  const hasCoords = container.latitude && container.longitude && !isNaN(container.latitude) && !isNaN(container.longitude);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 16,
        border: `1.5px solid ${hov ? "#bbf7d0" : "#e5e7eb"}`,
        boxShadow: hov ? "0 8px 32px rgba(34,197,94,0.1)" : "0 2px 12px rgba(0,0,0,0.05)",
        padding: "20px", transition: "all 0.2s",
        animation: "rowIn 0.4s ease both",
        animationDelay: `${index * 55}ms`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.2, marginBottom: 5 }}>
            {container.type || "Container"}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, background: "#f0fdf4", border: "1px solid #bbf7d0", fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#15803d", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {container.type || "—"}
          </span>
        </div>
        <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#d1d5db" }}>#{String(container.id).padStart(4, "0")}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
        <InfoRow label="Zone" value={container.zone || "—"} />
        <InfoRow label="Capacité" value={`${container.capacity} L`} />
      </div>

      <FillBar level={Number(container.fillLevel) || 0} />

      <div style={{ height: 1, background: "#f3f4f6", margin: "14px 0" }} />

      <div style={{ display: "flex", gap: 6 }}>
        {hasCoords && (
          <button onClick={() => onLocate(container)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", borderRadius: 8, background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#15803d", fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.borderColor = "#22c55e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#bbf7d0"; }}
          >
            ◎ Localiser
          </button>
        )}
        <ActionBtn onClick={() => onEdit(container)} color="#22c55e" hoverBg="#f0fdf4" title="Modifier"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
        />
        <ActionBtn onClick={() => onDelete(container.id)} color="#ef4444" hoverBg="#fef2f2" title="Supprimer"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 9, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 500, color: "#374151" }}>{value}</div>
    </div>
  );
}

function ActionBtn({ onClick, color, hoverBg, title, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${hov ? color + "60" : "#e5e7eb"}`, background: hov ? hoverBg : "#fff", color: hov ? color : "#d1d5db", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}>
      {icon}
    </button>
  );
}

// ── Map popup panel ────────────────────────────────────────────────────────
function MapPopup({ container, onClose, onEdit }) {
  if (!container) return null;
  const fc = fillColor(Number(container.fillLevel) || 0);
  return (
    <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 1000, pointerEvents: "all", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.13)", padding: "18px 20px", minWidth: 250, animation: "slideUp 0.3s cubic-bezier(0.34,1.4,0.64,1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 17, fontWeight: 700, color: "#111827" }}>{container.type}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}
          onMouseEnter={e => { e.currentTarget.style.color="#374151"; }} onMouseLeave={e => { e.currentTarget.style.color="#9ca3af"; }}>✕</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
        {[["Zone", container.zone||"—"],["Capacité", `${container.capacity} L`],["Position", `${Number(container.latitude).toFixed(4)}, ${Number(container.longitude).toFixed(4)}`]].map(([l,v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>{l}</span>
            <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, color: "#374151" }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>Remplissage</span>
          <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 12, fontWeight: 700, color: fc.main }}>{container.fillLevel}%</span>
        </div>
      </div>

      <div style={{ height: 4, borderRadius: 99, background: "#f3f4f6", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", width: `${container.fillLevel}%`, borderRadius: 99, background: fc.main }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 99, background: fc.light, border: `1px solid ${fc.border}`, fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: fc.text }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: fc.main }} />
          {fillLabel(container.fillLevel)}
        </span>
        <button onClick={() => onEdit(container)}
          style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, color: "#22c55e", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.color="#16a34a"; }} onMouseLeave={e => { e.currentTarget.style.color="#22c55e"; }}>
          Modifier →
        </button>
      </div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ padding: "10px 14px", borderRadius: 10, background: focused ? "#fff" : "#f9fafb", border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`, color: "#111827", fontFamily: "'Roboto',sans-serif", fontSize: 14, outline: "none", boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.1)" : "0 1px 2px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
      />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(2px)" }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "28px", width: 460, maxWidth: "92%", boxShadow: "0 24px 64px rgba(0,0,0,0.12)", border: "1.5px solid #e5e7eb", animation: "slideDown 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: "2px 6px", borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.color="#374151"; }} onMouseLeave={e => { e.currentTarget.style.color="#9ca3af"; }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SearchBox({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <svg style={{ position: "absolute", left: 11, pointerEvents: "none", color: focused ? "#22c55e" : "#9ca3af", transition: "color 0.2s" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Rechercher..."
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8, borderRadius: 9, width: 200, background: focused ? "#fff" : "#f9fafb", border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`, color: "#111827", fontFamily: "'Roboto',sans-serif", fontSize: 13, outline: "none", transition: "all 0.2s", boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.08)" : "none" }}
      />
    </div>
  );
}

function FilterBtn({ active, onClick, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${active ? "#22c55e" : "#e5e7eb"}`, background: active ? "#22c55e" : hov ? "#f0fdf4" : "#fff", color: active ? "#fff" : hov ? "#15803d" : "#6b7280", fontFamily: "'Roboto',sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.18s", letterSpacing: "0.04em" }}>
      {label}
    </button>
  );
}

function Toast({ message }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 18px", borderRadius: 12, background: "#f0fdf4", border: "1.5px solid #22c55e", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(34,197,94,0.2)", zIndex: 10000, animation: "slideDown 0.3s ease" }}>
      <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>
      <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, color: "#15803d" }}>{message}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ContainersPage() {
  const [containers, setContainers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [form, setForm] = useState({ type: "", capacity: "", fillLevel: 0, zone: "" });
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [in_, setIn] = useState(false);
  const [mapClickCoords, setMapClickCoords] = useState(null);
  const [activeRoute, setActiveRoute]     = useState(null);
const [loadingRoute, setLoadingRoute]   = useState(false);
// Ajoute ces states dans ContainersPage
const [addressSearch, setAddressSearch]   = useState("");
const [addressResults, setAddressResults] = useState([]);
const [searchLoading, setSearchLoading]   = useState(false);
const [addressError, setAddressError]     = useState("");

const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

// 👇 Ajoutez ici, juste après les useState
const handleMapClick = useCallback((latlng) => {
  setMapClickCoords({ latitude: latlng.lat, longitude: latlng.lng });
}, []);

const depot = { lat: 48.8566, lng: 2.3522 };
// Géocodage avec Nominatim (OpenStreetMap, gratuit)
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'fr' }
  });
  const data = await res.json();
  if (data.length === 0) return null;
  return {
    latitude:  parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    label:     data[0].display_name,
  };
}

  useEffect(() => {
    const t = setTimeout(() => {
      if (isMounted.current) setIn(true);
    }, 60);
    return () => clearTimeout(t);
  }, []); 
  useEffect(() => {
    API.get("/containers")
      .then(r => { if (isMounted.current) setContainers(r.data); })
      .catch(console.error);
  }, []);

  const loadLatestRoute = async () => {
  setLoadingRoute(true);
  try {
    const r = await API.get("/routes?status=ASSIGNED&limit=1");
    const latest = r.data[0];
    if (latest) {
      setActiveRoute(latest);
      showToast(`Tournée chargée — ${latest.containersCount} arrêts, ${latest.totalDistanceKm} km`);
    } else {
      showToast("Aucune tournée active pour le moment");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingRoute(false);
  }
};

  const showToast = (msg) => {
    if (!isMounted.current) return;
    setToast(msg);
    const t = setTimeout(() => {
      if (isMounted.current) setToast(null);
    }, 2800);
  };
  const handleAddressSearch = async () => {
  if (!addressSearch.trim()) return;
  setSearchLoading(true);
  setAddressError("");

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressSearch)}&format=json&limit=5&countrycodes=fr`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const data = await res.json();

    if (data.length === 0) {
      setAddressError("Aucune adresse trouvée");
      setAddressResults([]);
    } else {
      setAddressResults(data);
    }
  } catch (err) {
    setAddressError("Erreur lors de la recherche");
  } finally {
    setSearchLoading(false);
  }
};

const filtered = useMemo(() => containers.filter(c => {
  const matchSearch = `${c.type} ${c.zone}`.toLowerCase().includes(search.toLowerCase());
  const level = Number(c.fillLevel) || 0;
  if (filter === "ok" && level >= 50) return false;
  if (filter === "warning" && (level < 50 || level >= 80)) return false;
  if (filter === "critical" && level < 80) return false;
  return matchSearch;
}), [containers, search, filter]);

const selectAddress = (result) => {
  const lat = parseFloat(result.lat);
  const lon = parseFloat(result.lon);

  // Met à jour les coordonnées
  setMapClickCoords({ latitude: lat, longitude: lon });

  // Met à jour automatiquement le champ zone avec le nom de la ville
  const parts = result.display_name.split(',');
  setForm(prev => ({ ...prev, zone: parts[0].trim() }));

  // Vide les résultats
  setAddressResults([]);
  setAddressSearch("");
};
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    console.log("mapClickCoords:", mapClickCoords); // ← ajoutez ça
  console.log("editingContainer:", editingContainer);
  if (!mapClickCoords && !editingContainer) {
    showToast("⚠️ Veuillez sélectionner une position sur la carte ou via la recherche.");
    return;
  }
    try {
      const payload = { ...form, ...(mapClickCoords ? mapClickCoords : {}) };
      console.log("PAYLOAD ENVOYÉ:", JSON.stringify(payload));
      let res;
      if (editingContainer) {
        res = await API.put(`/containers/${editingContainer.id}`, payload);
        setContainers(prev => prev.map(c => c.id === editingContainer.id ? res.data : c));
        showToast("Container modifié !");
      } else {
        res = await API.post("/containers", payload);
        setContainers(prev => [...prev, res.data]);
        showToast("Container ajouté !");
      }
      setForm({ type: "", capacity: "", fillLevel: 0, zone: "" });
      setEditingContainer(null); setModalOpen(false); setMapClickCoords(null);
    } catch (err) { console.error(err); }
  };

const handleEdit = (c) => {
  setEditingContainer(c);
  setForm({ type: c.type, capacity: c.capacity, fillLevel: c.fillLevel, zone: c.zone });
  
  // ✅ Ajoutez ce log
  console.log("coordonnées du container à éditer:", c.latitude, c.longitude);
  
  if (c.latitude && c.longitude) {
    setMapClickCoords({ latitude: Number(c.latitude), longitude: Number(c.longitude) });
  } else {
    setMapClickCoords(null); // ← pas de coordonnées existantes
  }
  
  setSelectedContainer(null);
  setModalOpen(true);
};
  const handleDelete = (id) => {
    API.delete(`/containers/${id}`).then(() => {
      setContainers(prev => prev.filter(c => c.id !== id));
      setSelectedContainer(null);
      showToast("Container supprimé.");
    });
  };

  const handleLocate = (c) => {
    setSelectedContainer(c);
    document.getElementById("containers-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #d1d5db; font-family: 'Roboto', sans-serif; }
        @keyframes rowIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-300% center; } 100% { background-position:300% center; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes leaflet-ping {
          0% { transform: scale(0.5); opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .leaflet-container { font-family: 'Roboto', sans-serif !important; }
        .leaflet-div-icon { background: transparent !important; border: none !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(150deg,#f0fdf4 0%,#fafafa 50%,#f0fdf4 100%)", fontFamily: "'Roboto',sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, #bbf7d0 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.45 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#22c55e,#16a34a)", backgroundSize: "300% auto", animation: "shimmer 4s linear infinite" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1060, margin: "0 auto", padding: "48px 24px 64px" }}>

          {/* Header */}
          <div style={{ marginBottom: 36, opacity: in_?1:0, transform: in_?"none":"translateY(-10px)", transition: "all 0.65s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 11px", borderRadius: 99, background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "blink 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#15803d", letterSpacing: "0.12em", textTransform: "uppercase" }}>{containers.length} containers</span>
              </div>
            </div>
            <h1 style={{ fontFamily: "'Roboto',sans-serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1.1, marginBottom: 8 }}>
              Gestion des{" "}
              <span style={{ background: "linear-gradient(135deg,#15803d,#22c55e,#16a34a)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 4s linear infinite" }}>Containers</span>
            </h1>
            <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: "#6b7280" }}>
              Suivez le remplissage et la localisation de tous les containers
            </p>
          </div>
           <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[["all","Tous"],["ok","OK"],["warning","Attention"],["critical","Critique"]].map(([val,lab]) => (
                <FilterBtn key={val} active={filter===val} onClick={() => setFilter(val)} label={lab} />
              ))}
            </div>
            {/* Juste avant le bouton "Ajouter" existant */}
<button
  onClick={activeRoute ? () => setActiveRoute(null) : loadLatestRoute}
  disabled={loadingRoute}
  style={{
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 9,
    background: activeRoute ? "#f5f3ff" : "#fff",
    border: `1.5px solid ${activeRoute ? "#8b5cf6" : "#e5e7eb"}`,
    color: activeRoute ? "#7c3aed" : "#6b7280",
    fontFamily: "'Roboto',sans-serif", fontSize: 13,
    fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.color = "#7c3aed"; }}
  onMouseLeave={e => {
    if (!activeRoute) {
      e.currentTarget.style.borderColor = "#e5e7eb";
      e.currentTarget.style.color = "#6b7280";
    }
  }}
>
  {loadingRoute ? "⏳" : activeRoute ? "✕ Masquer tournée" : "🗺️ Voir tournée"}
</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SearchBox value={search} onChange={setSearch} />
              <button
                onClick={() => { setEditingContainer(null); setForm({ type:"",capacity:"",fillLevel:0,zone:"" }); setModalOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "#22c55e", border: "none", color: "#fff", fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(34,197,94,0.25)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background="#16a34a"; }} onMouseLeave={e => { e.currentTarget.style.background="#22c55e"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter
              </button>
            </div>
          </div>
 
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 20, color: "#9ca3af", fontWeight: 600 }}>Aucun container trouvé</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 18, marginBottom: 32 }}>
              {filtered.map((c, i) => (
                <ContainerCard key={c.id} container={c} index={i} onEdit={handleEdit} onDelete={handleDelete} onLocate={handleLocate} />
              ))}
            </div>
          )}
          {/* Map */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>Carte des containers</span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af" }}>Cliquez sur un ping pour les détails</span>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
              {[["#22c55e","< 50% — OK"],["#eab308","50–80% — Attention"],["#ef4444","> 80% — Critique"]].map(([color,label]) => (
                <div key={color} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}88` }} />
                  <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#6b7280" }}>{label}</span>
                </div>
              ))}
            </div>

            <div id="containers-map" style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", height: 420, position: "relative" }}>
              <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ width: "100%", height: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                <MapClickHandler onMapClick={handleMapClick} />         
                <MapFlyTo container={selectedContainer} />
                <PingMarkers containers={containers} selected={selectedContainer} onSelect={setSelectedContainer} />
                {activeRoute?.stops && (
                  <RoutePolyline stops={activeRoute.stops} depot={depot} />
                )}
              </MapContainer>
              <MapPopup container={selectedContainer} onClose={() => setSelectedContainer(null)} onEdit={handleEdit} />
            </div>

            {mapClickCoords && (
              <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#22c55e", marginTop: 6 }}>
                📍 Position sélectionnée : {mapClickCoords.latitude.toFixed(5)}, {mapClickCoords.longitude.toFixed(5)}
              </p>
            )}
          </div>
        </div>

  {modalOpen && (
  <Modal
    title={editingContainer ? "Modifier le container" : "Nouveau container"}
    onClose={() => { setModalOpen(false); setEditingContainer(null); }}
  >
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontFamily: "'Roboto',sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        🔍 Rechercher une adresse
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={addressSearch}
          onChange={e => setAddressSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
          placeholder="Ex: 15 rue des Trucheux, Lisses..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#f9fafb", fontFamily: "'Roboto',sans-serif", fontSize: 13, color: "#111827", outline: "none" }}
        />
        <button
          onClick={handleAddressSearch}
          disabled={searchLoading}
          style={{ padding: "10px 16px", borderRadius: 10, background: "#22c55e", border: "none", color: "#fff", fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {searchLoading ? "⏳" : "Chercher"}
        </button>
      </div>

      {addressError && (
        <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#ef4444", marginTop: 6 }}>
          {addressError}
        </p>
      )}

      {addressResults.length > 0 && (
        <div style={{ marginTop: 8, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {addressResults.map((result, i) => (
            <div
              key={i}
              onClick={() => selectAddress(result)}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < addressResults.length - 1 ? "1px solid #f3f4f6" : "none", fontFamily: "'Roboto',sans-serif", fontSize: 12, color: "#374151" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              📍 {result.display_name}
            </div>
          ))}
        </div>
      )}

      {mapClickCoords && (
        <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#22c55e", marginTop: 6 }}>
          ✅ Position : {mapClickCoords.latitude.toFixed(5)}, {mapClickCoords.longitude.toFixed(5)}
        </p>
      )}
      <p style={{ fontFamily: "'Roboto',sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
        💡 Vous pouvez aussi cliquer directement sur la carte pour positionner le container.
      </p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
      <Field label="Type" name="type" value={form.type} onChange={handleChange} />
      <Field label="Zone" name="zone" value={form.zone} onChange={handleChange} />
      <Field label="Capacité (L)" name="capacity" value={form.capacity} onChange={handleChange} type="number" />
      <Field label="Remplissage (%)" name="fillLevel" value={form.fillLevel} onChange={handleChange} type="number" />
    </div>

    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <button onClick={() => { setModalOpen(false); setEditingContainer(null); }}
        style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontFamily: "'Roboto',sans-serif", fontSize: 13, cursor: "pointer" }}>
        Annuler
      </button>
      <button onClick={handleSave}
        style={{ padding: "9px 22px", borderRadius: 9, background: "#22c55e", border: "none", color: "#fff", fontFamily: "'Roboto',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        {editingContainer ? "✎  Enregistrer" : "+  Créer"}
      </button>
    </div>
  </Modal>
)}
      {toast && <Toast message={toast} />}
      </div>
    </>
  );
}