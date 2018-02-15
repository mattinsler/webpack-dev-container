import * as path from "path";
import * as fs from "fs-extra";
import * as crypto from "crypto";
import { spawn } from 'child_process';

import { Socket } from "../common/socket";
import { ChangeMessage, isChangeMessage, Message } from '../common/messages';

function install(root: string) {
  return new Promise(resolve => {
    const proc = spawn('/bin/sh', ['-c', 'npm install'], { cwd: root, stdio: 'inherit' });
    proc.on('close', (code: number, string: string) => {
      resolve();
    });
  });
}

function restart() {
  return new Promise(resolve => {

  });
}

class ChangeSets {
  private readonly root: string;

  private applying = false;
  private changes: ChangeMessage[] = [];

  constructor(root: string) {
    this.root = root;
  }

  private apply = async(): Promise<void> => {
    if (this.applying || this.changes.length === 0) { return; }

    console.log('== APPLY START ==');
    this.applying = true;

    const should = {
      install: false,
      restart: false,
    };

    while (this.changes.length > 0) {
      const changes = [...this.changes];
      this.changes = [];

      for (const { changed, mkdir, removed } of changes) {
        await Promise.all(removed.map(file => fs.remove(path.join(this.root, file))));
        await Promise.all(mkdir.map(file => fs.mkdirs(path.join(this.root, file))));
        await Promise.all(Object.keys(changed).map(file => {
          return fs.writeFile(path.join(this.root, file), changed[file]);
        }));

        if (changed['package.json']) {
          should.install = true;
          should.restart = true;
        } else if (changed['webpack.config.js']) {
          should.restart = true;
        }
      }
    }

    this.applying = false;
    console.log('== APPLY DONE ==');

    if (should.install) {
      await install(this.root);
    }
    if (should.restart) {
      console.log('== RESTART ==');
    }

    // refresh

    setImmediate(this.apply);
  };

  add(change: ChangeMessage) {
    this.changes.unshift(change);
    setImmediate(this.apply);
  }
}

export class Session {
  static async create(socket: Socket): Promise<Session> {
    const root = path.join(process.cwd(), "sessions", crypto.randomBytes(16).toString("hex"));

    console.log("New session", root);

    await fs.mkdirs(root);
    return new Session(root, socket);
  }

  private readonly changeSets: ChangeSets;

  readonly root: string;
  readonly socket: Socket;

  constructor(root: string, socket: Socket) {
    this.root = root;
    this.socket = socket;
    this.changeSets = new ChangeSets(root);

    this.socket.on("message", this.onMessage);
    this.socket.on("disconnected", this.onDisconnected);

    process.on("beforeExit", this.closeSync);
  }

  private onMessage = (data: Message) => {
    if (isChangeMessage(data)) {
      this.changeSets.add(data);
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

    if (await fs.pathExists(this.root)) {
      await fs.remove(this.root);
    }
  };

  // same as end but using synchronous methods (used on process.exit)
  closeSync = () => {
    console.log("Session::closeSync");
    process.removeListener("beforeExit", this.closeSync);

    if (fs.existsSync(this.root)) {
      fs.removeSync(this.root);
    }
  };
}
