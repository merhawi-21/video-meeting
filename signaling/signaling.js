import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3001 });
let rooms = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.join) {
      if (!rooms[data.join]) rooms[data.join] = [];
      rooms[data.join].push(ws);
      ws.room = data.join;
      return;
    }

    if (ws.room) {
      rooms[ws.room].forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on("close", () => {
    if (ws.room) {
      rooms[ws.room] = rooms[ws.room].filter((c) => c !== ws);
    }
  });
});

console.log("Signaling server running on ws://localhost:3001");
