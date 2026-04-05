import { useState, useRef, useEffect } from "react";
import API from "../api/api";

// ─── Role theming ─────────────────────────────────────────────────────────────
const ROLE_THEME = {
  ADMIN: {
    label: "Administrateur", icon: "⚙️",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
    accent: "#8b5cf6", accentBorder: "#c4b5fd",
  },
  MANAGER: {
    label: "Manager", icon: "👔",
    gradient: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #14532d 100%)",
    accent: "#22c55e", accentBorder: "#bbf7d0",
  },
  AGENT: {
    label: "Agent", icon: "🦺",
    gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)",
    accent: "#06b6d4", accentBorder: "#a5f3fc",
  },
  CITIZEN: {
    label: "Citoyen", icon: "🌿",
    gradient: "linear-gradient(135deg, #ca8a04 0%, #a16207 50%, #713f12 100%)",
    accent: "#eab308", accentBorder: "#fde047",
  },
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.08em",
};
const inputBase = {
  padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
  background: "#f9fafb", fontSize: 14, color: "#1f2937",
  fontFamily: "inherit", outline: "none", transition: "all 0.2s", width: "100%", display: "block",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ color = "#fff", size = 14 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", verticalAlign: "middle" }} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, radius = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite" }} />;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 10000, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => {
        const cfg = {
          success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "✓" },
          error:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "✕" },
          warning: { bg: "#fffbeb", border: "#fde047", text: "#92400e", icon: "⚠️" },
        }[t.type] || {};
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", animation: "slideUp 0.3s ease", fontFamily: "inherit" }}>
            <span style={{ fontSize: 14, color: cfg.text }}>{cfg.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.text }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Overlay ─────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "28px 28px 24px", width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", border: "1.5px solid #e5e7eb", animation: "slideDown 0.3s ease" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel, confirmColor = "#ef4444", onConfirm, onCancel, loading }) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>⚠️</div>
        <h3 style={{ margin: "0 0 10px", fontSize: 19, fontWeight: 700, color: "#111827" }}>{title}</h3>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280", lineHeight: 1.55 }}>{description}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: confirmColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────
function PasswordModal({ theme, onClose, showToast }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const strength = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(form.next)).length;
  const strengthColors = ["#ef4444", "#f59e0b", "#22c55e", "#16a34a"];
  const strengthLabels = ["Faible", "Moyen", "Bon", "Fort"];

  const handleSave = async () => {
    if (!form.current || !form.next || !form.confirm) { showToast("Tous les champs sont requis.", "error"); return; }
    if (form.next.length < 8) { showToast("Au moins 8 caractères requis.", "error"); return; }
    if (form.next !== form.confirm) { showToast("Les mots de passe ne correspondent pas.", "error"); return; }
    setLoading(true);
    try {
      await API.put("/auth/change-password", { currentPassword: form.current, newPassword: form.next });
      showToast("Mot de passe modifié avec succès !");
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors du changement.", "error");
    } finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ margin: "0 0 20px", fontSize: 19, fontWeight: 700, color: "#111827" }}>🔐 Changer le mot de passe</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[["current","Mot de passe actuel"],["next","Nouveau mot de passe"],["confirm","Confirmer le nouveau"]].map(([field, lbl]) => (
          <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>{lbl}</label>
            <div style={{ position: "relative" }}>
              <input type={show[field] ? "text" : "password"} value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ ...inputBase, paddingRight: 40 }} />
              <button type="button" onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 15, padding: 0 }}>
                {show[field] ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        ))}
        {form.next && (
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < strength ? strengthColors[strength-1] : "#e5e7eb", transition: "background 0.3s" }} />)}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: strengthColors[strength-1] || "#9ca3af" }}>
              {strength > 0 ? strengthLabels[strength-1] : "—"}
            </span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
        <button onClick={handleSave} disabled={loading}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: loading ? "#d1d5db" : theme.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {loading ? <Spinner /> : "✎ Enregistrer"}
        </button>
      </div>
    </Overlay>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, editing, theme, type = "text", full, multiline }) {
  const [focused, setFocused] = useState(false);
  const Tag = multiline ? "textarea" : "input";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <Tag name={name} value={value} onChange={onChange} type={multiline ? undefined : type}
          rows={multiline ? 3 : undefined}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...inputBase, borderColor: focused ? theme.accent : "#e5e7eb", boxShadow: focused ? `0 0 0 3px ${theme.accent}22` : "none", resize: multiline ? "vertical" : "none" }} />
      ) : (
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#1f2937", padding: "10px 0", borderBottom: "1px solid #f3f4f6", minHeight: 41 }}>
          {value || <span style={{ color: "#d1d5db" }}>—</span>}
        </p>
      )}
    </div>
  );
}

