import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import debounce = require('lodash.debounce');

export interface WatcherChanges {
  mkdir: string[];
  changed: string[];
  removed: string[];
}

export interface WatcherEmitter {
  on(event: 'change', listener: (changes: WatcherChanges) => void): this;
}

export class Watcher extends EventEmitter implements WatcherEmitter {
  private root: string;
  private watcher: chokidar.FSWatcher;

  private mkdir = new Set<string>();
  private changed = new Set<string>();
  private removed = new Set<string>();

  constructor(root: string) {
    super();

    this.root = fs.realpathSync(root);

    this.watcher = chokidar.watch(this.root, {
      cwd: this.root,
      ignored: [
        'node_modules',
        'node_modules/**',
        '**/.*'
      ],
      // ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('error', this.onError);
    this.watcher.on('ready', this.onReady);

    this.watcher.on('add', this.onAdd);
    this.watcher.on('change', this.onChange);
    this.watcher.on('unlink', this.onUnlink);

    this.watcher.on('addDir', this.onAddDir);
    this.watcher.on('unlinkDir', this.onUnlinkDir);
  }

  private notify = debounce(() => {
    this.emit('change', {
      mkdir: Array.from(this.mkdir),
      changed: Array.from(this.changed),
      removed: Array.from(this.removed)
    });
  }, 1000);

  private onError = (err: Error) => {
    console.log(err.stack);
  }

  private onReady = () => {
    // [directory: string]: string[];
    // console.log(this.watcher.getWatched());
  }

  private onAdd = (file: string) => {
    this.changed.add(file);
    this.notify();
  }

  private onChange = (file: string) => {
    this.changed.add(file);
    this.notify();
  }

  private onUnlink = (file: string) => {
    this.removed.add(file);
    this.notify();
  }

  private onAddDir = (file: string) => {
    this.mkdir.add(file);
    this.notify();
  }

  private onUnlinkDir = (file: string) => {
    this.removed.add(file);
    this.notify();
  }

  get allChanges(): WatcherChanges {
    const changes: WatcherChanges = {
      changed: [],
      mkdir: [],
      removed: []
    };

    const watched = this.watcher.getWatched();
    for (const dir of Object.keys(watched)) {
      changes.mkdir.push(dir);
      for (const file of watched[dir]) {
        changes.changed.push(path.join(dir, file));
      }
    }

    return changes;
  }
}
