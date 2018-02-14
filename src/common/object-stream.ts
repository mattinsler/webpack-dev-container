import { Duplex, Transform } from "stream";

export interface ObjectEncoder<T> {
  version: number;
  encode(value: T): Buffer;
  decode(value: Buffer, version: number): T;
}

interface HeaderData {
  version: number;
  length: number;
}

const Header = {
  length: 5,

  encode(data: HeaderData): Buffer {
    const header = Buffer.allocUnsafe(5);

    header.writeUInt8(data.version, 0);
    header.writeInt32BE(data.length, 1);

    return header;
  },

  decode(buffer: Buffer): HeaderData {
    if (buffer.length < Header.length) {
      throw new Error("Header is invalid size");
    }

    return {
      version: buffer.readUInt8(0),
      length: buffer.readUInt32BE(1)
    };
  }
};

export class ObjectEncodeStream<T> extends Transform {
  private readonly encoder: ObjectEncoder<T>;

  constructor(encoder: ObjectEncoder<T>) {
    super({ writableObjectMode: true });
    this.encoder = encoder;
  }

  _transform(chunk: any, encoding: string, callback: Function): void {
    console.log("ObjectEncodeStream::_transform", chunk);
    const encoded = this.encoder.encode(chunk);
    const header = Header.encode({ version: 1, length: encoded.length });
    this.push(Buffer.concat([header, encoded]));
    callback();
  }
}

export class ObjectDecodeStream<T> extends Transform {
  private buffer = Buffer.alloc(0);
  private header?: HeaderData;

  private readonly encoder: ObjectEncoder<T>;

  constructor(encoder: ObjectEncoder<T>) {
    super({ readableObjectMode: true });
    this.encoder = encoder;
  }

  _transform(chunk: any, encoding: string, callback: Function): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    // read the header if we have enough bytes and no current header
    if (!this.header && this.buffer.length >= Header.length) {
      this.header = Header.decode(this.buffer);
    }

    // read the next packet if we have a current header and enough bytes for the packet it describes
    if (
      this.header &&
      this.buffer.length >= Header.length + this.header.length
    ) {
      const decoded = this.encoder.decode(
        this.buffer.slice(Header.length, Header.length + this.header.length),
        this.header.version
      );
      this.buffer = this.buffer.slice(Header.length + this.header.length);
      this.push(decoded);
    }

    callback();
  }
}
