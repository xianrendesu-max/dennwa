const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const users = {};

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
