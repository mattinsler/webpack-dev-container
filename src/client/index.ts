import { EOL } from "os";
import * as betturl from "betturl";
// import { Duplex } from "stream";
// import * as crypto from "crypto";

// import { connect } from "../common/socket-stream";
// import { Watcher, WatcherChanges } from "./watcher";
import { connect } from "../common/socket";

// function sendFiles(socket: Socket, files: string[]) {
//   return tar.create({ gzip: true, portable: true, cwd: process.cwd() }, files);
// }

interface Update {
  id: string;
  changed: string[];
  removed: string[];
}

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

  // const watcher = new Watcher(root);
  const socket = await connect(url);

  socket.on("connected", () => {
    socket.send({ hello: new Date() });
  });

  // socket.on("error", err => console.log("ERROR", err.stack));
  // socket.on("connecting", () => console.log("connecting"));
  // socket.on("connected", () => console.log("connected"));
  // socket.on("disconnected", () => console.log("disconnected"));
  // socket.on("reconnect", () => console.log("reconnect"));
  // socket.on("disconnect", () => console.log("disconnect"));

  // let updateQueue: Update[] = [];
  // let currentUpdate: Update | undefined;

  // function processUpdateQueue() {
  //   console.log('processUpdateQueue', updateQueue.length);
  //   if (updateQueue.length === 0) { return; }
  //   if (currentUpdate) { return; }

  //   currentUpdate = updateQueue.pop();
  //   const { id, changed, removed } = currentUpdate;

  //   protocol.write(notepack.encode({
  //     type: 'update',
  //     id,
  //     changed,
  //     removed
  //   }));
  // }

  // protocol.on('data', (message: Buffer) => {
  //   const data = notepack.decode(message);
  //   console.log(data);

  //   if (data.type === 'update' && data.id === currentUpdate.id) {
  //     const tarStream = plex.createStream(currentUpdate.id);

  //     tar.create(
  //       { gzip: true, portable: true, cwd: process.cwd() },
  //       currentUpdate.changed
  //     ).pipe(tarStream);

  //     tarStream.on('close', () => {
  //       console.log('Tar send complete');
  //       processUpdateQueue();
  //     });
  //   }
  // });

  // function sendUpdate({ changed, removed }: WatcherChanges) {
  //   updateQueue.push({
  //     id: crypto.randomBytes(16).toString('hex'),
  //     changed,
  //     removed
  //   });
  //   processUpdateQueue();
  // }

  // socket.on('connect', () => sendUpdate(watcher.allChanges));
  // socket.on('disconnect', () => updateQueue = []);
}

// watcher.on('change', ({ mkdir, changed, removed }) => {
//   console.log({ mkdir, changed, removed });

//   tar.create({ gzip: true, portable: true, cwd: process.cwd() })
// });

main(process.argv[2]);
