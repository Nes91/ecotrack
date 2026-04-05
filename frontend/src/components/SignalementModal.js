import { useState, useEffect } from "react";

// ─── Étapes du cycle de vie d'un signalement ────────────────────────────────
const STEPS = [
  {
    key: "PENDING",
    icon: "📨",
    label: "Reçu",
    desc: "Votre signalement a bien été enregistré dans notre système.",
    color: "#2563eb",
    light: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    key: "IN_PROGRESS",
    icon: "⚙️",
    label: "En traitement",
    desc: "Nos équipes analysent votre signalement et préparent une intervention.",
    color: "#d97706",
    light: "#fffbeb",
    border: "#fde68a",
  },
  {
    key: "RESOLVED",
    icon: "✅",
    label: "Résolu",
    desc: "Votre signalement a été pris en charge et traité avec succès.",
    color: "#16a34a",
    light: "#ecfdf5",
    border: "#bbf7d0",
  },
];

const STATUS_ORDER = { PENDING: 0, IN_PROGRESS: 1, RESOLVED: 2, REJECTED: -1 };

export default function SignalementModal({ data, config, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // petit délai pour déclencher l'animation d'entrée
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const currentIndex = STATUS_ORDER[data.status] ?? 0;
  const isRejected = data.status === "REJECTED";

  const signalementId = data.id ?? data.signalementId ?? "—";
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: visible ? "rgba(15,23,42,0.55)" : "rgba(15,23,42,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        transition: "background 0.28s ease, backdrop-filter 0.28s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
          fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Bande décorative top ── */}
        <div style={{
          height: 5,
          background: isRejected
            ? "linear-gradient(90deg, #dc2626, #f87171)"
            : `linear-gradient(90deg, #22c55e, #16a34a, #0891b2)`,
        }} />

        {/* ── Header ── */}
        <div style={{
          padding: "28px 28px 20px",
          background: "linear-gradient(160deg, #f8fafc 0%, #ffffff 100%)",
          borderBottom: "1px solid #f1f5f9",
          position: "relative",
        }}>
          {/* Décoration cercle flou */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: `radial-gradient(circle, ${config.color}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: config.bg,
                border: `2px solid ${config.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
                boxShadow: `0 4px 16px ${config.color}20`,
              }}>
                {config.icon}
              </div>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: config.color,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
                }}>
                  {config.label}
                </div>
                <h2 style={{
                  margin: 0, fontSize: 20, fontWeight: 800,
                  color: "#0f172a", letterSpacing: "-0.3px",
                }}>
                  Signalement{" "}
                  <span style={{
                    background: `linear-gradient(135deg, ${config.color}, ${config.color}bb)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    #{signalementId}
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                color: "#94a3b8", fontSize: 14,
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              ✕
            </button>
          </div>

          {/* Meta infos */}
          {(formattedDate || data.type) && (
            <div style={{
              display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap",
            }}>
              {data.type && (
                <MetaChip icon="🏷️" label={data.type} />
              )}
              {formattedDate && (
                <MetaChip icon="📅" label={`Créé le ${formattedDate}`} />
              )}
            </div>
          )}
        </div>

        {/* ── Message ── */}
        {(data.message || config.message) && (
          <div style={{ padding: "20px 28px 0" }}>
            <div style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 14,
              color: config.color,
              lineHeight: 1.7,
              fontWeight: 500,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -1, left: 20,
                width: 10, height: 10,
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderRight: "none", borderBottom: "none",
                transform: "rotate(45deg) translateY(-50%)",
              }} />
              {data.message || config.message}
            </div>
          </div>
        )}

        {/* ── Timeline des étapes ── */}
        <div style={{ padding: "24px 28px 28px" }}>
          <p style={{
            margin: "0 0 20px 0",
            fontSize: 11, fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Suivi de votre signalement
          </p>

          {isRejected ? (
            <RejectedState config={config} />
          ) : (
            <div style={{ position: "relative" }}>
              {STEPS.map((step, i) => {
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;
                const isPending = i > currentIndex;

                return (
                  <TimelineStep
                    key={step.key}
                    step={step}
                    isDone={isDone}
                    isCurrent={isCurrent}
                    isPending={isPending}
                    isLast={i === STEPS.length - 1}
                    delay={i * 80}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 28px 24px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: "11px 28px",
              borderRadius: 12,
              border: "none",
              background: isRejected
                ? "linear-gradient(135deg, #dc2626, #ef4444)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              boxShadow: isRejected
                ? "0 4px 16px rgba(220,38,38,0.3)"
                : "0 4px 16px rgba(34,197,94,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = isRejected
                ? "0 8px 24px rgba(220,38,38,0.4)"
                : "0 8px 24px rgba(34,197,94,0.45)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isRejected
                ? "0 4px 16px rgba(220,38,38,0.3)"
                : "0 4px 16px rgba(34,197,94,0.35)";
            }}
          >
            Compris, fermer
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        @keyframes stepIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
        @keyframes fillLine {
          from { height: 0; }
          to   { height: 100%; }
        }
      `}</style>
    </div>
  );
}