// ─── SecRow ──────────────────────────────────────────────────────────────────
function SecRow({ icon, iconColor, title, desc, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", flexWrap: "wrap" }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: `${iconColor}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
      <div style={{ flex: "1 1 200px" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{title}</h3>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.45 }}>{desc}</p>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}

// ─── Helper : sync localStorage user ─────────────────────────────────────────
// Fusionne les nouvelles données dans le user stocké sans écraser le token
function syncLocalStorageUser(newData) {
  try {
    const raw = localStorage.getItem("user");
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem("user", JSON.stringify({ ...existing, ...newData }));
  } catch { /* silencieux */ }
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProfilePage({ user: initialUser }) {
  const fileRef = useRef();
  const toastId = useRef(0);
  const [qrCode, setQrCode] = useState(null);

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [form,          setForm]          = useState({});
  const [savedForm,     setSavedForm]     = useState({});
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [avatarSrc,     setAvatarSrc]     = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [twoFA,         setTwoFA]         = useState(false);
  const [twoFALoading,  setTwoFALoading]  = useState(false);
  const [modal,         setModal]         = useState(null);
  const [modalLoading,  setModalLoading]  = useState(false);
  const [activeTab,     setActiveTab]     = useState("info");
  const [toasts,        setToasts]        = useState([]);

  const showToast = (msg, type = "success") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  // Seed form state from API response
  const seedForm = (data) => {
    const firstName = data.firstName || data.name?.split(" ")[0] || "";
    const lastName  = data.lastName  || data.name?.split(" ").slice(1).join(" ") || "";
    const f = {
      firstName,
      lastName,
      email:   data.email   || "",
      phone:   data.phone   || "",
      address: data.address || "",
      bio:     data.bio     || "",
    };
    setForm(f);
    setSavedForm(f);
    setAvatarSrc(data.avatar || data.avatarUrl || null);
    setTwoFA(!!data.twoFAEnabled);
  };

  // ── Fetch /auth/me à chaque montage — source unique de vérité ──
  // Si l'API échoue on affiche les données localStorage en attendant,
  // mais on n'utilise JAMAIS localStorage comme source principale.
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      // Affichage immédiat des données en cache pendant le chargement
      const cached = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
      })();
      if (cached) {
        setProfile(cached);
        seedForm(cached);
      }

      try {
        const res = await API.get("/auth/me");
        const fresh = res.data;
        setProfile(fresh);
        seedForm(fresh);
        // Met à jour le cache avec les données fraîches
        syncLocalStorageUser(fresh);
      } catch (err) {
        // Si le réseau échoue et qu'on a un cache, on le garde affiché
        if (!cached && initialUser) {
          setProfile(initialUser);
          seedForm(initialUser);
        }
        if (err.response?.status === 401) {
          // Token expiré → rediriger vers login
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleCancel = () => { setForm({ ...savedForm }); setEditing(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await API.put("/auth/profile", form);
      const updated = res.data;
      setProfile(updated);
      seedForm(updated);
      setEditing(false);
      // ✅ On fusionne correctement dans localStorage sans écraser le token
      syncLocalStorageUser(updated);
      showToast("Profil mis à jour avec succès !");
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de la mise à jour.", "error");
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Veuillez sélectionner une image.", "error"); return; }
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await API.post("/auth/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAvatarSrc(res.data.avatarUrl);
      syncLocalStorageUser({ avatarUrl: res.data.avatarUrl });
      showToast("Photo de profil mise à jour !");
    } catch {
      setAvatarSrc(URL.createObjectURL(file));
      showToast("Photo mise à jour localement.", "warning");
    } finally { setAvatarLoading(false); e.target.value = ""; }
  };

  const handle2FAToggle = async () => {
    if (twoFA) { setModal("twofa-disable"); return; }
    setTwoFALoading(true);
    try {
      const res = await API.post("/auth/2fa/setup");
      setQrCode(res.data.qrCode);
      setModal("twofa-qr");
      setTwoFA(true);
      showToast("2FA activé !");
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de l'activation.", "error");
    } finally { setTwoFALoading(false); }
  };

  const handle2FADisable = async () => {
    setModalLoading(true);
    try {
      await API.post("/auth/2fa/disable");
      setTwoFA(false);
      showToast("2FA désactivé.");
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur.", "error");
    } finally { setModalLoading(false); }
  };

  const handleDisconnectAll = async () => {
    setModalLoading(true);
    try {
      await API.post("/auth/sessions/revoke-all");
      showToast("Toutes les sessions déconnectées.");
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur.", "error");
      setModal(null);
    } finally { setModalLoading(false); }
  };

  const handleDeleteAccount = async () => {
    setModalLoading(true);
    try {
      await API.delete("/auth/account");
      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur lors de la suppression.", "error");
      setModal(null);
      setModalLoading(false);
    }
  };

  const t        = ROLE_THEME[profile?.role] || ROLE_THEME[initialUser?.role] || ROLE_THEME.AGENT;
  const initials = `${(form.firstName||"")[0]||""}${(form.lastName||"")[0]||""}`.toUpperCase();

  const stats = profile ? [
    { icon: "🏆", value: profile.level  != null ? `Niv. ${profile.level}`                    : "—", label: "Niveau" },
    { icon: "⭐", value: profile.points != null ? profile.points.toLocaleString("fr-FR")      : "—", label: "Points" },
    { icon: "🏅", value: Array.isArray(profile.badges) ? profile.badges.length                : "—", label: "Badges" },
    { icon: "📅", value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "—", label: "Membre depuis" },
  ] : null;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 67px)", background: "#f8fafc" }}>
        <style>{`@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`}</style>
        <div style={{ height: 240, background: "linear-gradient(135deg,#e5e7eb,#d1d5db)" }} />
        <div style={{ maxWidth: 900, margin: "-28px auto 0", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                <Skeleton h={60} />
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <Skeleton h={20} w="40%" />
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
              {[0,1,2,3,4,5].map(i => <Skeleton key={i} h={44} radius={10} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
        *{box-sizing:border-box}
        input,textarea,select,button{font-family:inherit}
        .ava-wrap:hover .ava-overlay{opacity:1!important}
      `}</style>

      <div style={{ position: "relative", minHeight: "calc(100vh - 67px)", background: "#f8fafc" }}>

        {/* ══ HERO ══ */}
        <div style={{ position: "relative", overflow: "hidden", padding: "52px 24px 72px", background: t.gradient, textAlign: "center" }}>
          <div style={{ position:"absolute",top:-70,right:-50,width:240,height:240,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none" }} />
          <div style={{ position:"absolute",bottom:-80,left:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none" }} />

          <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
            <div className="ava-wrap" onClick={() => fileRef.current?.click()} style={{ cursor:"pointer",position:"relative" }}>
              <div style={{ width:108,height:108,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",border:"3px solid rgba(255,255,255,0.3)",boxShadow:"0 8px 32px rgba(0,0,0,0.15)" }}>
                <div style={{ width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative" }}>
                  {avatarLoading
                    ? <Spinner color={t.accent} size={24} />
                    : avatarSrc
                      ? <img src={avatarSrc} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                      : <span style={{ fontSize:34,fontWeight:800,color:t.accent,letterSpacing:-1 }}>{initials||"?"}</span>
                  }
                  <div className="ava-overlay" style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s" }}>
                    <span style={{ fontSize:20 }}>📷</span>
                  </div>
                </div>
              </div>
              <div style={{ position:"absolute",bottom:4,right:4,width:26,height:26,borderRadius:"50%",background:"#fff",border:`2px solid ${t.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:"none" }} />

            <h1 style={{ margin:0,fontSize:30,fontWeight:800,color:"#fff",letterSpacing:"-0.8px" }}>
              {`${form.firstName} ${form.lastName}`.trim() || profile?.email || "—"}
            </h1>

            <div style={{ display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.14)",backdropFilter:"blur(8px)",borderRadius:20,padding:"5px 14px",border:"1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:"#fff",animation:"blink 2s ease-in-out infinite" }} />
              <span style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.95)" }}>{t.icon} {t.label}</span>
            </div>

            <p style={{ margin:"4px 0 0",fontSize:14,color:"rgba(255,255,255,0.72)",maxWidth:460,lineHeight:1.55,fontStyle:form.bio?"normal":"italic" }}>
              {form.bio || "Aucune bio renseignée"}
            </p>
          </div>
        </div>

        {/* ══ STATS ══ */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"0 24px",maxWidth:900,margin:"-28px auto 0",position:"relative",zIndex:2 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background:"#fff",borderRadius:16,padding:"20px 10px",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.07)",border:"1px solid #f0f0f0",display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <span style={{ fontSize:18,fontWeight:800,color:"#1f2937",lineHeight:1 }}>{s.value}</span>
              <span style={{ fontSize:11,fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.5px" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ══ TABS ══ */}
        <div style={{ display:"flex",gap:6,justifyContent:"center",padding:"28px 24px 0",maxWidth:900,margin:"0 auto" }}>
          {[["info","📋","Informations"],["security","🔒","Sécurité"]].map(([key,icon,label]) => {
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ position:"relative",display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:12,border:"none",background:active?`${t.accent}18`:"transparent",color:active?t.accent:"#6b7280",fontSize:14,fontWeight:active?600:500,cursor:"pointer",transition:"all 0.2s" }}>
                <span style={{ fontSize:15 }}>{icon}</span>
                <span>{label}</span>
                {active && <span style={{ position:"absolute",bottom:0,left:20,right:20,height:2.5,borderRadius:2,background:t.accent }} />}
              </button>
            );
          })}
        </div>

        {/* ══ TAB CONTENT ══ */}
        <div style={{ maxWidth:900,margin:"20px auto 48px",padding:"0 24px" }}>

          {activeTab === "info" && (
            <div style={{ background:"#fff",borderRadius:20,border:"1px solid #eee",boxShadow:"0 4px 24px rgba(0,0,0,0.05)",overflow:"hidden" }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",padding:"24px 28px 20px",borderBottom:"1px solid #f3f4f6" }}>
                <div>
                  <h2 style={{ margin:0,fontSize:17,fontWeight:700,color:"#1f2937" }}>Informations personnelles</h2>
                  <p style={{ margin:"3px 0 0",fontSize:13,color:"#9ca3af" }}>Gérez vos coordonnées et votre profil</p>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  {!editing ? (
                    <button onClick={() => setEditing(true)}
                      style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:10,border:"1px solid #e5e7eb",background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Modifier
                    </button>
                  ) : (
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={handleCancel} style={{ padding:"8px 18px",borderRadius:10,border:"1px solid #e5e7eb",background:"#fff",color:"#6b7280",fontSize:13,fontWeight:600,cursor:"pointer" }}>Annuler</button>
                      <button onClick={handleSave} disabled={saving}
                        style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 18px",borderRadius:10,border:"none",background:saving?"#d1d5db":t.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",minWidth:130 }}>
                        {saving ? <Spinner /> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Sauvegarder</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20,padding:"24px 28px 28px" }}>
                <Field label="Prénom"    name="firstName" value={form.firstName} onChange={handleChange} editing={editing} theme={t} />
                <Field label="Nom"       name="lastName"  value={form.lastName}  onChange={handleChange} editing={editing} theme={t} />
                <Field label="Email"     name="email"     value={form.email}     onChange={handleChange} editing={editing} theme={t} type="email" />
                <Field label="Téléphone" name="phone"     value={form.phone}     onChange={handleChange} editing={editing} theme={t} type="tel" />
                <Field label="Adresse"   name="address"   value={form.address}   onChange={handleChange} editing={editing} theme={t} full />
                <Field label="Bio"       name="bio"       value={form.bio}       onChange={handleChange} editing={editing} theme={t} full multiline />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div style={{ background:"#fff",borderRadius:20,border:"1px solid #eee",boxShadow:"0 4px 24px rgba(0,0,0,0.05)",overflow:"hidden" }}>
              <div style={{ padding:"24px 28px 20px",borderBottom:"1px solid #f3f4f6" }}>
                <h2 style={{ margin:0,fontSize:17,fontWeight:700,color:"#1f2937" }}>Sécurité du compte</h2>
                <p style={{ margin:"3px 0 0",fontSize:13,color:"#9ca3af" }}>Gérez votre mot de passe et les sessions actives</p>
              </div>

              <SecRow icon="🔐" iconColor="#8b5cf6" title="Mot de passe"
                desc="Modifiez régulièrement votre mot de passe pour sécuriser votre compte."
                action={
                  <button onClick={() => setModal("password")}
                    style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:10,border:"1px solid #e5e7eb",background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Changer
                  </button>
                }
              />
              <div style={{ height:1,background:"#f3f4f6",margin:"0 28px" }} />

              <SecRow icon="🛡️" iconColor="#8b5cf6" title="Authentification à deux facteurs"
                desc={twoFA ? "Le 2FA est activé. Votre compte est mieux protégé." : "Activez le 2FA pour sécuriser davantage votre compte."}
                action={
                  <button onClick={handle2FAToggle} disabled={twoFALoading}
                    style={{ width:46,height:26,borderRadius:13,background:twoFA?t.accent:"#d1d5db",border:"none",position:"relative",cursor:twoFALoading?"not-allowed":"pointer",transition:"background 0.25s",opacity:twoFALoading?0.6:1 }}>
                    <div style={{ position:"absolute",top:3,left:twoFA?23:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.25s" }} />
                  </button>
                }
              />
              <div style={{ height:1,background:"#f3f4f6",margin:"0 28px" }} />

              <SecRow icon="💻" iconColor="#ef4444" title="Sessions actives"
                desc="Déconnectez tous vos appareils si vous pensez que votre compte a été compromis."
                action={
                  <button onClick={() => setModal("sessions")}
                    style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:10,border:"1px solid #fecaca",background:"#fff",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                    Déconnecter tout
                  </button>
                }
              />
              <div style={{ height:1,background:"#f3f4f6",margin:"0 28px" }} />

              <div style={{ margin:"16px 28px 28px",padding:22,borderRadius:14,background:"#fef2f2",border:"1px solid #fecaca" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                  <span style={{ fontSize:18 }}>⚠️</span>
                  <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:"#991b1b" }}>Zone dangereuse</h3>
                </div>
                <p style={{ margin:"0 0 16px",fontSize:13,color:"#b91c1c",lineHeight:1.45 }}>Ces actions sont irréversibles. Réfléchissez bien avant de continuer.</p>
                <button onClick={() => setModal("delete")}
                  style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,border:"1px solid #fca5a5",background:"#fff",color:"#dc2626",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {modal === "password"      && <PasswordModal theme={t} onClose={() => setModal(null)} showToast={showToast} />}
      {modal === "sessions"      && <ConfirmModal title="Déconnecter toutes les sessions ?" description="Vous serez déconnecté de tous vos appareils." confirmLabel="Déconnecter tout" confirmColor="#ef4444" onConfirm={handleDisconnectAll} onCancel={() => setModal(null)} loading={modalLoading} />}
      {modal === "delete"        && <ConfirmModal title="Supprimer votre compte ?" description="Cette action est irréversible. Toutes vos données seront définitivement supprimées." confirmLabel="Supprimer définitivement" confirmColor="#dc2626" onConfirm={handleDeleteAccount} onCancel={() => setModal(null)} loading={modalLoading} />}
      {modal === "twofa-disable" && <ConfirmModal title="Désactiver le 2FA ?" description="Votre compte sera moins sécurisé sans l'authentification à deux facteurs." confirmLabel="Désactiver" confirmColor="#f59e0b" onConfirm={handle2FADisable} onCancel={() => setModal(null)} loading={modalLoading} />}
      {modal === "twofa-qr" && (
        <Overlay onClose={() => setModal(null)}>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 19, fontWeight: 700 }}>🛡️ Scanner le QR Code</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Scannez ce code avec votre application d'authentification (Google Authenticator, Authy…)
            </p>
            {qrCode && <img src={qrCode} alt="QR Code 2FA" style={{ width: 200, height: 200, borderRadius: 12 }} />}
            <button onClick={() => setModal(null)}
              style={{ marginTop: 20, padding: "10px 28px", borderRadius: 10, border: "none", background: t.accent, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Terminé
            </button>
          </div>
        </Overlay>
      )}
      <Toast toasts={toasts} />
    </>
  );
}