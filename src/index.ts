import net from "net";
import http from "http";

const PORT = process.env.PORT || 8080;

// Backend
const BACKEND_HOST = "free.ayanakojivps.shop";
const BACKEND_PORT = 443;

// HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(426, {
    "Content-Type": "text/plain"
  });

  res.end("Upgrade Required");
});

// Raw WebSocket tunnel
server.on("upgrade", (req, clientSocket) => {
  // Connect directly to backend
  const backendSocket = net.connect(BACKEND_PORT, BACKEND_HOST, () => {

    // EXACT payload
    const payload =
      `GET wss://${BACKEND_HOST}/ HTTP/1.1\r\n` +
      `Host: ${BACKEND_HOST}\r\n` +
      `Upgrade: Websocket\r\n` +
      `Connection: Keep-Alive\r\n\r\n`;

    backendSocket.write(payload);

    // Pipe traffic both ways
    clientSocket.pipe(backendSocket);
    backendSocket.pipe(clientSocket);
  });

  backendSocket.on("error", (err) => {
    console.error("Backend socket error:", err.message);
    clientSocket.destroy();
  });

  clientSocket.on("error", (err) => {
    console.error("Client socket error:", err.message);
    backendSocket.destroy();
  });

  clientSocket.on("close", () => {
    backendSocket.destroy();
  });

  backendSocket.on("close", () => {
    clientSocket.destroy();
  });
});

// Start
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Raw WS SSH proxy listening on :${PORT}`);
});
