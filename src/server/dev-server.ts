import { EventEmitter } from "events";
import { ChildProcess, spawn } from "child_process";

export class DevServer extends EventEmitter {
  private readonly root: string;

  private server?: ChildProcess;

  constructor(root: string) {
    super();

    this.root = root;
  }

  async install() {
    console.log("== INSTALL ==");

    this.emit("task", "begin", "Installing dependencies");

    await new Promise(resolve => {
      const proc = spawn("/bin/sh", ["-c", "yarn --json"], {
        cwd: this.root,
        stdio: "inherit"
      });
      proc.once("close", () => resolve());
    });

    this.emit("task", "end", "Installing dependencies");
  }

  refresh() {
    console.log("== REFRESH ==");
  }

  async restart() {
    console.log("== RESTART ==");

    await this.stop();
    await this.start();
  }

  start(): Promise<void> {
    console.log("== START ==");

    if (this.server) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.server = spawn("/bin/sh", ["-c", "webpack-dev-server --port 9000"], {
        cwd: this.root,
        stdio: "pipe"
      });
      this.server.stdout.on("data", text => {
        process.stdout.write(text);
        this.emit("log", "stdout", text);
      });
      this.server.stderr.on("data", text => {
        process.stderr.write(text);
        this.emit("log", "stderr", text);
      });

      // this.server.on("close", (code: number, signal: string) => {});
    });
  }

  stop(): Promise<void> {
    console.log("== STOP ==");

    if (!this.server) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.server.once("close", () => resolve());
      this.server.kill();
    });
  }
}
