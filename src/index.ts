import http from "http";
import tls from "tls";

const PORT = process.env.PORT || 8080;

// Backend
const BACKEND_HOST = "free.ayanakojivps.shop";
const BACKEND_PORT = 443;

// Required client payload
const REQUIRED_HOST = "www.api.ayanakojivps.shop";
const REQUIRED_UA =
  "Googlebot/2.1 (+http://www.google.com/bot.html)";

// HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(426, {
    "Content-Type": "text/plain"
  });

  res.end("Upgrade Required");
});

// WS upgrade handling
server.on("upgrade", (req, clientSocket) => {

  // -------------------------
  // Validate exact payload
  // -------------------------
  const host = req.headers["host"];
  const upgrade = req.headers["upgrade"];
  const connection = req.headers["connection"];
  const userAgent = req.headers["user-agent"];

  const valid =
    host === REQUIRED_HOST &&
    typeof upgrade === "string" &&
    upgrade.toLowerCase() === "websocket" &&
    typeof connection === "string" &&
    connection.toLowerCase().includes("upgrade") &&
    userAgent === REQUIRED_UA;

  if (!valid) {
    clientSocket.write(
      "HTTP/1.1 403 Forbidden\r\n" +
      "Content-Type: text/plain\r\n\r\n" +
      "Invalid payload"
    );

    clientSocket.destroy();
    return;
  }

  // -------------------------
  // Connect to backend
  // -------------------------
  const backendSocket = tls.connect(
    BACKEND_PORT,
    BACKEND_HOST,
    {
      servername: BACKEND_HOST
    },
    () => {

      // Forward custom payload to backend
      const payload =
        `GET / HTTP/1.1\r\n` +
        `Host: ${BACKEND_HOST}\r\n` +
        `Connection: Upgrade\r\n` +
        `Upgrade: websocket\r\n` +
        `User-Agent: ${REQUIRED_UA}\r\n\r\n`;

      backendSocket.write(payload);

      // Pipe both ways
      clientSocket.pipe(backendSocket);
      backendSocket.pipe(clientSocket);
    }
  );

  backendSocket.on("error", (err) => {
    console.error("Backend error:", err.message);
    clientSocket.destroy();
  });

  clientSocket.on("error", (err) => {
    console.error("Client error:", err.message);
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
  console.log(`WS payload validator running on :${PORT}`);
});
