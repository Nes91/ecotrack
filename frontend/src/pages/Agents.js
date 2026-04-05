import { useState, useEffect } from "react";
import API from "../api/api";

const PER_PAGE = 8;

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ firstName, lastName, size = 38 }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const hue = ((firstName?.charCodeAt(0) || 0) * 37 + (lastName?.charCodeAt(0) || 0) * 19) % 50;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, hsl(${128 + hue},45%,78%), hsl(${138 + hue},55%,68%))`,
      border: "1.5px solid rgba(34,197,94,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Roboto', sans-serif",
      fontSize: size * 0.38, fontWeight: 700,
      color: "hsl(140,45%,22%)",
      flexShrink: 0, letterSpacing: "0.03em",
    }}>
      {initials}
    </div>
  );
}

// ── Role badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const s = {
    AGENT:   { bg: "#dcfce7", border: "#bbf7d0", text: "#15803d" },
    MANAGER: { bg: "#d1fae5", border: "#a7f3d0", text: "#065f46" },
  }[role] || { bg: "#dcfce7", border: "#bbf7d0", text: "#15803d" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: s.bg, border: `1px solid ${s.border}`,
      fontFamily: "'Roboto', sans-serif", fontSize: 10, fontWeight: 600,
      color: s.text, letterSpacing: "0.1em", textTransform: "uppercase",
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: s.text }} />
      {role}
    </span>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px", borderRadius: 10,
          background: focused ? "#fff" : "#f9fafb",
          border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`,
          color: "#111827",
          fontFamily: "'Roboto', sans-serif", fontSize: 14, fontWeight: 400,
          outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.1)" : "0 1px 2px rgba(0,0,0,0.04)",
          transition: "all 0.2s",
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <select
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px", borderRadius: 10,
          background: focused ? "#fff" : "#f9fafb",
          border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`,
          color: "#111827",
          fontFamily: "'Roboto', sans-serif", fontSize: 14,
          outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.1)" : "0 1px 2px rgba(0,0,0,0.04)",
          transition: "all 0.2s", cursor: "pointer",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <PBtn disabled={page === 1} onClick={() => onChange(page - 1)} label="←" />
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <PBtn key={p} active={p === page} onClick={() => onChange(p)} label={p} />
      ))}
      <PBtn disabled={page === pages} onClick={() => onChange(page + 1)} label="→" />
    </div>
  );
}

function PBtn({ onClick, label, active, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, borderRadius: 8,
        border: active ? "1.5px solid #22c55e" : "1.5px solid #e5e7eb",
        background: active ? "#22c55e" : hov ? "#f0fdf4" : "#fff",
        color: active ? "#fff" : disabled ? "#d1d5db" : "#6b7280",
        fontFamily: "'Roboto', sans-serif", fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: active ? "0 2px 8px rgba(34,197,94,0.3)" : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {label}
    </button>
  );
}

// ── Action button ──────────────────────────────────────────────────────────
function ActionBtn({ onClick, color, hoverBg, title, icon, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, borderRadius: 8,
        border: `1.5px solid ${hov ? color + "60" : "#e5e7eb"}`,
        background: hov ? hoverBg : "#fff",
        color: hov ? color : "#d1d5db",
        cursor: loading ? "wait" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s",
        boxShadow: hov ? `0 2px 8px ${color}25` : "none",
      }}
    >
      {loading
        ? <div style={{ width: 11, height: 11, borderRadius: "50%", border: `1.5px solid ${color}44`, borderTop: `1.5px solid ${color}`, animation: "spin 0.8s linear infinite" }} />
        : icon}
    </button>
  );
}

// ── Agent Row ──────────────────────────────────────────────────────────────
function AgentRow({ agent, index, onEdit, onDelete, deleting }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderBottom: "1px solid #f3f4f6",
        background: hov ? "#f0fdf4" : "#fff",
        transition: "background 0.15s",
        animation: "rowIn 0.4s ease both",
        animationDelay: `${index * 45}ms`,
      }}
    >
      <td style={{ padding: "13px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar firstName={agent.firstName} lastName={agent.lastName} />
          <div>
            <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
              {agent.firstName} {agent.lastName}
            </div>
            <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2, letterSpacing: "0.02em" }}>
              {agent.email || "—"}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: "13px 20px" }}><RoleBadge role={agent.role} /></td>
      <td style={{ padding: "13px 20px" }}>
        <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: "#d1d5db", letterSpacing: "0.08em" }}>
          #{String(agent.id).padStart(4, "0")}
        </span>
      </td>
      <td style={{ padding: "13px 20px", textAlign: "right" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <ActionBtn onClick={() => onEdit(agent)} color="#22c55e" hoverBg="#f0fdf4" title="Modifier"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
          />
          <ActionBtn onClick={() => onDelete(agent.id)} color="#ef4444" hoverBg="#fef2f2" title="Supprimer" loading={deleting}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
          />
        </div>
      </td>
    </tr>
  );
}

// ── Submit ─────────────────────────────────────────────────────────────────
function SubmitBtn({ loading, editing }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "10px 24px", borderRadius: 10,
        background: hov ? "#16a34a" : "#22c55e",
        border: "none", color: "#fff",
        fontFamily: "'Roboto', sans-serif", fontSize: 13, fontWeight: 600,
        letterSpacing: "0.04em",
        cursor: loading ? "wait" : "pointer",
        boxShadow: hov ? "0 4px 16px rgba(34,197,94,0.35)" : "0 2px 8px rgba(34,197,94,0.2)",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", gap: 8,
      }}
    >
      {loading
        ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)", borderTop: "1.5px solid #fff", animation: "spin 0.8s linear infinite" }} />En cours...</>
        : editing ? "✎  Enregistrer" : "+  Ajouter l'agent"
      }
    </button>
  );
}

// ── Search ─────────────────────────────────────────────────────────────────
function SearchBox({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <svg style={{ position: "absolute", left: 11, pointerEvents: "none", color: focused ? "#22c55e" : "#9ca3af", transition: "color 0.2s" }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Rechercher..."
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
          borderRadius: 9, width: 200,
          background: focused ? "#fff" : "#f9fafb",
          border: `1.5px solid ${focused ? "#22c55e" : "#e5e7eb"}`,
          color: "#111827", fontFamily: "'Roboto', sans-serif", fontSize: 13,
          outline: "none", transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
        }}
      />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", role: "AGENT", email: "", password: "" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [in_, setIn] = useState(false);

  useEffect(() => { setTimeout(() => setIn(true), 60); }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try { const res = await API.get("/agents"); setAgents(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);

  const filtered = agents.filter(a =>
    `${a.firstName} ${a.lastName} ${a.role}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = editingId
  ? { firstName: form.firstName, lastName: form.lastName, role: form.role }
  : { firstName: form.firstName, lastName: form.lastName, role: form.role, email: form.email, password: form.password };
      if (editingId) await API.put(`/agents/${editingId}`, payload);
      else await API.post("/agents", payload);
