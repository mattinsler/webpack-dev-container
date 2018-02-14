declare namespace betturl {
  interface Querystring {
    [key: string]: string;
  }

  interface Address {
    host: string;
    port: number;
  }

  interface ParsedURL extends Address {
    url: string;
    path: string;
    query: Querystring;
    hash: string;
    protocol?: string;
    hosts: Address[];
  }

  interface ParseOptions {
    parse_query?: boolean;
  }
}

declare module "betturl" {
  export function parse(
    url: string,
    opts?: betturl.ParseOptions
  ): betturl.ParsedURL;
  export function format(parsedUrl: Partial<betturl.ParsedURL>): string;
}
