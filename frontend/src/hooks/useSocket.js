// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(userId, role, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(process.env.REACT_APP_API_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("register", { userId, role: role || "CITIZEN" });
    });

    // ── Notifications admin → citoyen (messages de statut)
    socketRef.current.on("message_admin", (data) => {
      onMessage(data);
    });

    // ── Nouvelle mission assignée → agent
    socketRef.current.on("nouvelle_mission", (data) => {
      onMessage({ ...data, eventType: "nouvelle_mission" });
    });

    // ── Signalement résolu par l'agent → manager  ← NOUVEAU
    socketRef.current.on("signalement_resolu_manager", (data) => {
      onMessage({ ...data, eventType: "signalement_resolu_manager" });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  return socketRef;
}