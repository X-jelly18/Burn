import express from "express";
import http from "http";
import httpProxy from "http-proxy";

const app = express();
const PORT = process.env.PORT || 8080;

const TARGET = "wss://free.ayanakojivps.shop";

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  ws: true,
  changeOrigin: true,
  secure: true,
  xfwd: true
});

const server = http.createServer(app);

app.use((req, res) => {
  proxy.web(req, res, { target: TARGET }, () => {
    if (!res.headersSent) {
      res.status(502).send("Bad Gateway");
    }
  });
});

server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(Number(PORT), "0.0.0.0");
