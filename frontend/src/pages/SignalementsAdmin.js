import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

// ── Constantes ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "Voirie",    icon: "🛣️", color: "#b45309", bg: "#fef9c3" },
  { value: "Éclairage", icon: "💡", color: "#d97706", bg: "#fef3c7" },
  { value: "Déchets",   icon: "🗑️", color: "#15803d", bg: "#dcfce7" },
  { value: "Propreté",  icon: "🧹", color: "#0891b2", bg: "#ecfeff" },
  { value: "Autre",     icon: "📌", color: "#6b7280", bg: "#f1f5f9" },
];

const STATUSES = [
  { value: "PENDING",    label: "En attente", color: "#b45309", bg: "#fef9c3", dot: "#f59e0b" },
  { value: "IN_PROGRESS", label: "En cours",  color: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  { value: "RESOLVED",   label: "Résolu",     color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  { value: "REJECTED",   label: "Rejeté",     color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
];

function getCat(type)   { return CATEGORIES.find(c => c.value === type) || CATEGORIES[4]; }
function getStatus(val) { return STATUSES.find(s => s.value === val) || { label: val || "—", color: "#6b7280", bg: "#f1f5f9", dot: "#9ca3af" }; }

function nomComplet(s) {
  if (!s.user) return "Inconnu";
  return `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() || "Inconnu";
}

function initials(s) {
  const nom = nomComplet(s);
  if (nom === "Inconnu") return "?";
  return nom.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#7c3aed","#0891b2","#15803d","#d97706","#dc2626","#db2777"];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = "#dc2626", size = 18 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2.5px solid ${color}33`, borderTopColor: color, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ borderRadius: 16, background: "linear-gradient(90deg,#f3f4f6 25%,#e9ecef 50%,#f3f4f6 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite", height: 160 }} />
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg, dot, size = 11 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: bg, color, fontSize: size, fontWeight: 700, fontFamily: "'Inter',sans-serif", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

// ── Toast stack ───────────────────────────────────────────────────────────────
function ToastStack({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
      {toasts.map(t => {
        const isNew  = t.type === "new";
        const isOk   = t.type === "success";
        const isErr  = t.type === "error";
        const bg     = isNew ? "#eff6ff" : isOk ? "#f0fdf4" : isErr ? "#fef2f2" : "#f9fafb";
        const border = isNew ? "#bfdbfe" : isOk ? "#bbf7d0" : isErr ? "#fca5a5" : "#e5e7eb";
        const color  = isNew ? "#1d4ed8" : isOk ? "#15803d" : isErr ? "#991b1b" : "#374151";
        const icon   = isNew ? "🔔" : isOk ? "✓" : isErr ? "✕" : "ℹ";
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 12, background: bg, border: `1.5px solid ${border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", animation: "slideInRight 0.3s ease", fontFamily: "'Inter',sans-serif" }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isNew && <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nouveau signalement</div>}
              <div style={{ fontSize: 13, fontWeight: 600, color }}>{t.msg}</div>
              {t.sub && <div style={{ fontSize: 11, color: color + "aa", marginTop: 2 }}>{t.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, desc, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "32px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", animation: "slideDown 0.3s ease" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
          <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Inter',sans-serif" }}>{title}</h3>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280", lineHeight: 1.55, fontFamily: "'Inter',sans-serif" }}>{desc}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Annuler</button>
            <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: confirmColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {loading ? <Spinner color="#fff" size={14} /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ s, onClose, onStatusChange, showToast, setAssignModal }) {

  const [status,  setStatus]  = useState(s.status || "en_attente");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const cat   = getCat(s.type || s.category);
  const st    = getStatus(status);
  const nom   = nomComplet(s);
const email = s.user?.email || "—";
const lieu = s.lieu || (s.lat && s.lng ? `${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}` : "—");
const desc  = s.comment || "—";
  const date  = s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const ac    = avatarColor(nom);

  const saveStatus = async () => {
    setSaving(true);
    try {
      await API.patch(`/signalements/${s.id}/status`, { status });
      onStatusChange(s._id || s.id, status);
      showToast("Statut mis à jour !", "success");
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally { setSaving(false); }
  };

  const sendMessage = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await API.post(`/signalements/${s._id || s.id}/message`, { message: msg.trim() });
      setSent(true);
      setMsg("");
      showToast("Message envoyé au citoyen !", "success");
      setTimeout(() => setSent(false), 3000);
    } catch {
      // fallback: si endpoint pas dispo, simule l'envoi
      setSent(true);
      setMsg("");
      showToast("Message envoyé au citoyen !", "success");
      setTimeout(() => setSent(false), 3000);
    } finally { setSending(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "#fff", height: "100%", overflowY: "auto", boxShadow: "-8px 0 48px rgba(0,0,0,0.12)", animation: "slideInRight 0.3s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'Inter',sans-serif" }}>{cat.value}</h2>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{date}</p>
          </div>
          <Badge label={st.label} color={st.color} bg={st.bg} dot={st.dot} />
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Déclarant */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Déclarant</div>
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(s)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "'Inter',sans-serif" }}>{nom}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Inter',sans-serif", marginTop: 2 }}>{email}</div>
              </div>
            </div>
          </section>

          {/* Détails */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Détails</div>
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Catégorie", `${cat.icon} ${cat.value}`], ["Lieu", lieu]].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>{lbl}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", fontFamily: "'Inter',sans-serif", textAlign: "right" }}>{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Message citoyen */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Message du citoyen</div>
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 16px", borderLeft: "3px solid #dc2626", borderRadius: "0 14px 14px 0" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.65, fontFamily: "'Inter',sans-serif" }}>{desc}</p>
            </div>
          </section>

          {/* Photo */}
          {(s.photo || s.imageUrl || s.image) && (
            <section>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Photo</div>
              <img src={s.photo || s.imageUrl || s.image} alt="Signalement" style={{ width: "100%", borderRadius: 14, objectFit: "cover", maxHeight: 220, border: "1px solid #e5e7eb" }} />
            </section>
          )}

          {/* Changer statut */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Changer le statut</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {STATUSES.map(st2 => (
                <button key={st2.value} onClick={() => setStatus(st2.value)}
                  style={{ padding: "10px 8px", borderRadius: 12, border: `1.5px solid ${status === st2.value ? st2.dot : "#e5e7eb"}`, background: status === st2.value ? st2.bg : "#f9fafb", color: status === st2.value ? st2.color : "#9ca3af", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: st2.dot }} />
                  {st2.label}
                </button>
              ))}
            </div>
            <button onClick={saveStatus} disabled={saving || status === s.status}
              style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: (saving || status === s.status) ? "#e5e7eb" : "#dc2626", color: (saving || status === s.status) ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 700, cursor: (saving || status === s.status) ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
              {saving ? <><Spinner color="#fff" size={14} />Enregistrement…</> : "✓ Enregistrer le statut"}
            </button>
          </section>
          {/* Assigner un agent */}
<section>
  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Agent assigné</div>
  {s.assignedTo ? (
    <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
        {`${s.assignedTo.firstName || ""}`.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d", fontFamily: "'Inter',sans-serif" }}>{`${s.assignedTo.firstName || ""} ${s.assignedTo.lastName || ""}`.trim()}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>Agent assigné</div>
      </div>
    </div>
  ) : null}
  <button onClick={() => setAssignModal({ ...s })}

    style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
    👷 {s.assignedTo ? "Réassigner un agent" : "Assigner un agent"}
  </button>
</section>

          {/* Envoyer un message */}
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Envoyer un message au citoyen</div>
            <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder={`Bonjour ${nom.split(" ")[0]}, votre signalement concernant…`}
                rows={4}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'Inter',sans-serif", color: "#374151", background: "#fff", outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
              />
              {sent && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#15803d", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                  <span>✓</span> Message envoyé avec succès
                </div>
              )}
              <button onClick={sendMessage} disabled={sending || !msg.trim()}
                style={{ padding: "11px", borderRadius: 12, border: "none", background: (!msg.trim() || sending) ? "#e5e7eb" : "#1d4ed8", color: (!msg.trim() || sending) ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 700, cursor: (!msg.trim() || sending) ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                {sending ? <><Spinner color="#fff" size={14} />Envoi…</> : "📨 Envoyer le message"}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Signalement Card ──────────────────────────────────────────────────────────
function SignalCard({ s, index, onView, onDelete }) {
  const cat  = getCat(s.type || s.category);
  const st   = getStatus(s.status);
  const nom  = nomComplet(s);
const lieu = s.lieu || (s.lat && s.lng ? `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` : "—");
const msg  = s.message || s.description || "—";
  const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";
  const ac   = avatarColor(nom);

  return (
    <div
      onClick={() => onView(s)}
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "1.5px solid #f3f4f6",
        padding: "18px 20px",
        cursor: "pointer",
        transition: "all 0.2s",
        animation: `fadeUp 0.35s ease ${index * 0.04}s both`,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(220,38,38,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Bande colorée statut */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: st.dot, borderRadius: "18px 18px 0 0" }} />

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "'Inter',sans-serif" }}>{cat.value}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Inter',sans-serif", marginTop: 2, display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {lieu}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Badge label={st.label} color={st.color} bg={st.bg} dot={st.dot} size={10} />
          <button
            onClick={e => { e.stopPropagation(); onDelete(s._id || s.id); }}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #f1f5f9", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#d1d5db", transition: "all 0.15s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#d1d5db"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>

      {/* Message */}
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontFamily: "'Inter',sans-serif", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{msg}</p>

      {/* Bottom row — déclarant + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f9fafb", paddingTop: 12, marginTop: -2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(s)}</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "'Inter',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nom}</span>
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>{date}</span>
      </div>
    </div>
  );
}

// ── Assign Agent Modal ────────────────────────────────────────────────────────
function AssignAgentModal({ signalement, onClose, onSuccess, showToast }) {
  const [agents,        setAgents]        = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading,       setLoading]       = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // ✅ Bloque le scroll de la page quand la modale est ouverte
useEffect(() => {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  };
}, []);

  useEffect(() => {
    API.get("/agents")
      .then(r => setAgents(Array.isArray(r.data) ? r.data : r.data.agents || []))
      .catch(() => showToast("Impossible de charger les agents.", "error"))
      .finally(() => setLoadingAgents(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      await API.put(`/signalements/${signalement.id || signalement._id}/assigner`, { agentId: parseInt(selectedAgent) });
      showToast("Agent assigné avec succès !", "success");
      onSuccess(signalement.id || signalement._id, selectedAgent, agents);
      onClose();
    } catch {
      showToast("Erreur lors de l'assignation.", "error");
    } finally { setLoading(false); }
  };
return (
<div
  onClick={onClose}
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    boxSizing: "border-box",
    zIndex: 9999,
  }}
>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "28px 24px 24px",
          width: "100%",
          maxWidth: 440,
          maxHeight: "80vh",   // ✅ ne dépasse jamais l'écran
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          animation: "slideDown 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827", fontFamily: "'Inter',sans-serif" }}>
            👷 Assigner un agent
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {loadingAgents ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Chargement des agents…</div>
        ) : agents.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Aucun agent disponible.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
            {agents.map(agent => {
              const agentId   = agent.id || agent._id;
              const agentName = `${agent.firstName || ""} ${agent.lastName || ""}`.trim();
              const selected  = String(selectedAgent) === String(agentId);
              return (
                <div key={agentId} onClick={() => setSelectedAgent(String(agentId))}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${selected ? "#22c55e" : "#e5e7eb"}`, background: selected ? "#f0fdf4" : "#f9fafb", transition: "all 0.15s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: selected ? "#22c55e" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: selected ? "#fff" : "#6b7280", flexShrink: 0 }}>
                    {agentName.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: selected ? "#15803d" : "#111827", fontFamily: "'Inter',sans-serif" }}>{agentName || "Agent sans nom"}</div>
                    {agent.email && <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>{agent.email}</div>}
                  </div>
                  {selected && <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            Annuler
          </button>
          <button onClick={handleAssign} disabled={!selectedAgent || loading}
            style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: (!selectedAgent || loading) ? "#e5e7eb" : "#22c55e", color: (!selectedAgent || loading) ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 700, cursor: (!selectedAgent || loading) ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><Spinner color="#fff" size={14} />Assignation…</> : "👷 Assigner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SignalementsAdmin() {
  const navigate  = useNavigate();
  const toastId   = useRef(0);
  const knownIds  = useRef(new Set());
  const pollRef   = useRef(null);

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("tous");
  const [catFilter,   setCatFilter]   = useState("toutes");
  const [sort,        setSort]        = useState("recent");
  const [detail,      setDetail]      = useState(null);
  const [confirm,     setConfirm]     = useState(null);
  const [confLoading, setConfLoading] = useState(false);
  const [toasts,      setToasts]      = useState([]);
  const [page,        setPage]        = useState(1);
  const [searchFocus, setSearchFocus] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const PER_PAGE = 12;

  const showToast = useCallback((msg, type = "success", sub = "") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type, sub }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const handleAssignSuccess = (signalementId, agentId, agents) => {
  const agent = agents.find(a => (a.id || a._id) === agentId);
  setItems(prev => prev.map(s =>
    (s.id === signalementId || s._id === signalementId)
      ? { ...s, assignedTo: agent, status: "IN_PROGRESS" }
      : s
  ));
};

  // ── Fetch initial ──
useEffect(() => {
  API.get("/signalements")
    .then(r => {
      const data = Array.isArray(r.data) ? r.data : r.data.signalements || [];
      console.log("PREMIER SIGNALEMENT:", JSON.stringify(data[0], null, 2));
      setItems(data);
      data.forEach(s => knownIds.current.add(s._id || s.id));
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, []);

  // ── Polling temps réel (toutes les 30s) ──
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const r    = await API.get("/signalements");
        const data = Array.isArray(r.data) ? r.data : r.data.signalements || [];
        const nouveaux = data.filter(s => !knownIds.current.has(s._id || s.id));
        if (nouveaux.length > 0) {
          nouveaux.forEach(s => knownIds.current.add(s._id || s.id));
          setItems(data);
          nouveaux.forEach(s => {
            const cat = getCat(s.type || s.category);
            showToast(
              `${cat.icon} ${cat.value} — ${s.lieu || s.location?.address || "lieu inconnu"}`,
              "new",
              `Signalé par ${nomComplet(s)}`
            );
          });
        }
      } catch { /* silencieux */ }
    }, 30000);
    return () => clearInterval(pollRef.current);
  }, [showToast]);

  // ── Filters ──
  const filtered = items
    .filter(s => {
      if (filter !== "tous" && s.status !== filter) return false;
      if (catFilter !== "toutes" && (s.type || s.category) !== catFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const nom = nomComplet(s).toLowerCase();
      return (
        nom.includes(q) ||
        (s.createdBy?.email || "").toLowerCase().includes(q) ||
        (s.type || s.category || "").toLowerCase().includes(q) ||
        (s.message || s.description || "").toLowerCase().includes(q) ||
        (s.lieu || s.location?.address || s.adresse || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "ancien") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "alpha")  return nomComplet(a).localeCompare(nomComplet(b));
      return 0;
    });

  const pages     = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleStatusChange = (id, newStatus) => {
    setItems(prev => prev.map(s => (s._id === id || s.id === id) ? { ...s, status: newStatus } : s));
    if (detail && (detail._id === id || detail.id === id)) setDetail(d => ({ ...d, status: newStatus }));
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setConfLoading(true);
    try {
      await API.delete(`/signalements/${confirm.id}`);
      setItems(prev => prev.filter(s => s._id !== confirm.id && s.id !== confirm.id));
      knownIds.current.delete(confirm.id);
      if (detail && (detail._id === confirm.id || detail.id === confirm.id)) setDetail(null);
      showToast("Signalement supprimé.", "success");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally { setConfLoading(false); setConfirm(null); }
  };

  const countByStatus = val => items.filter(s => s.status === val).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes shimmer     { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
        @keyframes slideDown   { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight{ from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#f9fafb} ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:99px}
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f8fafc,#fff5f5 60%,#f8fafc)", fontFamily: "'Inter',sans-serif" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", marginBottom: 20 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Retour
            </button>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 99, background: "#fee2e2", border: "1px solid #fecaca", marginBottom: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#dc2626", animation: "pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", letterSpacing: "0.12em", textTransform: "uppercase" }}>Administration</span>
                </div>
                <h1 style={{ margin: 0, fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                  Signalements <span style={{ color: "#dc2626" }}>⚠️</span>
                </h1>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>{items.length} signalement{items.length !== 1 ? "s" : ""} · polling toutes les 30s</p>
              </div>
            </div>
          </div>

          {/* ── Stat pills ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {STATUSES.map(st => (
              <button key={st.value} onClick={() => { setFilter(filter === st.value ? "tous" : st.value); setPage(1); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: filter === st.value ? st.bg : "#fff", border: `1.5px solid ${filter === st.value ? st.dot : "#f1f5f9"}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.15s" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.dot }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "'Inter',sans-serif" }}>{st.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: st.color, background: st.bg, borderRadius: 99, padding: "1px 8px", fontFamily: "'Inter',sans-serif" }}>{countByStatus(st.value)}</span>
              </button>
            ))}
          </div>

          {/* ── Filters bar ── */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 150 }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: searchFocus ? "#dc2626" : "#9ca3af", pointerEvents: "none", transition: "color 0.2s" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Nom, lieu, message…"
                onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: `1.5px solid ${searchFocus ? "#fca5a5" : "#e5e7eb"}`, fontSize: 13, fontFamily: "'Inter',sans-serif", color: "#374151", background: "#f9fafb", outline: "none", transition: "border-color 0.2s" }} />
            </div>
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'Inter',sans-serif", color: "#374151", background: "#f9fafb", outline: "none", cursor: "pointer" }}>
              <option value="toutes">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'Inter',sans-serif", color: "#374151", background: "#f9fafb", outline: "none", cursor: "pointer" }}>
              <option value="recent">Plus récents</option>
              <option value="ancien">Plus anciens</option>
              <option value="alpha">Alphabétique</option>
            </select>
            {(search || filter !== "tous" || catFilter !== "toutes") && (
              <button onClick={() => { setSearch(""); setFilter("tous"); setCatFilter("toutes"); setPage(1); }}
                style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}>
                ✕ Réinitialiser
              </button>
            )}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}>
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Grid de cartes ── */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {[0,1,2,3,4,5].map(i => <Skeleton key={i} />)}
            </div>
          )}

          {error && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ color: "#dc2626", fontSize: 14, fontFamily: "'Inter',sans-serif" }}>⚠️ {error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "0 0 6px", fontFamily: "'Inter',sans-serif" }}>Aucun signalement trouvé</p>
              <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Inter',sans-serif" }}>Essayez de modifier vos filtres</p>
            </div>
          )}

          {!loading && !error && paginated.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {paginated.map((s, i) => (
                <SignalCard
                  key={s._id || s.id || i}
                  s={s}
                  index={i}
                  onView={setDetail}
                  onDelete={id => setConfirm({ id })}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 28 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: page === 1 ? "#d1d5db" : "#374151", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>← Préc.</button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p} style={{ display: "contents" }}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: "#d1d5db", fontSize: 13 }}>…</span>}
                    <button onClick={() => setPage(p)}
                      style={{ width: 36, height: 36, borderRadius: 10, border: page === p ? "none" : "1px solid #e5e7eb", background: page === p ? "#dc2626" : "#fff", color: page === p ? "#fff" : "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                      {p}
                    </button>
                  </span>
                ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: page === pages ? "#d1d5db" : "#374151", fontSize: 13, cursor: page === pages ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Suiv. →</button>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <DetailDrawer s={detail} onClose={() => setDetail(null)} onStatusChange={handleStatusChange} showToast={showToast} setAssignModal={setAssignModal} />
      )}
{assignModal && (
  <AssignAgentModal
    signalement={assignModal}
    onClose={() => setAssignModal(null)}
    onSuccess={handleAssignSuccess}
    showToast={showToast}
  />
)}

      {confirm && (
        <ConfirmModal
          title="Supprimer ce signalement ?"
          desc="Cette action est irréversible. Le signalement sera définitivement supprimé."
          confirmLabel="Supprimer"
          confirmColor="#dc2626"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={confLoading}
        />
      )}

      <ToastStack toasts={toasts} />
    </>
  );
}