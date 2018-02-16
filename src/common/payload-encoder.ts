const notepack = require("notepack.io");
import { Header, HeaderData } from "./header";

export interface DecodedPayload {
  header: HeaderData;
  payload: any;
  remainingBuffer: Buffer;
}

export const PayloadEncoder = {
  encode(value: any): Buffer {
    const encoded = notepack.encode(value);
    const header = Header.encode({ version: 1, size: encoded.length });
    return Buffer.concat([header, encoded]);
  },

  decode(value: Buffer): DecodedPayload | null {
    const header = value.length > Header.length && Header.decode(value);

    if (header && value.length >= Header.length + header.size) {
      const payload = notepack.decode(
        value.slice(Header.length, Header.length + header.size)
      );
      const remainingBuffer = value.slice(Header.length + header.size);
      return { header, payload, remainingBuffer };
    }

    return null;
  }
};
