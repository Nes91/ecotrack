import ReactDOM from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import socket from '../socket/socket';

// ── Compteur animé ────────────────────────────────────────────────────────────
function useCounter(target, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

const CARDS = [
  { key: "agents",       label: "Agents",       sub: "Utilisateurs actifs",  route: "/agents",       accent: "#16a34a", light: "#f0fdf4", border: "#bbf7d0", icon: "👷", tag: "Équipe" },
  { key: "containers",   label: "Conteneurs",   sub: "Unités déployées",     route: "/containers",   accent: "#0891b2", light: "#ecfeff", border: "#a5f3fc", icon: "🗑️", tag: "Parc" },
  { key: "tournees",     label: "Tournées",     sub: "Circuits planifiés",   route: "/tournees",     accent: "#7c3aed", light: "#faf5ff", border: "#ddd6fe", icon: "🚛", tag: "Logistique" },
  { key: "signalements", label: "Signalements", sub: "Incidents reportés",   route: "/signalements", accent: "#dc2626", light: "#fef2f2", border: "#fecaca", icon: "⚠️", tag: "Alertes" },
];

const TYPE_STYLE = {
  "Déchets sauvages":    { bg: "#fef9c3", color: "#854d0e", icon: "🗑️" },
  "Conteneur plein":     { bg: "#fee2e2", color: "#991b1b", icon: "📦" },
  "Déversement illégal": { bg: "#fce7f3", color: "#9d174d", icon: "☣️" },
  "Dégradation":         { bg: "#ede9fe", color: "#5b21b6", icon: "🔨" },
  "Autre":               { bg: "#f1f5f9", color: "#475569", icon: "📋" },
};
function typeBadge(type) {
  const s = TYPE_STYLE[type] || TYPE_STYLE["Autre"];
  return { ...s, label: type || "Autre" };
}

const STATUS_STYLE = {
  PENDING:     { bg: "#fef9c3", color: "#854d0e", label: "En attente" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af", label: "En cours" },
  RESOLVED:    { bg: "#dcfce7", color: "#166534", label: "Résolu" },
  REJECTED:    { bg: "#fee2e2", color: "#991b1b", label: "Rejeté" },
  // Anciens formats snake_case en fallback
  en_attente:  { bg: "#fef9c3", color: "#854d0e", label: "En attente" },
  en_cours:    { bg: "#dbeafe", color: "#1e40af", label: "En cours" },
  résolu:      { bg: "#dcfce7", color: "#166534", label: "Résolu" },
  rejeté:      { bg: "#fee2e2", color: "#991b1b", label: "Rejeté" },
};
function statusBadge(status) {
  return STATUS_STYLE[status] || { bg: "#f1f5f9", color: "#475569", label: status || "—" };
}

// ── Toast nouveaux signalements à la connexion ────────────────────────────────
function NewSignalementsToast({ count, onClose, onClick }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 10000,
      width: 340,
      background: "#fff",
      borderRadius: 18,
      border: "1.5px solid #fecaca",
      boxShadow: "0 12px 40px rgba(220,38,38,0.15)",
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(60px)",
      transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
      fontFamily: "'Roboto', sans-serif",
    }}>
      <div style={{ height: 4, background: "linear-gradient(90deg, #dc2626, #f87171)" }} />
      <div style={{ padding: "16px 18px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: "#fef2f2", border: "1.5px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
            Nouveaux signalements
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
            <span style={{ color: "#dc2626" }}>{count}</span> signalement{count > 1 ? "s" : ""} en attente de traitement
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClick} style={{
              flex: 1, padding: "8px", borderRadius: 9,
              border: "1.5px solid #fecaca", background: "#fef2f2",
              color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              Voir les signalements →
            </button>
            <button onClick={onClose} style={{
              padding: "8px 12px", borderRadius: 9,
              border: "1.5px solid #e5e7eb", background: "#fff",
              color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal assignation agent ───────────────────────────────────────────────────
function AssignAgentModal({ signalement, agents, onAssign, onClose }) {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleAssign = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    await onAssign(signalement.id || signalement._id, selectedAgent);
    setLoading(false);
    handleClose();
  };

  const nom = signalement.createdBy
    ? `${signalement.createdBy.firstName || ""} ${signalement.createdBy.lastName || signalement.createdBy.name || ""}`.trim()
    : "Inconnu";

  return ReactDOM.createPortal(
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: visible ? "rgba(15,23,42,0.5)" : "rgba(15,23,42,0)",
        backdropFilter: visible ? "blur(5px)" : "blur(0)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        transition: "all 0.28s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
          fontFamily: "'Roboto', sans-serif",
        }}
      >
        {/* Bande top */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />

        {/* Header */}
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>👷</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                  Assigner à un agent
                </div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  Signalement de <span style={{ color: "#16a34a" }}>{nom}</span>
                </h2>
              </div>
            </div>
            <button onClick={handleClose} style={{
              width: 30, height: 30, borderRadius: "50%",
              border: "1.5px solid #e2e8f0", background: "#fff",
              color: "#94a3b8", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Info signalement */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { icon: "🏷️", val: signalement.type || "—" },
              { icon: "📍", val: signalement.lieu || signalement.location?.address || "—" },
              { icon: "📅", val: signalement.createdAt ? new Date(signalement.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—" },
            ].map(({ icon, val }) => (
              <div key={val} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 20, padding: "4px 10px",
                fontSize: 12, fontWeight: 500, color: "#475569",
              }}>
                <span>{icon}</span><span>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sélecteur agent */}
        <div style={{ padding: "20px 24px" }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
            Choisir un agent
          </label>

          {agents.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 13, background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0" }}>
              Aucun agent disponible
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
              {agents.map(agent => {
                const agentId = agent.id || agent._id;
                const agentName = `${agent.firstName || ""} ${agent.lastName || agent.name || ""}`.trim();
                const isSelected = selectedAgent === agentId;
                return (
                  <div
                    key={agentId}
                    onClick={() => setSelectedAgent(agentId)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${isSelected ? "#bbf7d0" : "#e5e7eb"}`,
                      background: isSelected ? "#f0fdf4" : "#fff",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: isSelected ? "#16a34a" : "#e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700,
                      color: isSelected ? "#fff" : "#6b7280",
                      flexShrink: 0, transition: "all 0.15s ease",
                    }}>
                      {agentName.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#15803d" : "#111827" }}>{agentName || "Agent sans nom"}</div>
                      {agent.email && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{agent.email}</div>}
                    </div>
                    {isSelected && (
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#16a34a", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 11, flexShrink: 0,
                      }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button onClick={handleClose} style={{
            flex: 1, padding: "12px",
            borderRadius: 12, border: "1.5px solid #e5e7eb",
            background: "#f9fafb", color: "#374151",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Annuler
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedAgent || loading}
            style={{
              flex: 2, padding: "12px",
              borderRadius: 12, border: "none",
              background: !selectedAgent
                ? "#e5e7eb"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: !selectedAgent ? "#9ca3af" : "#fff",
              fontSize: 14, fontWeight: 700,
              cursor: !selectedAgent ? "not-allowed" : "pointer",
              boxShadow: selectedAgent ? "0 4px 14px rgba(34,197,94,0.35)" : "none",
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                Assignation…
              </>
            ) : "👷 Assigner l'agent"}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}

// ── SignalementsPanel ─────────────────────────────────────────────────────────
function SignalementsPanel({ scrollRef }) {
  const [items, setItems]             = useState([]);
  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("tous");
  const [expanded, setExpanded]       = useState(null);
  const [assignModal, setAssignModal] = useState(null); // signalement en cours d'assignation
  const [assignSuccess, setAssignSuccess] = useState(null);

  useEffect(() => {
    // Charger signalements
    API.get("/signalements")
      .then(r => setItems(Array.isArray(r.data) ? r.data : r.data.signalements || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Charger la liste des agents
    API.get("/agents")
      .then(r => setAgents(Array.isArray(r.data) ? r.data : r.data.agents || []))
      .catch(() => setAgents([]));
  }, []);

  const handleAssign = async (signalementId, agentId) => {
    try {
      await API.put(`/signalements/${signalementId}/assigner`, { agentId });
      // Mettre à jour localement
      setItems(prev => prev.map(s =>
        (s.id || s._id) === signalementId
          ? { ...s, assignedTo: agents.find(a => (a.id || a._id) === agentId), status: s.status === "PENDING" ? "IN_PROGRESS" : s.status }
          : s
      ));
      const agent = agents.find(a => (a.id || a._id) === agentId);
      const agentName = agent ? `${agent.firstName || ""} ${agent.lastName || agent.name || ""}`.trim() : "l'agent";
      setAssignSuccess(`✅ Signalement assigné à ${agentName}`);
      setTimeout(() => setAssignSuccess(null), 4000);
    } catch (err) {
      console.error("Erreur assignation:", err);
    }
  };

  const filtered = items.filter(s => {
    const matchFilter = filter === "tous" || s.status === filter || s.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (s.createdBy?.firstName + " " + s.createdBy?.lastName).toLowerCase().includes(q)
      || (s.createdBy?.name || "").toLowerCase().includes(q)
      || (s.type || "").toLowerCase().includes(q)
      || (s.message || s.description || "").toLowerCase().includes(q)
      || (s.lieu || s.location?.address || "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const accent = "#dc2626";

  return (
    <>
      <div
        ref={scrollRef}
        style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #fecaca", boxShadow: "0 4px 24px rgba(220,38,38,0.07)", overflow: "hidden", marginTop: 32 }}
      >
        {/* Header */}
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #fef2f2", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚠️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827", fontFamily: "'Roboto', sans-serif" }}>Signalements</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", fontFamily: "'Roboto', sans-serif" }}>{items.length} signalement{items.length !== 1 ? "s" : ""} au total</p>
            </div>
          </div>
          {/* Search */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'Roboto', sans-serif", color: "#374151", background: "#f9fafb", outline: "none", width: 200 }}
            />
          </div>
        </div>

        {/* Notification assignation */}
        {assignSuccess && (
          <div style={{ margin: "12px 28px 0", padding: "12px 16px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 13, fontWeight: 600 }}>
            {assignSuccess}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, padding: "12px 28px", borderBottom: "1px solid #fef2f2", overflowX: "auto" }}>
          {[["tous","Tous"],["PENDING","En attente"],["IN_PROGRESS","En cours"],["RESOLVED","Résolu"],["REJECTED","Rejeté"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: "5px 14px", borderRadius: 99, border: "1px solid",
              borderColor: filter === val ? accent : "#e5e7eb",
              background: filter === val ? "#fef2f2" : "#fff",
              color: filter === val ? accent : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Roboto', sans-serif", whiteSpace: "nowrap", flexShrink: 0,
            }}>{lbl}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #fecaca", borderTopColor: accent, animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
              Chargement…
            </div>
          )}
          {error && <div style={{ padding: 24, textAlign: "center", color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Aucun signalement trouvé</div>
          )}

          {!loading && !error && filtered.map((s, i) => {
            const type   = typeBadge(s.type);
            const status = statusBadge(s.status);
            const nom    = s.createdBy ? `${s.createdBy.firstName || ""} ${s.createdBy.lastName || s.createdBy.name || ""}`.trim() : "Inconnu";
            const email  = s.createdBy?.email || "";
            const lieu   = s.lieu || s.location?.address || s.adresse || "—";
            const msg    = s.message || s.description || "—";
            const date   = s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
            const key    = s._id || s.id || i;
            const isOpen = expanded === key;
            const assignedAgent = s.assignedTo
              ? `${s.assignedTo.firstName || ""} ${s.assignedTo.lastName || s.assignedTo.name || ""}`.trim()
              : null;

            return (
              <div key={key} style={{ borderBottom: "1px solid #fef2f2", background: isOpen ? "#fff8f8" : "#fff", transition: "background 0.15s" }}>
                {/* Row */}
                <div onClick={() => setExpanded(isOpen ? null : key)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 28px", cursor: "pointer" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: type.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{type.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "'Roboto', sans-serif" }}>{nom}</span>
                      {email && <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Roboto', sans-serif" }}>{email}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: type.bg, color: type.color, fontFamily: "'Roboto', sans-serif" }}>{type.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: status.bg, color: status.color, fontFamily: "'Roboto', sans-serif" }}>{status.label}</span>
                      {assignedAgent && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontFamily: "'Roboto', sans-serif" }}>
                          👷 {assignedAgent}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "'Roboto', sans-serif", display: "flex", alignItems: "center", gap: 3 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {lieu}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280", fontFamily: "'Roboto', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 480 }}>{msg}</p>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {date && <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Roboto', sans-serif" }}>{date}</span>}
                    <svg style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none", color: "#9ca3af" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: "0 28px 20px 80px", display: "flex", flexDirection: "column", gap: 12, animation: "fadeUp 0.2s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      {[
                        { label: "Déclarant", value: nom },
                        { label: "Email", value: email || "—" },
                        { label: "Type", value: `${type.icon} ${type.label}` },
                        { label: "Statut", value: status.label },
                        { label: "Lieu", value: lieu },
                        { label: "Date", value: date || "—" },
                        { label: "Agent assigné", value: assignedAgent || "Non assigné" },
                        ...(s.phone || s.createdBy?.phone ? [{ label: "Téléphone", value: s.phone || s.createdBy?.phone }] : []),
                        ...(s.priorite || s.priority ? [{ label: "Priorité", value: s.priorite || s.priority }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Roboto', sans-serif", marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", fontFamily: "'Roboto', sans-serif" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Message complet */}
                    <div style={{ background: "#fef2f2", borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${accent}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Roboto', sans-serif", marginBottom: 6 }}>Message complet</div>
                      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6, fontFamily: "'Roboto', sans-serif" }}>{msg}</p>
                    </div>

                    {/* Photo */}
                    {(s.photo || s.imageUrl || s.image) && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Roboto', sans-serif", marginBottom: 6 }}>Photo</div>
                        <img src={s.photo || s.imageUrl || s.image} alt="Signalement" style={{ maxWidth: 280, borderRadius: 10, border: "1px solid #fecaca", objectFit: "cover" }} />
                      </div>
                    )}

                    {/* Bouton assigner */}
                    {s.status !== "RESOLVED" && s.status !== "REJECTED" && (
                      <button
                        onClick={e => { e.stopPropagation(); setAssignModal(s); }}
                        style={{
                          alignSelf: "flex-start",
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 18px", borderRadius: 10, border: "none",
                          background: assignedAgent
                            ? "linear-gradient(135deg, #0891b2, #0e7490)"
                            : "linear-gradient(135deg, #22c55e, #16a34a)",
                          color: "#fff", fontSize: 13, fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: assignedAgent
                            ? "0 4px 14px rgba(8,145,178,0.35)"
                            : "0 4px 14px rgba(34,197,94,0.35)",
                        }}
                      >
                        👷 {assignedAgent ? "Réassigner un agent" : "Assigner à un agent"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "12px 28px", borderTop: "1px solid #fef2f2", display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'Roboto', sans-serif" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Modal assignation */}
      {assignModal && (
        <AssignAgentModal
          signalement={assignModal}
          agents={agents}
          onAssign={handleAssign}
          onClose={() => setAssignModal(null)}
        />
      )}
    </>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ card, value, index }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const count = useCounter(mounted ? value : null, 1600);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120 + index * 100);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onClick={() => navigate(card.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? card.light : "#fff",
        border: `1.5px solid ${hovered ? card.border : "#f1f5f9"}`,
        borderRadius: 20, padding: "32px 28px", cursor: "pointer",
        position: "relative", overflow: "hidden",
        opacity: mounted ? 1 : 0,
        transform: mounted ? (hovered ? "translateY(-6px)" : "translateY(0)") : "translateY(20px)",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: hovered ? `0 20px 48px ${card.accent}18, 0 4px 16px rgba(0,0,0,0.06)` : "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: hovered ? `linear-gradient(90deg, ${card.accent}, ${card.accent}88)` : "transparent", transition: "all 0.3s ease", borderRadius: "20px 20px 0 0" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: card.light, border: `1px solid ${card.border}`, marginBottom: 20 }}>
        <span style={{ fontSize: 14 }}>{card.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: card.accent, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Roboto', sans-serif" }}>{card.tag}</span>
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, color: "#0f172a", lineHeight: 1, marginBottom: 8, fontFamily: "'Roboto', sans-serif", letterSpacing: "-2px" }}>{count.toLocaleString()}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 4, fontFamily: "'Roboto', sans-serif" }}>{card.label}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}>{card.sub}</div>
      <div style={{ position: "absolute", bottom: 24, right: 24, width: 32, height: 32, borderRadius: "50%", background: hovered ? card.accent : "#f8fafc", border: `1px solid ${hovered ? card.accent : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", color: hovered ? "#fff" : "#94a3b8" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </div>
  );
}

// ── AdminDashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]               = useState(null);
  const [error, setError]               = useState(null);
  const [visible, setVisible]           = useState(false);
  const [notification, setNotification] = useState(null);
  const [newSignalements, setNewSignalements] = useState(null); // toast login

  const signalementsPanelRef = useState(null);
  const panelRef = signalementsPanelRef[0]; // ref DOM pour scroll

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── Réception temps réel : mission terminée ──────────────────────────────
  useEffect(() => {
    socket.on('mission_terminee', (data) => {
      setNotification(data.message);
      setTimeout(() => setNotification(null), 5000);
    });
    return () => socket.off('mission_terminee');
  }, []);

  // ── Chargement du dashboard + toast signalements à la connexion ──────────
  useEffect(() => {
    setTimeout(() => setVisible(true), 60);

    API.get("/dashboard/admin")
      .then((r) => {
        setStats(r.data);
        // Si des signalements sont en attente, afficher le toast
        const pending = r.data?.signalements_pending ?? r.data?.signalements ?? 0;
        if (pending > 0) {
          setNewSignalements(pending);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  const scrollToSignalements = () => {
    setNewSignalements(null);
    document.getElementById("signalements-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #f0f9f4 50%, #fafaf8 100%)", fontFamily: "'Roboto', sans-serif", position: "relative" }}>

        {/* Dot pattern */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(#16a34a12 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "52px 28px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 56, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(-12px)", transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 6px #16a34a", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b", letterSpacing: "0.04em", textTransform: "capitalize" }}>{dateStr}</span>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1.05, margin: "0 0 14px" }}>
              Tableau de{" "}
              <span style={{ color: "#16a34a", position: "relative", display: "inline-block" }}>
                bord
                <span style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80)", borderRadius: 99 }} />
              </span>
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", fontWeight: 400, margin: 0, letterSpacing: "0.01em" }}>
              Vue d'ensemble de la plateforme EcoTrack — Administration
            </p>
            <div style={{ marginTop: 28, height: 1, background: "linear-gradient(90deg, #16a34a30, #e2e8f0, transparent)" }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "14px 20px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, marginBottom: 32 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Notification mission terminée */}
          {notification && (
            <div style={{ padding: "14px 20px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 14, fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              ✅ {notification}
            </div>
          )}

          {/* Skeleton loader */}
          {!stats && !error && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ height: 180, borderRadius: 20, background: "linear-gradient(90deg, #f1f5f9 25%, #e8f0fe 50%, #f1f5f9 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.6s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {/* Stat cards */}
          {stats && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 32 }}>
                {CARDS.map((card, i) => (
                  <StatCard key={card.key} card={card} value={stats[card.key] ?? 0} index={i} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderRadius: 14, background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", animation: "fadeUp 0.6s ease both", animationDelay: "0.5s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🌿</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>Cliquez sur une carte pour accéder à la section</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", letterSpacing: "0.08em", textTransform: "uppercase" }}>EcoTrack · Admin</span>
              </div>
            </>
          )}

          {/* Panel signalements */}
          <div id="signalements-panel">
            <SignalementsPanel />
          </div>
        </div>
      </div>

      {/* Toast nouveaux signalements à la connexion */}
      {newSignalements !== null && (
        <NewSignalementsToast
          count={newSignalements}
          onClose={() => setNewSignalements(null)}
          onClick={scrollToSignalements}
        />
      )}
    </>
  );
}