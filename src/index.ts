import express from "express";
import http from "http";
import httpProxy from "http-proxy";

const app = express();
const PORT = process.env.PORT || 8080;

const TARGET = "http://cum.ayanakojivps.shop";

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  secure: true,
  xfwd: true
});

// ---------------------------
// KEEP ALIVE (VERY IMPORTANT)
// ---------------------------
proxy.on("proxyReqWs", (proxyReq) => {
  // helps avoid idle drops
  proxyReq.setHeader("Connection", "keep-alive");
});

// ---------------------------
// ERROR HANDLING
// ---------------------------
proxy.on("error", (err) => {
  console.error("Proxy error:", err.message);
});

// ---------------------------
// HTTP (optional passthrough)
// ---------------------------
app.use((req, res) => {
  proxy.web(req, res, { target: TARGET }, (err) => {
    console.error("HTTP proxy error:", err);
    if (!res.headersSent) {
      res.status(502).send("Bad Gateway");
    }
  });
});

// ---------------------------
// CREATE RAW SERVER (required for WS)
// ---------------------------
const server = http.createServer(app);

// ---------------------------
// WEB SOCKET HANDLING
// ---------------------------
server.on("upgrade", (req, socket, head) => {
  // IMPORTANT: do NOT modify headers aggressively
  req.headers["connection"] = "Upgrade";

  proxy.ws(req, socket, head, {
    target: TARGET
  });
});

// ---------------------------
// HEARTBEAT (reduces idle disconnects)
// ---------------------------
setInterval(() => {
  // Cloud Run keeps instance alive if traffic exists
  // this is a soft keep-alive mechanism
  server.getConnections((_, count) => {
    console.log("Active connections:", count);
  });
}, 30000);

// ---------------------------
// START SERVER
// ---------------------------
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`SSH WS Proxy running on :${PORT} → ${TARGET}`);
});