// ─── Sous-composant : étape de timeline ────────────────────────────────────
function TimelineStep({ step, isDone, isCurrent, isPending, isLast, delay }) {
  return (
    <div style={{
      display: "flex", gap: 16,
      opacity: 0,
      animation: `stepIn 0.4s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms forwards`,
    }}>
      {/* Colonne gauche : point + ligne */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Dot */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          background: isDone ? step.light : isCurrent ? step.light : "#f8fafc",
          border: isDone
            ? `2px solid ${step.border}`
            : isCurrent
            ? `2.5px solid ${step.color}`
            : "2px solid #e2e8f0",
          boxShadow: isCurrent ? `0 0 0 4px ${step.color}18` : "none",
          animation: isCurrent ? "dotPulse 2s ease-in-out infinite" : "none",
          transition: "all 0.3s ease",
          filter: isPending ? "grayscale(0.6) opacity(0.5)" : "none",
        }}>
          {isDone ? "✓" : step.icon}
        </div>

        {/* Ligne verticale */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 28, marginTop: 4,
            background: "#f1f5f9",
            position: "relative", overflow: "hidden",
            borderRadius: 2,
          }}>
            {isDone && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                background: `linear-gradient(180deg, ${step.color}, ${step.color}88)`,
                animation: `fillLine 0.6s ease ${delay + 200}ms forwards`,
                height: 0,
                borderRadius: 2,
              }} />
            )}
          </div>
        )}
      </div>

      {/* Contenu droite */}
      <div style={{ paddingBottom: isLast ? 0 : 24, paddingTop: 8, flex: 1 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
        }}>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: isPending ? "#cbd5e1" : isCurrent ? step.color : "#374151",
          }}>
            {step.label}
          </span>
          {isCurrent && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: step.light,
              color: step.color,
              border: `1px solid ${step.border}`,
              borderRadius: 20,
              padding: "2px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              En cours
            </span>
          )}
          {isDone && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: "#f0fdf4",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              borderRadius: 20,
              padding: "2px 8px",
              letterSpacing: "0.06em",
            }}>
              ✓ Fait
            </span>
          )}
        </div>
        <p style={{
          margin: 0, fontSize: 13,
          color: isPending ? "#cbd5e1" : "#64748b",
          lineHeight: 1.6,
        }}>
          {step.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Sous-composant : état rejeté ─────────────────────────────────────────
function RejectedState({ config }) {
  return (
    <div style={{
      background: "#fef2f2",
      border: "1.5px solid #fecaca",
      borderRadius: 16,
      padding: "20px 20px",
      display: "flex", gap: 14, alignItems: "flex-start",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: "#fff",
        border: "1.5px solid #fecaca",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>
        ❌
      </div>
      <div>
        <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#dc2626" }}>
          Signalement rejeté
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#9f1239", lineHeight: 1.6 }}>
          Votre signalement n'a pas pu être traité. Si vous pensez que c'est une erreur,
          n'hésitez pas à en soumettre un nouveau avec plus de détails.
        </p>
      </div>
    </div>
  );
}

// ─── Sous-composant : chip méta info ─────────────────────────────────────
function MetaChip({ icon, label }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 20,
      padding: "4px 12px",
      fontSize: 12, fontWeight: 600, color: "#475569",
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}