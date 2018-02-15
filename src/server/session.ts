import * as path from "path";
import * as fs from "fs-extra";
import * as crypto from "crypto";

import { DevServer } from "./dev-server";
import { Socket } from "../common/socket";
import { ChangeSetManager } from "./change-set-manager";
import { ChangeMessage, isChangeMessage, Message } from "../common/messages";

export class Session {
  static async create(socket: Socket): Promise<Session> {
    const root = path.join(
      process.cwd(),
      "sessions",
      crypto.randomBytes(16).toString("hex")
    );

    console.log("New session", root);

    await fs.mkdirs(root);
    return new Session(root, socket);
  }

  private readonly devServer: DevServer;
  private readonly changeSetManager: ChangeSetManager;

  readonly root: string;
  readonly socket: Socket;

  constructor(root: string, socket: Socket) {
    this.root = root;
    this.socket = socket;
    this.devServer = new DevServer(root);
    this.changeSetManager = new ChangeSetManager(root);

    this.socket.on("message", this.onMessage);
    this.socket.on("disconnected", this.onDisconnected);
    this.changeSetManager.on("apply", this.onChangeSetApply);
    this.devServer.on("log", this.onDevServerLog);
    this.devServer.on("task", this.onDevServerTask);

    process.on("beforeExit", this.closeSync);
  }

  private onDevServerLog = (stream: "stderr" | "stdout", text: string) => {
    this.socket.send({
      type: "log",
      stream,
      text
    });
  };

  private onDevServerTask = (operation: "begin" | "end", name: string) => {
    this.socket.send({
      type: "task",
      operation,
      name,
      taskId: 5
    });
  };

  private onChangeSetApply = async ({
    install,
    refresh,
    restart
  }: {
    install: boolean;
    refresh: boolean;
    restart: boolean;
  }) => {
    console.log("== CHANGE SET APPLIED", { install, restart });

    if (install) {
      await this.devServer.install();
    }
    if (restart) {
      await this.devServer.restart();
    }
    if (refresh) {
      await this.devServer.refresh();
    }
  };

  private onMessage = (data: Message) => {
    if (isChangeMessage(data)) {
      this.changeSetManager.add(data);
    }
  };

  private onDisconnected = () => {
    console.log("Session::onDisconnected");
    this.close();
  };

  // force a close of the session
  close = async () => {
    console.log("Session::close");
    process.removeListener("beforeExit", this.closeSync);

    await this.devServer.stop();

    if (await fs.pathExists(this.root)) {
      await fs.remove(this.root);
    }
  };

  // same as end but using synchronous methods (used on process.exit)
  closeSync = () => {
    console.log("Session::closeSync");
    process.removeListener("beforeExit", this.closeSync);

    this.devServer.stop();

    if (fs.existsSync(this.root)) {
      fs.removeSync(this.root);
    }
  };
}
