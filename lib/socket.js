import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    transports: ["websocket", "polling"],
    forceNew: true
});

socket.on("connect", () => {
    console.log("🟢 Admin Socket CONNECTED:", socket.id);
});

socket.on("connect_error", (err) => {
    console.error("🔴 Admin Socket CONNECTION ERROR:", err.message);
});

socket.on("disconnect", (reason) => {
    console.log("🟡 Admin Socket DISCONNECTED:", reason);
});
