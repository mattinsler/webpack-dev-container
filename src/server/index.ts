import * as fs from "fs";
import * as cors from "cors";
import * as path from "path";
import * as crypto from "crypto";
import * as morgan from "morgan";
import * as express from "express";
import * as bodyParser from "body-parser";
import { Server as WebSocketServer } from "uws";
import { Duplex, Writable } from "stream";

import { Session } from "./session";
import { accept } from "../common/socket";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());

const port = JSON.parse(process.env["PORT"] || "3000");
const http = app.listen(port, () => console.log(`Listening on port ${port}`));

const wss = new WebSocketServer({ server: http });

wss.on("connection", connection => {
  const socket = accept(connection);
  Session.create(socket);
});
