const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

const users = {}; // 電話番号 → ws

wss.on("connection", ws => {

  ws.on("message", msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === "register") {
      ws.number = data.number;
      users[data.number] = ws;
      return;
    }

    if (data.type === "call") {
      const target = users[data.to];
      if (target) {
        target.send(JSON.stringify({
          type: "incoming",
          from: ws.number
        }));
      }
      return;
    }

    if (data.type === "signal") {
      const target = users[data.to];
      if (target) {
        target.send(JSON.stringify(data));
      }
    }
  });

  ws.on("close", () => {
    if (ws.number) delete users[ws.number];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
