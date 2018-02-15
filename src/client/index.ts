import { EOL } from "os";
import * as betturl from "betturl";

import { Session } from './session';
import { Watcher } from "./watcher";
import { connect, Socket } from "../common/socket";

function makeWsUrl(endpoint?: string): string {
  if (!endpoint) {
    return "ws://localhost:3000";
  }

  const { host, port } = betturl.parse(endpoint);
  return "ws://" + [host, port].filter(a => a).join(":");
}

async function main(endpoint?: string) {
  const url = makeWsUrl(endpoint);
  const root = process.cwd();

  console.log([`- Watching ${root}`, `- Streaming to ${url}`].join(EOL));

  const watcher = await Watcher.start(root);
  const socket = connect(url);

  new Session(socket, watcher);
}

main(process.argv[2]);
