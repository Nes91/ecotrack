// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(userId, role, onMessage) {
  const socketRef    = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Garder onMessage à jour sans recréer la socket
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return;

    // Éviter les doubles connexions (React StrictMode)
    if (socketRef.current?.connected) return;

    const socket = io(process.env.REACT_APP_API_URL, {
      // polling d'abord — indispensable sur Render (pas de WS à froid)
      transports       : ["polling", "websocket"],
      reconnection     : true,
      reconnectionDelay: 2000,
      timeout          : 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connecté :", socket.id);
      console.log("🔌 Socket register:", { userId, role });
      socket.emit("register", { userId, role: role || "CITIZEN" });
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connect_error :", err.message);
    });

    socket.on("message_admin", (data) => {
      onMessageRef.current({
        ...data,
        id:     data.id ?? data.signalementId,
        status: data.status || "RESOLVED",
        message: data.message || "Votre signalement a été traité avec succès.",
      });
    });

    socket.on("nouvelle_mission", (data) => {
      onMessageRef.current({ ...data, eventType: "nouvelle_mission" });
    });

    socket.on("signalement_resolu_manager", (data) => {
      onMessageRef.current({ ...data, eventType: "signalement_resolu_manager" });
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("message_admin");
      socket.off("nouvelle_mission");
      socket.off("signalement_resolu_manager");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, role]);

  return socketRef;
}