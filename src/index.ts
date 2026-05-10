import tls from "tls";
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

// Raw WS tunnel
server.on("upgrade", (req, clientSocket) => {

  // TLS socket to backend
  const backendSocket = tls.connect(
    BACKEND_PORT,
    BACKEND_HOST,
    {
      servername: BACKEND_HOST
    },
    () => {

      // EXACT payload
      const payload =
        `GET / HTTP/1.1\r\n` +
        `Host: ${BACKEND_HOST}\r\n` +
        `Connection: Upgrade\r\n` +
        `Upgrade: websocket\r\n` +
        `User-Agent: Googlebot/2.1 (+http://www.google.com/bot.html)\r\n\r\n`;

      backendSocket.write(payload);

      // Pipe traffic
      clientSocket.pipe(backendSocket);
      backendSocket.pipe(clientSocket);
    }
  );

  backendSocket.on("error", (err) => {
    console.error("Backend TLS error:", err.message);
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
  console.log(`Raw WS proxy running on :${PORT}`);
});
