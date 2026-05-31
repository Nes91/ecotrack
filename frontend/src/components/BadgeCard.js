import { useState, useEffect } from "react";

// ─── Mapping des badges ID vers leurs infos visuelles ─────────────────────────
const BADGE_INFO = {
  "first_report": { label: "🌟 Premier Signalement", color: "#ca8a04", bg: "#fffbeb" },
  "reporter_5":   { label: "🔥 Citoyen Actif",        color: "#ef4444", bg: "#fef2f2" },
  "reporter_10":  { label: "🏆 Super Citoyen",         color: "#8b5cf6", bg: "#faf5ff" },
  "reporter_25":  { label: "🦸 Héros Urbain",          color: "#0891b2", bg: "#f0fdff" },
  "level_5":      { label: "⭐ Niveau 5",              color: "#0891b2", bg: "#f0fdff" },
  "level_10":     { label: "💎 Niveau 10",             color: "#8b5cf6", bg: "#faf5ff" },
  "points_100":   { label: "🎯 100 Points",            color: "#16a34a", bg: "#f0fdf4" },
  "points_500":   { label: "🚀 500 Points",            color: "#ca8a04", bg: "#fffbeb" },
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function BadgeCard({
  points = 0,
  level = 1,
  maxLevel = 20,
  badges = [],
}) {
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [animatedPoints, setAnimatedPoints] = useState(0);

  // Convertir les badges du backend (array de strings) en objets visuels
  const badgeObjects = Array.isArray(badges)
    ? badges.map(badgeId => BADGE_INFO[badgeId] || null).filter(Boolean)
    : [];

  // ── Compteur animé des points au mount ──────────────────────────────────
  useEffect(() => {
    let start = null;
    const duration = 1200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPoints(Math.round(eased * points));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [points]);

  // ── Anneau de niveau ──────────────────────────────────────────────────────
  const levelPercent = Math.min((level / maxLevel) * 100, 100);
  const ringRadius = 30;
  const ringCircum = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircum - (levelPercent / 100) * ringCircum;

  // ── Prochain badge ────────────────────────────────────────────────────────
  const nextBadgeInfo = badgeObjects.length === 0
    ? { label: "🌟 Premier Signalement", progress: 0 }
    : badgeObjects.length < Object.keys(BADGE_INFO).length
    ? {
        label: Object.values(BADGE_INFO)[badgeObjects.length].label,
        progress: Math.min((badgeObjects.length / Object.keys(BADGE_INFO).length) * 100, 100),
      }
    : { label: "🎖️ Tous débloqués !", progress: 100 };

  return (
    <div style={S.card}>
      {/* Blobs décoratifs */}
      <div style={S.blob1} aria-hidden="true" />
      <div style={S.blob2} aria-hidden="true" />
      <div style={S.blob3} aria-hidden="true" />

      <div style={S.inner}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.titleRow}>
            <h2 style={S.title}>🏆 Gamification</h2>
            <div style={S.roleBadge}>
              <span style={S.roleDot} />
              <span style={S.roleBadgeLabel}>🏅 Actif</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <div style={{ ...S.statCard, animationDelay: "0ms" }}>
            <span style={S.statIcon}>💎</span>
            <span style={S.statValue}>{animatedPoints.toLocaleString("fr-FR")}</span>
            <span style={S.statLabel}>Points</span>
          </div>

          <div style={{ ...S.statCard, ...S.statCardRing, animationDelay: "70ms" }}>
            <svg width="72" height="72" style={{ margin: "0 auto" }}>
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              <circle cx="36" cy="36" r={ringRadius} fill="none" stroke="rgba(22,163,74,0.12)" strokeWidth="7" />
              <circle
                cx="36" cy="36" r={ringRadius}
                fill="none" stroke="url(#ringGrad)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircum}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 36 36)"
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
              />
              <text x="36" y="33" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1f2937">{level}</text>
              <text x="36" y="47" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280" letterSpacing="0.5">NIVEAU</text>
            </svg>
          </div>

          <div style={{ ...S.statCard, animationDelay: "140ms" }}>
            <span style={S.statIcon}>🎖️</span>
            <span style={S.statValue}>{badgeObjects.length}</span>
            <span style={S.statLabel}>Badges</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={S.progressWrap}>
          <div style={S.progressHeader}>
            <span style={S.progressLabel}>
              Vers <strong>{nextBadgeInfo.label}</strong>
            </span>
            <span style={S.progressPercent}>{Math.round(nextBadgeInfo.progress)} %</span>
          </div>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: `${nextBadgeInfo.progress}%` }} />
          </div>
        </div>

        {/* Section badges */}
        <div style={S.sectionHeader}>
          <span style={S.sectionLine} />
          <span style={S.sectionTitle}>Badges obtenus</span>
          <span style={S.sectionLine} />
        </div>

        <div style={S.badgesGrid}>
          {badgeObjects.length > 0 ? (
            badgeObjects.map((badge, i) => {
              const parts = badge.label.split(" ");
              const emoji = parts[0];
              const text = parts.slice(1).join(" ");
              return (
                <div
                  key={i}
                  style={{
                    ...S.badgePill(badge.color, badge.bg),
                    animationDelay: `${i * 65}ms`,
                    transform: hoveredBadge === i ? "translateY(-3px)" : "translateY(0)",
                    boxShadow: hoveredBadge === i
                      ? `0 8px 24px ${badge.color}28, 0 2px 8px rgba(0,0,0,0.06)`
                      : "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  onMouseEnter={() => setHoveredBadge(i)}
                  onMouseLeave={() => setHoveredBadge(null)}
                >
                  <span style={S.badgeIconWrap(badge.color)}>{emoji}</span>
                  <span style={S.badgeText}>{text}</span>
                </div>
              );
            })
          ) : (
            <div style={S.emptyBadge}>
              <span style={S.emptyIcon}>🎖️</span>
              <span style={S.emptyText}>
                Aucun badge pour le moment. Créez des signalements pour en gagner !
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const S = {
  card: {
    position: "relative",
    borderRadius: "24px",
    overflow: "hidden",
    background: "#fff",
    border: "1px solid rgba(22,163,74,0.12)",
    boxShadow: "0 8px 40px rgba(22,163,74,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",          // ✅ prend toute la largeur disponible
    maxWidth: "100%",       // ✅ plus de limite à 520px
    margin: "0",
    boxSizing: "border-box",
  },
  blob1: {
    position: "absolute", top: "-50px", right: "-40px",
    width: "180px", height: "180px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: "-40px", left: "-30px",
    width: "150px", height: "150px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute", top: "40px", left: "-20px",
    width: "90px", height: "90px", borderRadius: "50%",
    border: "2px solid rgba(34,197,94,0.10)",
    pointerEvents: "none",
  },
  inner: { position: "relative", zIndex: 1, padding: "32px 28px 28px" },
  header: { marginBottom: "24px" },
  titleRow: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: "700", color: "#1f2937", letterSpacing: "-0.3px" },
  roleBadge: {
    display: "inline-flex", alignItems: "center", gap: "7px",
    background: "rgba(34,197,94,0.08)", borderRadius: "20px",
    padding: "5px 12px", border: "1px solid rgba(34,197,94,0.18)",
  },
  roleDot: {
    width: "7px", height: "7px", borderRadius: "50%",
    background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)",
    display: "inline-block",
  },
  roleBadgeLabel: { fontSize: "12px", fontWeight: "600", color: "#15803d", letterSpacing: "0.2px" },

  statsRow: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "24px",
    flexWrap: "wrap",   // ✅ responsive sur petits écrans
  },
  statCard: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    flex: "1 1 100px",   // ✅ flexible, minimum 100px
    minWidth: 0,
    padding: "18px 8px",
    borderRadius: "16px",
    background: "#f0fdf4",
    border: "1px solid rgba(34,197,94,0.15)",
    opacity: 0,
    animation: "fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards",
  },
  statCardRing: {
    padding: "10px 8px",
    background: "#fff",
    border: "1px solid rgba(34,197,94,0.18)",
  },
  statIcon: { fontSize: "18px", marginBottom: "4px" },
  statValue: {
    fontSize: "20px", fontWeight: "800", color: "#1f2937",
    lineHeight: "1", marginBottom: "4px",
  },
  statLabel: {
    fontSize: "10px", color: "#6b7280", textTransform: "uppercase",
    letterSpacing: "0.6px", fontWeight: "600", textAlign: "center",
  },

  progressWrap: { marginBottom: "28px" },
  progressHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "baseline", marginBottom: "8px",
  },
  progressLabel: { fontSize: "13px", color: "#4b5563", fontWeight: "500" },
  progressPercent: { fontSize: "12px", fontWeight: "700", color: "#16a34a" },
  progressTrack: {
    height: "7px", borderRadius: "999px",
    background: "rgba(34,197,94,0.1)", overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: "999px",
    background: "linear-gradient(90deg, #22c55e, #16a34a)",
    boxShadow: "0 0 8px rgba(34,197,94,0.35)",
    transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
  },

  sectionHeader: {
    display: "flex", alignItems: "center",
    gap: "12px", marginBottom: "16px",
  },
  sectionLine: {
    flex: 1, height: "1px",
    background: "linear-gradient(90deg, transparent, #d1d5db, transparent)",
  },
  sectionTitle: {
    fontSize: "11px", fontWeight: "700", color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "1.2px", whiteSpace: "nowrap",
  },

  badgesGrid: {
    display: "flex",
    flexWrap: "wrap",   // ✅ responsive naturellement
    gap: "10px",
  },
  badgePill: (color, bg) => ({
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 14px 8px 8px",
    borderRadius: "14px", background: bg,
    border: `1px solid ${color}22`,
    cursor: "default",
    transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease",
    opacity: 0,
    animation: "fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards",
  }),
  badgeIconWrap: (color) => ({
    width: "30px", height: "30px", borderRadius: "10px",
    background: `${color}14`, border: `1px solid ${color}28`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px",
  }),
  badgeText: { fontSize: "13px", fontWeight: "600", color: "#1f2937" },

  emptyBadge: {
    width: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "8px", padding: "28px 16px",
    borderRadius: "16px", border: "1.5px dashed rgba(34,197,94,0.25)",
    background: "rgba(34,197,94,0.03)",
  },
  emptyIcon: { fontSize: "28px" },
  emptyText: { fontSize: "13px", color: "#9ca3af", fontWeight: "500", textAlign: "center" },
};