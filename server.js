const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

const users = {}; // number -> ws

wss.on("connection", ws => {
  ws.on("message", msg => {
    const d = JSON.parse(msg);

    if (d.type === "register") {
      ws.number = d.number;
      users[d.number] = ws;
    }

    if (d.type === "call") {
      const t = users[d.to];
      if (t) t.send(JSON.stringify({ type:"incoming", from: ws.number }));
    }

    if (d.type === "signal") {
      const t = users[d.to];
      if (t) t.send(JSON.stringify(d));
    }
  });

  ws.on("close", () => {
    if (ws.number) delete users[ws.number];
  });
});

server.listen(process.env.PORT || 3000);