setForm({ firstName: agents.firstName, lastName: agents.lastName, role: agents.role, email: "", password: "" });
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet agent ?")) return;
    setDeleteId(id);
    try { await API.delete(`/agents/${id}`); fetchAgents(); }
    catch (err) { console.error(err); }
    finally { setDeleteId(null); }
  };

  const handleEdit = (agent) => {
    setEditingId(agent.id);
    setForm({ firstName: agent.firstName, lastName: agent.lastName, role: agent.role });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #d1d5db; font-family: 'Roboto', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rowIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-300% center; } 100% { background-position:300% center; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(150deg, #f0fdf4 0%, #fafafa 50%, #f0fdf4 100%)",
        fontFamily: "'Roboto', sans-serif",
        position: "relative",
      }}>
        {/* Dot pattern */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"radial-gradient(circle, #bbf7d0 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.45 }} />

        {/* Top shimmer bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a)", backgroundSize:"300% auto", animation:"shimmer 4s linear infinite" }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:1060, margin:"0 auto", padding:"48px 24px 64px" }}>

          {/* Header */}
          <div style={{ marginBottom:36, opacity:in_?1:0, transform:in_?"none":"translateY(-10px)", transition:"all 0.65s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 11px", borderRadius:99, background:"#dcfce7", border:"1px solid #bbf7d0" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e", animation:"blink 2s ease-in-out infinite" }} />
                <span style={{ fontFamily:"'Roboto', sans-serif", fontSize:10, fontWeight:600, color:"#15803d", letterSpacing:"0.12em", textTransform:"uppercase" }}>
                  {agents.length} agents enregistrés
                </span>
              </div>
            </div>

            <h1 style={{ fontFamily:"'Roboto', sans-serif", fontSize:"clamp(30px,4vw,48px)", fontWeight:700, color:"#111827", letterSpacing:"-0.3px", lineHeight:1.1, marginBottom:8 }}>
              Gestion des{" "}
              <span style={{ background:"linear-gradient(135deg, #15803d, #22c55e, #16a34a)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"shimmer 4s linear infinite" }}>
                Agents
              </span>
            </h1>
            <p style={{ fontFamily:"'Roboto', sans-serif", fontSize:13, color:"#6b7280", fontWeight:400, letterSpacing:"0.01em" }}>
              Ajoutez, modifiez et gérez les agents du système EcoTrack
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background:"#fff", borderRadius:18,
            border:`1.5px solid ${editingId ? "#86efac" : "#e5e7eb"}`,
            boxShadow: editingId ? "0 4px 24px rgba(34,197,94,0.1)" : "0 4px 20px rgba(0,0,0,0.05)",
            padding:"24px", marginBottom:22,
            transition:"all 0.3s", animation:"slideDown 0.5s ease both",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:32, height:32, borderRadius:9, background: editingId?"#dcfce7":"#f0fdf4", border:`1px solid ${editingId?"#86efac":"#bbf7d0"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {editingId
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }
                </div>
                <span style={{ fontFamily:"'Roboto', sans-serif", fontSize:17, fontWeight:600, color:"#374151" }}>
                  {editingId ? "Modifier l'agent" : "Nouvel agent"}
                </span>
              </div>
              {editingId && (
                <button onClick={() => { setEditingId(null); setForm({ firstName:"", lastName:"", role:"AGENT" }); }}
                  style={{ fontFamily:"'Roboto', sans-serif", fontSize:12, color:"#9ca3af", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6 }}
                  onMouseEnter={e => e.currentTarget.style.color="#374151"}
                  onMouseLeave={e => e.currentTarget.style.color="#9ca3af"}
                >
                  Annuler ✕
                </button>
              )}
            </div>

<form onSubmit={handleSubmit}>
  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:14, marginBottom:18 }}>
    <Field label="Prénom" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Jean" />
    <Field label="Nom" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Dupont" />
    <SelectField label="Rôle" value={form.role} onChange={e => setForm({...form, role: e.target.value})}
      options={[{value:"AGENT", label:"Agent"}, {value:"MANAGER", label:"Manager"}]} />

    {!editingId && (
      <>
        <Field
          label="Email"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          placeholder="jean.dupont@ecotrack.fr"
        />
        <Field
          label="Mot de passe"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          placeholder="Min. 6 caractères"
          type="password"
        />
      </>
    )}
  </div>
  <SubmitBtn loading={submitting} editing={!!editingId} />
</form>
          </div>

          {/* Table card */}
          <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", overflow:"hidden" }}>

            {/* Toolbar */}
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontFamily:"'Roboto', sans-serif", fontSize:18, fontWeight:700, color:"#111827" }}>
                  Tous les agents
                </span>
                <span style={{ fontFamily:"'Roboto', sans-serif", fontSize:11, color:"#9ca3af", fontWeight:400 }}>
                  · {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
              <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} />
            </div>

            {/* Table */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
                    {[["Agent","left"],["Rôle","left"],["ID","left"],["Actions","right"]].map(([h,align]) => (
                      <th key={h} style={{ padding:"10px 20px", textAlign:align, fontFamily:"'Roboto', sans-serif", fontSize:10, fontWeight:600, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={4} style={{ padding:"56px", textAlign:"center" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", border:"2px solid #dcfce7", borderTop:"2px solid #22c55e", animation:"spin 0.8s linear infinite" }} />
                        <span style={{ fontFamily:"'Roboto', sans-serif", fontSize:12, color:"#9ca3af" }}>Chargement...</span>
                      </div>
                    </td></tr>
                  )}
                  {!loading && paginated.length === 0 && (
                    <tr><td colSpan={4} style={{ padding:"56px", textAlign:"center" }}>
                      <p style={{ fontFamily:"'Roboto', sans-serif", fontSize:18, color:"#9ca3af", fontWeight:600 }}>Aucun agent trouvé</p>
                    </td></tr>
                  )}
                  {!loading && paginated.map((agent, i) => (
                    <AgentRow key={agent.id} agent={agent} index={i} onEdit={handleEdit} onDelete={handleDelete} deleting={deleteId === agent.id} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PER_PAGE && (
              <div style={{ padding:"14px 20px", borderTop:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <span style={{ fontFamily:"'Roboto', sans-serif", fontSize:11, color:"#9ca3af" }}>
                  Page {page} / {Math.ceil(filtered.length / PER_PAGE)}
                </span>
                <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}