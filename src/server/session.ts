import * as path from "path";
import * as fs from "fs-extra";
import * as crypto from "crypto";

import { Socket } from "../common/socket";

export class Session {
  static async create(socket: Socket): Promise<Session> {
    const root = path.join(
      process.cwd(),
      crypto.randomBytes(16).toString("hex")
    );

    await fs.mkdir(root);
    return new Session(root, socket);
  }

  readonly root: string;
  readonly socket: Socket;

  constructor(root: string, socket: Socket) {
    this.root = root;
    this.socket = socket;

    this.socket.on("message", this.onMessage);
    this.socket.on("disconnected", this.onDisconnected);

    process.on("beforeExit", this.closeSync);

    console.log("new session");
  }

  private onMessage = (data: any) => {
    console.log("MESSAGE", data);
  };

  private onDisconnected = () => {
    this.close();
  };

  // force a close of the session
  close = async () => {
    process.removeListener("beforeExit", this.closeSync);

    if (await fs.pathExists(this.root)) {
      await fs.rmdir(this.root);
    }

    console.log("session ended");
  };

  // same as end but using synchronous methods (used on process.exit)
  closeSync = () => {
    process.removeListener("beforeExit", this.closeSync);

    if (fs.existsSync(this.root)) {
      fs.rmdirSync(this.root);
    }

    console.log("session ended");
  };
}
