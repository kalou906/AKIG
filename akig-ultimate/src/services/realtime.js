import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io("/", { autoConnect: false });
  }
  return socket;
}

export function notifyOwner(ownerId, payload) {
  const client = getSocket();
  if (!client.connected) {
    client.connect();
  }
  client.emit("notify", { ownerId, payload });
}
