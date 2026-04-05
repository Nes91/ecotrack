import { useState, useEffect } from "react";
import SignalementModal from "./SignalementModal";

// Clé localStorage pour les toasts déjà vus par le citoyen
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

export function isToastAlreadySeen(id) {
  return getSeenToasts().includes(String(id));
}

export default function MessageToast({ data, onClose }) {
  const [showModal, setShowModal] = useState(false);

  const getStatusConfig = (status) => {
    switch (status) {
      case "RESOLVED":
        return {
          color: "#16a34a", bg: "#ecfdf5", border: "#bbf7d0",
          icon: "✅", label: "Signalement traité",
          message: "Votre signalement a été traité avec succès."
        };
      case "REJECTED":
        return {
          color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
          icon: "❌", label: "Signalement rejeté",
          message: "Votre signalement a été rejeté."
        };
      case "IN_PROGRESS":
        return {
          color: "#d97706", bg: "#fffbeb", border: "#fde68a",
          icon: "⏳", label: "En cours de traitement",
          message: "Votre signalement est en cours de traitement."
        };
      case "PENDING":
      default:
        return {
          color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
          icon: "📨", label: "Signalement reçu",
          message: "Votre signalement a bien été pris en compte."
        };
    }
  };

  const config = getStatusConfig(data.status);

  // Numéro du signalement
  const signalementId = data.id ?? data.signalementId ?? "—";

  // Nom du déclarant
  const nom = data.createdBy
    ? `${data.createdBy.firstName || ""} ${data.createdBy.lastName || data.createdBy.name || ""}`.trim()
    : data.nom || data.userName || null;

  // Lieu
  const lieu = data.lieu || data.location?.address || data.adresse || null;

  // Message
  const message = data.message || data.description || config.message;

  // Marquer comme vu dès l'affichage (espace citoyen)
  useEffect(() => {
    if (signalementId !== "—") {
      markToastAsSeen(signalementId);
    }
  }, [signalementId]);

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 10000,
        width: 360,
        background: "#fff",
        borderRadius: 18,
        border: `1.5px solid ${config.border}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        animation: "slideInRight 0.35s cubic-bezier(0.22,1,0.36,1)",
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}>

        {/* Bande colorée top */}
        <div style={{ height: 4, background: config.color, borderRadius: "18px 18px 0 0" }} />

        {/* Header */}
        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: config.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, flexShrink: 0,
            border: `1.5px solid ${config.border}`,
          }}>
            {config.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: config.color,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3,
            }}>
              {config.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Signalement <span style={{ color: config.color }}>#{signalementId}</span>
            </div>
          </div>

          <button onClick={handleClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", fontSize: 16, lineHeight: 1, padding: 2,
          }}>✕</button>
        </div>

        {/* Infos : nom + lieu */}
        {(nom || lieu) && (
          <div style={{ padding: "0 16px 6px", display: "flex", flexDirection: "column", gap: 4 }}>
            {nom && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                <span style={{ fontSize: 13 }}>👤</span>
                <span style={{ fontWeight: 600 }}>{nom}</span>
              </div>
            )}
            {lieu && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                <span style={{ fontSize: 13 }}>📍</span>
                <span style={{
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280,
                }}>{lieu}</span>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{
            background: config.bg, borderRadius: 10,
            padding: "10px 12px", fontSize: 13,
            color: config.color, lineHeight: 1.6,
          }}>
            {message}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                flex: 1, padding: "9px",
                borderRadius: 10,
                border: `1.5px solid ${config.border}`,
                background: config.bg,
                color: config.color,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "opacity 0.2s",
              }}
            >
              Voir le détail →
            </button>
            <button onClick={handleClose} style={{
              padding: "9px 14px", borderRadius: 10,
              border: "1.5px solid #e5e7eb",
              background: "#fff", color: "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modale détaillée */}
      {showModal && (
        <SignalementModal
          data={{ ...data, id: signalementId }}
          config={config}
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}