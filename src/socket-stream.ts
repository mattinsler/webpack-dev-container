import { Duplex } from 'stream';
import * as WebSocket from 'uws';
const pumpify = require('pumpify');

import { MsgpackEncoder } from './msgpack-encoder';
import { ObjectDecodeStream, ObjectEncodeStream } from './object-stream';

// const inject = require('reconnect-core');
const websocketStream = require('websocket-stream/stream');

function createStream(socket: WebSocket) {
  const encoder = new ObjectEncodeStream(MsgpackEncoder);
  const decoder = new ObjectDecodeStream(MsgpackEncoder);
  const stream = websocketStream(socket, { binary: true, perMessageDeflate: false });

  return pumpify(encoder, stream, decoder);
}

// const connector = inject(url => createStream(new WebSocket(url)));

export function connect(url: string): Duplex {
  const stream = createStream(new WebSocket(url));
  setImmediate(() => stream.emit('connect'));
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

export function accept(socket: WebSocket) {
  return createStream(socket);
}
