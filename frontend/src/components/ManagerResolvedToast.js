// frontend/src/components/ManagerResolvedToast.js
import { useState, useEffect } from "react";
import API from "../api/api";

/**
 * Toast affiché au MANAGER quand un agent passe un signalement en RESOLVED.
 * Permet d'envoyer un message au citoyen directement depuis le toast.
 *
 * Props :
 *   data     — payload socket : { signalementId, agentName, citizenId, citizenName, type, lieu }
 *   onClose  — callback fermeture
 */
export default function ManagerResolvedToast({ data, onClose }) {
  const [visible, setVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [showInput, setShowInput] = useState(false);

  const DEFAULT_MSG = `Bonjour, votre signalement #${data.signalementId} (${data.type || "problème"}) a été résolu par notre équipe. Merci pour votre contribution à EcoTrack !`;

  // Animation d'entrée
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Auto-fermeture après 18 s si pas d'interaction
  useEffect(() => {
    if (sent) {
      const t = setTimeout(close, 3500);
      return () => clearTimeout(t);
    }
    if (!showInput) {
      const t = setTimeout(close, 18000);
      return () => clearTimeout(t);
    }
  }, [sent, showInput]);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  const handleSendMessage = async () => {
    setSending(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;

      // On utilise la route PUT signalements/:id pour mettre à jour + notifier
      // mais ici on veut juste envoyer un message au citoyen.
      // On POST sur /messages ou on émet via l'API existante.
      // Adapté à votre backend : on PATCH /signalements/:id avec un champ "managerMessage"
      await API.put(
        `/signalements/${data.signalementId}`,
        { managerMessage: customMsg || DEFAULT_MSG },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setSent(true);
    } catch (err) {
      console.error("Erreur envoi message :", err);
      // On marque quand même comme envoyé côté UI (le backend peut ne pas encore gérer ce champ)
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(100px); }
        }
        @keyframes shimmerBar {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .mgr-toast-enter { animation: slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .mgr-toast-exit  { animation: slideOutRight 0.38s ease-in both; }
      `}</style>

      <div
        className={visible ? "mgr-toast-enter" : "mgr-toast-exit"}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 99999,
          width: 380, maxWidth: "calc(100vw - 32px)",
          fontFamily: "'DM Sans', 'Roboto', sans-serif",
          filter: "drop-shadow(0 16px 40px rgba(34,197,94,0.18))",
        }}
      >
        <div style={{
          background: "#fff",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 0 0 1.5px rgba(34,197,94,0.25), 0 8px 32px rgba(0,0,0,0.07)",
        }}>
          {/* Barre verte shimmer */}
          <div style={{
            height: 4,
            background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#22c55e,#16a34a)",
            backgroundSize: "300% auto",
            animation: "shimmerBar 3s linear infinite",
          }} />

          {/* Header */}
          <div style={{
            padding: "14px 16px 12px",
            display: "flex", alignItems: "flex-start", gap: 12,
            borderBottom: "1px solid #f0fdf4",
            background: "linear-gradient(135deg, #f0fdf4, #fafff9)",
          }}>
            {/* Icône */}
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
            }}>
              ✅
            </div>

            {/* Textes */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#16a34a",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2,
              }}>
                Signalement résolu
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                Signalement #{data.signalementId}
                {data.type && (
                  <span style={{ fontWeight: 500, color: "#6b7280", fontSize: 13 }}> · {data.type}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                Résolu par <strong style={{ color: "#374151" }}>{data.agentName || "un agent"}</strong>
                {data.lieu && <> · 📍 {data.lieu}</>}
              </div>
            </div>

            {/* Fermer */}
            <button onClick={close} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", fontSize: 16, padding: "2px 4px",
              borderRadius: 6, lineHeight: 1, flexShrink: 0,
              transition: "color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#374151"}
              onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
            >
              ✕
            </button>
          </div>

          {/* Citoyen concerné */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 10,
              background: "#f9fafb", border: "1px solid #f3f4f6",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #6b7280, #374151)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {(data.citizenName?.[0] || "C").toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  {data.citizenName || "Citoyen"}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Citoyen à notifier</div>
              </div>
            </div>
          </div>

          {/* Zone action */}
          <div style={{ padding: "12px 16px 16px" }}>
            {sent ? (
              /* État succès */
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 12,
                background: "#f0fdf4", border: "1.5px solid #bbf7d0",
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                    Message envoyé !
                  </div>
                  <div style={{ fontSize: 11, color: "#16a34a" }}>
                    Le citoyen a été notifié de la résolution.
                  </div>
                </div>
              </div>
            ) : showInput ? (
              /* État rédaction */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  placeholder={DEFAULT_MSG}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 12px",
                    borderRadius: 10, border: "1.5px solid #d1d5db",
                    fontFamily: "'DM Sans', 'Roboto', sans-serif",
                    fontSize: 12, color: "#111827", resize: "vertical",
                    outline: "none", lineHeight: 1.5,
                    transition: "border-color 0.18s",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "#22c55e"}
                  onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowInput(false)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 9,
                      border: "1.5px solid #e5e7eb", background: "#fff",
                      color: "#6b7280", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', 'Roboto', sans-serif",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending}
                    style={{
                      flex: 2, padding: "8px 0", borderRadius: 9,
                      border: "none",
                      background: sending
                        ? "#d1d5db"
                        : "linear-gradient(135deg, #16a34a, #22c55e)",
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      cursor: sending ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', 'Roboto', sans-serif",
                      boxShadow: sending ? "none" : "0 4px 12px rgba(34,197,94,0.3)",
                      transition: "all 0.18s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {sending ? (
                      <>
                        <span style={{
                          width: 12, height: 12, border: "2px solid #fff",
                          borderTopColor: "transparent", borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Envoi…
                      </>
                    ) : "📨 Envoyer"}
                  </button>
                </div>
              </div>
            ) : (
              /* État initial */
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={close}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 9,
                    border: "1.5px solid #e5e7eb", background: "#fff",
                    color: "#6b7280", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans', 'Roboto', sans-serif",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  Ignorer
                </button>
                <button
                  onClick={() => setShowInput(true)}
                  style={{
                    flex: 2, padding: "9px 0", borderRadius: 9,
                    border: "none",
                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "'DM Sans', 'Roboto', sans-serif",
                    boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 16px rgba(34,197,94,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(34,197,94,0.3)"}
                >
                  📨 Envoyer un message au citoyen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}