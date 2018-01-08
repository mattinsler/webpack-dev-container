import { Duplex } from 'stream';
import * as crypto from 'crypto';

import { connect } from './socket-stream';
import { Watcher, WatcherChanges } from './watcher';


// function sendFiles(socket: Socket, files: string[]) {
//   return tar.create({ gzip: true, portable: true, cwd: process.cwd() }, files);
// }

interface Update {
  id: string;
  changed: string[];
  removed: string[];
}

async function main() {
  const watcher = new Watcher(process.cwd());
  const socket = await connect('ws://localhost:3000');

  socket.on('error', err => console.log(err.stack));
  socket.on('connect', () => console.log('connect'));
  socket.on('reconnect', () => console.log('reconnect'));
  socket.on('disconnect', () => console.log('disconnect'));

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
  socket.on('connect', () => {
    console.log('connected');
    socket.write({ hello: new Date() });
  });
  // socket.on('disconnect', () => updateQueue = []);
}

// watcher.on('change', ({ mkdir, changed, removed }) => {
//   console.log({ mkdir, changed, removed });

//   tar.create({ gzip: true, portable: true, cwd: process.cwd() })
// });

main();
