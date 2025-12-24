const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

const users = {}; // 電話番号 → ws

wss.on("connection", ws => {

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "register") {
      ws.number = data.number;
      users[data.number] = ws;
    }

    if (data.type === "call") {
      const target = users[data.to];
      if (target) {
        target.send(JSON.stringify({
          type: "incoming",
          from: ws.number
        }));
      }
    }

    if (data.type === "signal") {
      const target = users[data.to];
      if (target) target.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    if (ws.number) delete users[ws.number];
  });
});
