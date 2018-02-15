import * as WebSocket from "uws";
import { EventEmitter } from "events";

import { Fibonacci } from "./backoff-fibonacci";
import { PayloadEncoder } from "./payload-encoder";

const debug = require("debug")("socket");

export interface Socket extends EventEmitter {
  connected: boolean;
  connecting: boolean;

  disconnect();

  emit(event: "connecting", backoffMillis: number): boolean;
  emit(event: "connected"): boolean;
  emit(event: "disconnected"): boolean;
  emit(event: "message", data: any): boolean;

  on(event: "connecting", listener: (backoffMillis: number) => void): this;
  on(event: "connected", listener: () => void): this;
  on(event: "disconnected", listener: () => void): this;
  on(event: "message", listener: (data: any) => void): this;

  send(payload: any): void;
}

class PayloadContainer {
  private buffer = Buffer.allocUnsafe(0);

  // returns payloads
  append(value: Buffer): any[] {
    let result;
    const payloads: any[] = [];
    this.buffer = Buffer.concat([this.buffer, value]);

    while ((result = PayloadEncoder.decode(this.buffer)) !== null) {
      const { payload, remainingBuffer } = result;
      payloads.push(payload);
      this.buffer = remainingBuffer;
    }

    return payloads;
  }
}

class ClientSocket extends EventEmitter implements Socket {
  private disconnectRequested = false;
  private payload = new PayloadContainer();
  private socket: {
    connected?: WebSocket;
    connecting?: WebSocket;
  } = {};

  url: string;

  constructor(url: string) {
    super();

    this.url = url;
    setImmediate(() => this.connect());
  }

  get connected() {
    return !!this.socket.connected;
  }
  get connecting() {
    return !!this.socket.connecting;
  }

  disconnect() {
    this.disconnectRequested = true;

    if (this.connecting) {
      this.socket.connecting.close();
      delete this.socket.connecting;
    }
    if (this.connected) {
      this.socket.connected.close();
      delete this.socket.connected;
    }
  }

  private onMessage = (data: Buffer, flags: { binary: boolean }) => {
    for (const payload of this.payload.append(data)) {
      debug("message", payload);
      this.emit("message", payload);
    }
  };

  private connect() {
    const _connect = (backoff: Fibonacci, ms: number) => {
      const socket = (this.socket.connecting = new WebSocket(this.url));

      // connection lost
      socket.on("close", (code: number, message: string) => {
        backoff.trigger();

        debug("disconnected");
        this.emit("disconnected");
      });
      // could not connect
      socket.on("error", (err: Error) => {
        backoff.trigger();
      });
      socket.on("open", () => {
        backoff.cancel();

        this.socket.connected = socket;
        delete this.socket.connecting;

        // attach to new socket
        socket.on("message", this.onMessage);

        debug("connected");
        this.emit("connected");
      });

      debug(`connecting (after ${ms}ms)`);
      this.emit("connecting", ms);
    };

    const backoff = new Fibonacci(_connect);
    backoff.trigger();
  }

  send(payload: any): Promise<void> {
    if (!this.connected) {
      throw new Error("Cannot send messages while disconnected");
    }

    return new Promise((resolve, reject) => {
      this.socket.connected.send(
        PayloadEncoder.encode(payload),
        { binary: true },
        err => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });
  }
}

class ServerSocket extends EventEmitter implements Socket {
  private backlog: any[] = [];
  private payload = new PayloadContainer();

  private readonly socket: WebSocket;

  constructor(socket: WebSocket) {
    super();

    this.socket = socket;

    socket.on("close", (code: number, message: string) => {
      debug("disconnected");
      this.emit("disconnected");
    });
    socket.on("message", this.onMessage);
  }

  get connected() {
    return this.socket.readyState === WebSocket.OPEN;
  }

  connecting = false;

  private onMessage = (data: Buffer, flags: { binary: boolean }) => {
    data = Buffer.from(data);

    for (const payload of this.payload.append(data)) {
      if (this.listenerCount("message") === 0) {
        this.backlog.push(payload);
      } else {
        debug("message", payload);
        this.emit("message", payload);
      }
    }
  };

  disconnect() {
    this.socket.close();
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    if (event === "message") {
      const payloads = [...this.backlog];
      this.backlog = [];

      setImmediate(() => {
        for (const payload of payloads) {
          debug("message", payload);
          this.emit("message", payload);
        }
      });
    }

    return super.on(event, listener);
  }

  send(payload: any): Promise<void> {
    if (!this.connected) {
      throw new Error("Cannot send messages while disconnected");
    }

    return new Promise((resolve, reject) => {
      this.socket.send(
        PayloadEncoder.encode(payload),
        { binary: true },
        err => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });
  }
}

export function connect(url: string): Socket {
  return new ClientSocket(url);
}

export function accept(connection: WebSocket): Socket {
  return new ServerSocket(connection);
}
