import { Duplex } from "stream";
import * as WebSocket from "uws";
const pumpify = require("pumpify");

import { MsgpackEncoder } from "./msgpack-encoder";
import { ObjectDecodeStream, ObjectEncodeStream } from "./object-stream";

const websocketStream = require("websocket-stream/stream");

interface EncodedSocket<T extends PayloadEncoder> {
  send(payload: T["payloadType"]): void;
}

export interface ReconnectingStream {
  emit(event: "connecting"): boolean;
  emit(event: "connected"): boolean;
  emit(event: "disconnected"): boolean;

  on(event: "connecting", listener: () => void): this;
  on(event: "connected", listener: () => void): this;
  on(event: "disconnected", listener: () => void): this;
}

export type SocketStream = Duplex & ReconnectingStream;

function createStream(socket: WebSocket): SocketStream {
  const encoder = new ObjectEncodeStream(MsgpackEncoder);
  const decoder = new ObjectDecodeStream(MsgpackEncoder);
  const stream = websocketStream(socket, {
    binary: true,
    perMessageDeflate: false
  });

  return pumpify(encoder, stream, decoder);

  // return stream;
}

// const connector = inject(url => createStream(new WebSocket(url)));

export function connect(url: string): SocketStream {
  const stream = createStream(new WebSocket(url));
  setImmediate(() => stream.emit("connected"));
  return stream;

  // return new Promise((resolve, reject) => {
  //   const conn = connector({}, stream => {
  //     console.log('connector got stream');
  //     conn.on('error', err => stream.emit('error', err));
  //     conn.on('connect', err => stream.emit('connect'));
  //     conn.on('reconnect', err => stream.emit('reconnect'));
  //     conn.on('disconnect', err => stream.emit('disconnect'));

  //     setImmediate(() => stream.emit('connect'));

  //     resolve(stream);
  //   });

  //   conn.connect(url);
  // });
}

export function accept(socket: WebSocket): SocketStream {
  return createStream(socket);
}
