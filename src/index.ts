import express from "express";
import http from "http";
import httpProxy from "http-proxy";

const app = express();
const PORT = process.env.PORT || 8080;

// Backend
const TARGET = "http://gift.ayanakojivps.shop";

// Proxy
const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  secure: true,
  xfwd: true
});

// --------------------
// Normal HTTP traffic
// --------------------
app.use((req, res) => {
  proxy.web(req, res, { target: TARGET }, (err) => {
    console.error("HTTP proxy error:", err);

    if (!res.headersSent) {
      res.status(502).send("Bad Gateway");
    }
  });
});

// --------------------
// Raw HTTP server
// --------------------
const server = http.createServer(app);

// --------------------
// WebSocket upgrade
// --------------------
server.on("upgrade", (req, socket, head) => {
  // Force exact upgrade payload behavior
  req.method = "GET";

  req.headers["host"] = "free.ayanakojivps.shop";
  req.headers["upgrade"] = "websocket";
  req.headers["connection"] = "Upgrade";

  // preserve websocket headers
  if (!req.headers["sec-websocket-version"]) {
    req.headers["sec-websocket-version"] = "13";
  }

  // optional protocol support
  if (req.headers["sec-websocket-protocol"]) {
    req.headers["sec-websocket-protocol"] =
      req.headers["sec-websocket-protocol"];
  }

  proxy.ws(
    req,
    socket,
    head,
    {
      target: TARGET
    },
    (err) => {
      console.error("WS proxy error:", err);
      socket.destroy();
    }
  );
});

// --------------------
// Errors
// --------------------
proxy.on("error", (err) => {
  console.error("Proxy internal error:", err);
});

// --------------------
// Start
// --------------------
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`WS SSH proxy running on :${PORT}`);
});
