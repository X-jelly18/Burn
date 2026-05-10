import http from "http";
import { WebSocketServer } from "ws";
import net from "net";

const PORT = process.env.PORT || 8080;

// Your SSH backend
const SSH_HOST = "uk.sshws.net";
const SSH_PORT = 22;

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  console.log("WS connected:", req.socket.remoteAddress);

  const ssh = net.connect(SSH_PORT, SSH_HOST);

  // WebSocket → SSH
  ws.on("message", (data) => {
    ssh.write(data);
  });

  // SSH → WebSocket
  ssh.on("data", (data) => {
    ws.send(data);
  });

  ws.on("close", () => ssh.destroy());
  ssh.on("close", () => ws.close());

  ws.on("error", () => ssh.destroy());
  ssh.on("error", () => ws.close());
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SSH WS running on :${PORT}`);
});
