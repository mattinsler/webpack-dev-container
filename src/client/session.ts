import * as path from 'path';
import * as fs from 'fs-extra';

import { Socket } from '../common/socket';
import { Watcher, WatcherChanges } from './watcher';

export class Session {
  private readonly socket: Socket;
  private readonly watcher: Watcher;

  constructor(socket: Socket, watcher: Watcher) {
    this.socket = socket;
    this.watcher = watcher;

    this.socket.on("connected", this.onConnected);
    // this.socket.on("disconnected", this.onDisconnected);
    this.watcher.on("change", this.onWatcherChange);
  }

  private onConnected = () => {
    this.sendChange(this.watcher.allChanges);
  };

  // private onDisconnected = () => {

  // };

  private onWatcherChange = () => {
    if (this.socket.connected) {
      this.sendChange(this.watcher.takeChanges());
    }
  };

  private async sendChange(changes: WatcherChanges) {
    const changed: {[file: string]: Buffer} = {};

    console.log(changes);
    await Promise.all(changes.changed.map(async (file) => {
      try {
        changed[file] = await fs.readFile(path.join(this.watcher.root, file));
      } catch (err) {
        console.log(file, path.join(this.watcher.root, file));
        console.log(err.stack);
      }
    }));

    this.socket.send({
      type: 'change',
      ...changes,
      changed,
    });
  };
}
