import * as fs from "fs";
import { EOL } from "os";
import * as net from "net";
import * as path from "path";
import { Server as WebSocketServer } from "uws";

import { Session } from "./session";
import { accept } from "../common/socket";

const port = JSON.parse(process.env["PORT"] || "3000");
const webSocketServer = new WebSocketServer({ port });
const tcpServer = net
  .createServer(connection => {
    const socket = accept(connection);
    Session.create(socket);
  })
  .listen(port + 1);

webSocketServer.on("connection", connection => {
  const socket = accept(connection);
  Session.create(socket);
});

console.log(
  ["Listening", "  - WebSocket: port 3000", "  - TCP:       port 3001"].join(
    EOL
  )
);
