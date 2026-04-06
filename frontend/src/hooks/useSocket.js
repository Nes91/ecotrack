import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(userId, role, onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

socketRef.current = io(process.env.REACT_APP_API_URL, {
  transports: ['websocket', 'polling'],
});

    socketRef.current.on("connect", () => {
      // Envoie userId ET role pour que le serveur puisse retrouver le socket de l'agent
      socketRef.current.emit("register", { userId, role: role || "AGENT" });
    });

    // Notifications admin → citoyen (messages)
    socketRef.current.on("message_admin", (data) => {
      onMessage(data);
    });

    // Nouvelle mission assignée → agent
    socketRef.current.on("nouvelle_mission", (data) => {
      onMessage({ ...data, eventType: "nouvelle_mission" });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  return socketRef;
}