import { createGzip } from 'zlib';

const notepack = require('notepack.io');

import { ObjectEncoder } from './object-stream';

const MsgpackEncoder: ObjectEncoder = {
  version: 1,
  encode(value: any): Buffer {
    return notepack.encode(value);
  },
  decode(value: Buffer, version: number): any {
    return notepack.decode(value);
  }
};

export { MsgpackEncoder }
