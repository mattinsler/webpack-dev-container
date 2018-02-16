export interface HeaderData {
  version: number;
  size: number;
}

export const Header = {
  length: 5,

  encode(data: HeaderData): Buffer {
    const header = Buffer.allocUnsafe(5);

    header.writeUInt8(data.version, 0);
    header.writeInt32BE(data.size, 1);

    return header;
  },

  decode(buffer: Buffer): HeaderData {
    if (buffer.length < Header.length) {
      throw new Error("Header is invalid size");
    }

    return {
      version: buffer.readUInt8(0),
      size: buffer.readUInt32BE(1)
    };
  }
};
