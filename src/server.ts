import * as fs from 'fs';
import * as tar from 'tar';
import * as cors from 'cors';
import * as path from 'path';
import * as crypto from 'crypto';
import * as morgan from 'morgan';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Server as WebSocketServer } from 'uws';
import { Duplex, Writable } from 'stream';

import { accept } from './socket-stream';

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());

const port = JSON.parse(process.env['PORT'] || '3000');
const http = app.listen(port, () => console.log(`Listening on port ${port}`));

const wss = new WebSocketServer({ server: http });

const ROOT = path.join(process.cwd(), crypto.randomBytes(16).toString('hex'));
fs.mkdirSync(ROOT);

// process.on('beforeExit', () => fs.unlinkSync(ROOT));

wss.on('connection', socket => {
  console.log('new connection');
  const socketStream = accept(socket);

  socketStream.on('data', console.log);

  // const plex = multiplex((stream: Duplex, id: string) => {
  //   console.log('NEW MULTIPLEXED STREAM', id);
    
  //   if (id === 'protocol') {
  //     stream.on('data', (message: Buffer) => {
  //       const data = notepack.decode(message);
  //       console.log(data);
  //       if (data.type === 'update') {
  //         for (const file of data.removed) {
  //           fs.unlinkSync(path.join(ROOT, file));
  //         }

  //         const tarExtractStream = tar.extract({ cwd: ROOT }, data.changed);
  //         const tarStream = plex.receiveStream(data.id);

  //         tarStream.pipe(tarExtractStream);
  //         tarExtractStream.on('close', () => {
  //           console.log('Tar extract complete');
  //           console.log(data.changed);
  //         });

  //         stream.write(notepack.encode({
  //           type: 'update',
  //           id: data.id
  //         }));
  //       }
  //     });
  //   }
  // });

  // socketStream.pipe(plex).pipe(socketStream);

  socketStream.on('close', () => console.log('socket closed'));

  /*
  - listen for messages
  - on 'TAR', wrap in websocket-stream/stream and pipe to tar.extract
  */

  // let extract: Writable | undefined;

  // function onMessage(data: Buffer) {
  //   if (extract) {
  //     // push data into extract until it closes
  //     extract.write(data);
  //   }

  //   console.log(data);
  //   tar.extract({
  //     cwd: ROOT
  //   });
  // }

  // socket.on('message', onMessage);

  // socket.on('close', () => {
  //   console.log('socket closed');
  // });
});
