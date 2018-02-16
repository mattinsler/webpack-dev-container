import * as fs from "fs";
import * as path from "path";
import { Server as WebSocketServer } from "uws";

import { Session } from "./session";
import { accept } from "../common/socket";

const port = JSON.parse(process.env["PORT"] || "3000");
const server = new WebSocketServer({ port });

server.on("connection", connection => {
  const socket = accept(connection);
  Session.create(socket);
});
