const notepack = require("notepack.io");

export interface DecodedPayload {
  payload: any;
  remainingBuffer: Buffer;
}

export const PayloadEncoder = {
  encode(value: any): Buffer {
    return notepack.encode(value);
  },

  decode(value: Buffer): DecodedPayload | null {
    try {
      const payload = notepack.decode(value);
      return { payload, remainingBuffer: new Buffer(0) };
    } catch (err) {
      const match = err.message.trim().match(/^([0-9]+) trailing bytes$/);
      if (match) {
        const size = parseInt(match[1], 10);
        const payload = notepack.decode(value.slice(0, size));
        return { payload, remainingBuffer: value.slice(size) };
      }

      return null;
    }
  }
};
