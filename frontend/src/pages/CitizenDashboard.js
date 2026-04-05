// src/pages/CitizenDashboard.js
import { useEffect, useState } from "react";
import API from "../api/api";
import BadgeCard from "../components/BadgeCard";
import socket from "../socket/socket";
import MessageToast from "../components/MessageToast";

// ── Helpers localStorage pour les toasts déjà vus ────────────────────────────
const SEEN_KEY = "ecotrack_seen_toasts";

function getSeenToasts() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markToastAsSeen(id) {
  const seen = getSeenToasts();
  if (!seen.includes(String(id))) {
    seen.push(String(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
}

function isToastAlreadySeen(id) {
  return getSeenToasts().includes(String(id));
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CitizenDashboard() {
  const [signalements, setSignalements] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  // ── Toast signalement temps réel ──────────────────────────────────────────
  const [toast, setToast] = useState(null);

useEffect(() => {
  const userId = localStorage.getItem('id');
  const role = localStorage.getItem('role');

  if (userId && role) {
    socket.emit('register', {
      userId,
      role,
    });
  }

  socket.on("signalement_status", (data) => {
    const role = localStorage.getItem("role");

    if (role !== "CITIZEN") return;

    const id = data.signalementId ?? data.id;
    if (id && isToastAlreadySeen(id)) return;

    setSignalements(prev =>
      prev.map(s => s.id === id ? { ...s, status: data.status } : s)
    );

    setToast(data);
  });

  return () => {
    socket.off("signalement_status");
  };
}, []);

  
  // ─────────────────────────────────────────────────────────────────────────

  // Recalculer les stats automatiquement quand la liste change (ex: màj temps réel)
  useEffect(() => {
    setStats({
      total: signalements.length,
      pending: signalements.filter(s => s.status === 'PENDING').length,
      inProgress: signalements.filter(s => s.status === 'IN_PROGRESS').length,
      resolved: signalements.filter(s => s.status === 'RESOLVED').length,
    });
  }, [signalements]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRole = localStorage.getItem('role') || 'CITIZEN';
        const signalementRoute = userRole === 'CITIZEN'
          ? "/signalements/citoyen"
          : "/signalements";

        const sigRes = await API.get(signalementRoute);
        setSignalements(sigRes.data);

        try {
          const gamRes = await API.get("/gamification");
          setGamification(gamRes.data);
        } catch (gamError) {
          console.error("⚠️ Erreur gamification:", gamError);
          if (gamError.response?.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
            setTimeout(() => {
              localStorage.clear();
              window.location.href = '/login';
            }, 2000);
          } else {
            console.warn("⚠️ Gamification non disponible");
            setGamification({ points: 0, level: 1, badges: [] });
          }
        }

      } catch (err) {
        console.error("❌ Erreur lors du chargement:", err);
        if (err.response?.status === 401) {
          setError("Session expirée. Redirection vers la page de connexion...");
          setTimeout(() => {
            localStorage.clear();
            window.location.href = '/login';
          }, 2000);
        } else {
          setError("Erreur lors du chargement des données");
        }
      }
    };
    fetchData();
  }, []);

  const handleEdit = (signalement) => {
    setEditingId(signalement.id);
    setEditForm({
      type: signalement.type,
      comment: signalement.comment || "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (id) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await API.put(`/signalements/${id}`, editForm);

      setSignalements(
        signalements.map((s) => (s.id === id ? response.data : s))
      );
      setEditingId(null);
      setEditForm({});
      setSuccess("Signalement modifié avec succès !");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Erreur lors de la modification:", err);
      setError(
        err.response?.data?.error ||
        "Erreur lors de la modification du signalement"
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return { bg: '#fef9c3', border: '#facc15', text: '#a16207' };
      case "IN_PROGRESS":
        return { bg: '#dbeafe', border: '#60a5fa', text: '#1d4ed8' };
      case "RESOLVED":
        return { bg: '#dcfce7', border: '#4ade80', text: '#15803d' };
      case "REJECTED":
        return { bg: '#fee2e2', border: '#f87171', text: '#b91c1c' };
      default:
        return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "En attente",
      IN_PROGRESS: "En cours",
      RESOLVED: "Résolu",
      REJECTED: "Rejeté"
    };
    return labels[status] || status;
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>
              <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" fill="url(#citizenGrad)" opacity="0.15" />
                <path d="M14 4C14 4 22 10 22 17c0 4.4-3.6 8-8 8s-8-3.6-8-8c0-7 8-13 8-13z" fill="url(#citizenGrad)" />
                <path d="M14 10v8M11 14l3-3 3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="citizenGrad" x1="6" y1="4" x2="22" y2="24">
                    <stop stopColor="#22c55e" />
                    <stop offset="1" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 style={styles.title}>
              Eco<span style={styles.titleAccent}>Track</span>
            </h1>
          </div>
          <p style={styles.subtitle}>Suivez vos signalements et votre impact environnemental</p>
        </div>

        {/* Messages */}
        {success && (
          <div style={styles.successMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div style={styles.errorMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <StatCard title="Total" value={stats.total} color="#15803d" accent="#22c55e" icon="📋" />
          <StatCard title="En attente" value={stats.pending} color="#a16207" accent="#facc15" icon="⏳" />
          <StatCard title="En cours" value={stats.inProgress} color="#1d4ed8" accent="#60a5fa" icon="🔄" />
          <StatCard title="Résolus" value={stats.resolved} color="#15803d" accent="#4ade80" icon="✅" />
        </div>

        {/* Gamification Section */}
        {gamification && (
          <div style={styles.gamificationSection}>
            <BadgeCard
              points={gamification.points}
              level={gamification.level}
              maxLevel={gamification.maxLevel || 20}
              badges={gamification.badges || []}
            />
          </div>
        )}

        {/* Signalements Section */}
        <div style={styles.signalementsSection}>
          <h2 style={styles.sectionTitle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', color: '#16a34a' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Mes Signalements
          </h2>

          {signalements.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p style={styles.emptyTitle}>Aucun signalement pour le moment</p>
              <p style={styles.emptyText}>Créez votre premier signalement pour commencer à contribuer !</p>
            </div>
          ) : (
            <div style={styles.signalementsGrid}>
              {signalements.map((s) => (
                <SignalementCard
                  key={s.id}
                  signalement={s}
                  isEditing={editingId === s.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Toast temps réel — affiché une seule fois par signalement */}
      {toast && (
        <MessageToast
          data={toast}
          onClose={() => {
            const id = toast.signalementId ?? toast.id;
            if (id) markToastAsSeen(id);
            setToast(null);
          }}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, color, accent, icon }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      style={{
        ...styles.statCard,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? `0 8px 24px rgba(0,0,0,0.1)` : '0 2px 8px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${accent}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={styles.statTitle}>{title}</p>
          <p style={{ ...styles.statValue, color }}>{value}</p>
        </div>
        <span style={{ fontSize: '28px', opacity: 0.7 }}>{icon}</span>
      </div>
    </div>
  );
}

function SignalementCard({ signalement, isEditing, editForm, setEditForm, onEdit, onSave, onCancel, getStatusColor, getStatusLabel }) {
  const [isHovered, setIsHovered] = useState(false);
  const statusColors = getStatusColor(signalement.status);

  return (
    <div
      style={{
        ...styles.signalementCard,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <div style={styles.editMode}>
          <h3 style={styles.editTitle}>Modifier le signalement</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Type</label>
            <input
              type="text"
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Commentaire</label>
            <textarea
              value={editForm.comment}
              onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              placeholder="Ajoutez un commentaire..."
            />
          </div>
          <div style={styles.buttonGroup}>
            <button onClick={() => onSave(signalement.id)} style={styles.saveButton}>💾 Enregistrer</button>
            <button onClick={onCancel} style={styles.cancelButton}>✖️ Annuler</button>
          </div>
        </div>
      ) : (
        <div style={styles.viewMode}>
          <div style={styles.signalementHeader}>
            <h3 style={styles.signalementType}>{signalement.type}</h3>
            <span style={{
              ...styles.statusBadge,
              background: statusColors.bg,
              borderColor: statusColors.border,
              color: statusColors.text,
            }}>
              {getStatusLabel(signalement.status)}
            </span>
          </div>

          {signalement.photoUrl && (
            <div style={styles.imageWrapper}>
              <img
                src={`http://localhost:8000${signalement.photoUrl}`}
                alt="signalement"
                style={styles.signalementImage}
              />
            </div>
          )}

          <div style={styles.signalementContent}>
            <p style={styles.commentLabel}>Commentaire</p>
            <p style={styles.commentText}>
              {signalement.comment || <em style={{ color: '#9ca3af' }}>Aucun commentaire</em>}
            </p>
            {signalement.createdAt && (
              <div style={styles.dateInfo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  Créé le {new Date(signalement.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          <button onClick={() => onEdit(signalement)} style={styles.editButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Modifier</span>
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { position: 'relative', minHeight: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '40px 20px' },
  bgShape1: { position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  bgShape2: { position: 'absolute', bottom: '-60px', left: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  content: { position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '48px' },
  logoSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' },
  logoCircle: { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)' },
  title: { fontSize: '44px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-1px' },
  titleAccent: { background: 'linear-gradient(135deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { fontSize: '16px', color: '#6b7280', margin: 0, fontWeight: '500' },
  successMessage: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '14px', fontWeight: '500', marginBottom: '24px', animation: 'slideIn 0.3s ease-out' },
  errorMessage: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '14px', fontWeight: '500', marginBottom: '24px', animation: 'slideIn 0.3s ease-out' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '48px' },
  statCard: { background: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '20px', transition: 'all 0.3s ease', animation: 'slideUp 0.5s ease-out' },
  statTitle: { fontSize: '13px', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '36px', fontWeight: '800', margin: 0 },
  gamificationSection: { marginBottom: '48px' },
  sectionTitle: { display: 'flex', alignItems: 'center', fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' },
  signalementsSection: { marginBottom: '48px' },
  emptyState: { background: '#ffffff', borderRadius: '24px', border: '1px solid #e5e7eb', padding: '64px 32px', textAlign: 'center' },
  emptyIcon: { width: '72px', height: '72px', borderRadius: '20px', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#16a34a' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' },
  emptyText: { fontSize: '15px', color: '#6b7280', margin: 0 },
  signalementsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  signalementCard: { background: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', transition: 'all 0.3s ease', animation: 'slideUp 0.5s ease-out' },
  editMode: { display: 'flex', flexDirection: 'column', gap: '16px' },
  editTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', gap: '12px' },
  saveButton: { flex: 1, padding: '11px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
  cancelButton: { flex: 1, padding: '11px 20px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
  viewMode: { display: 'flex', flexDirection: 'column', gap: '16px' },
  signalementHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  signalementType: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0, flex: 1 },
  statusBadge: { padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid', whiteSpace: 'nowrap' },
  imageWrapper: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  signalementImage: { width: '100%', height: '200px', objectFit: 'cover' },
  signalementContent: { display: 'flex', flexDirection: 'column', gap: '10px' },
  commentLabel: { fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 },
  commentText: { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 },
  dateInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9ca3af', paddingTop: '12px', borderTop: '1px solid #f3f4f6' },
  editButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
};