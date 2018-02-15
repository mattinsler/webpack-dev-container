import * as path from "path";
import * as fs from "fs-extra";

import { Socket } from "../common/socket";
import { Watcher, WatcherChanges } from "./watcher";
import {
  isLogMessage,
  isTaskMessage,
  LogMessage,
  Message,
  TaskMessage
} from "../common/messages";

export class Session {
  private readonly socket: Socket;
  private readonly watcher: Watcher;

  constructor(socket: Socket, watcher: Watcher) {
    this.socket = socket;
    this.watcher = watcher;

    this.socket.on("connected", this.onConnected);
    this.socket.on("message", this.onMessage);
    // this.socket.on("disconnected", this.onDisconnected);
    this.watcher.on("change", this.onWatcherChange);
  }

  private onConnected = () => {
    this.sendChange(this.watcher.allChanges);
  };

  // private onDisconnected = () => {

  // };

  private onMessage = (message: Message) => {
    if (isLogMessage(message)) {
      process[message.stream].write(message.text);
    } else if (isTaskMessage(message)) {
      console.log(`[TASK ${message.operation.toUpperCase()}] ${message.name}`);
    }
  };

  private onWatcherChange = () => {
    if (this.socket.connected) {
      this.sendChange(this.watcher.takeChanges());
    }
  };

  private async sendChange(changes: WatcherChanges) {
    const changed: { [file: string]: Buffer } = {};

    await Promise.all(
      changes.changed.map(async file => {
        try {
          changed[file] = await fs.readFile(path.join(this.watcher.root, file));
        } catch (err) {
          console.log(file, path.join(this.watcher.root, file));
          console.log(err.stack);
        }
      })
    );

    this.socket.send({
      type: "change",
      ...changes,
      changed
    });
  }
}
