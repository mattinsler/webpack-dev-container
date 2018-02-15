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
  on(event: 'change', listener: () => void): this;
}

export class Watcher extends EventEmitter implements WatcherEmitter {
  static start(root: string): Promise<Watcher> {
    root = fs.realpathSync(root);

    return new Promise(resolve => {
      const watcher = chokidar.watch(root, {
        cwd: root,
        ignored: [
          'node_modules',
          'node_modules/**',
          '**/.*'
        ],
        ignoreInitial: true,
        persistent: true
      });

      watcher.once('ready', () => {
        resolve(new Watcher(root, watcher));
      });
    });
  }

  private readonly watcher: chokidar.FSWatcher;
  readonly root: string;

  private changes = {
    mkdir: new Set<string>(),
    changed: new Set<string>(),
    removed: new Set<string>(),
  };

  private constructor(root: string, watcher: chokidar.FSWatcher) {
    super();

    this.root = root;
    this.watcher = watcher;

    this.watcher.on('error', this.onError);

    this.watcher.on('add', this.onAdd);
    this.watcher.on('change', this.onChange);
    this.watcher.on('unlink', this.onUnlink);

    this.watcher.on('addDir', this.onAddDir);
    this.watcher.on('unlinkDir', this.onUnlinkDir);
  }

  private notify = debounce(() => {
    this.emit('change', 1000);
  });

  private onError = (err: Error) => {
    console.log(err.stack);
  }

  private onAdd = (file: string) => {
    this.changes.changed.add(file);
    this.notify();
  }

  private onChange = (file: string) => {
    this.changes.changed.add(file);
    this.notify();
  }

  private onUnlink = (file: string) => {
    this.changes.removed.add(file);
    this.notify();
  }

  private onAddDir = (file: string) => {
    this.changes.mkdir.add(file);
    this.notify();
  }

  private onUnlinkDir = (file: string) => {
    this.changes.removed.add(file);
    this.notify();
  }

  get allChanges(): WatcherChanges {
    const changes: WatcherChanges = {
      changed: [],
      mkdir: [],
      removed: []
    };

    const watched = this.watcher.getWatched();

    for (const dir of Object.keys(watched).filter(d => d !== '..')) {
      if (dir !== '.') {
        changes.mkdir.push(dir);
      }
      for (const file of watched[dir]) {
        changes.changed.push(path.join(dir, file));
      }
    }

    return changes;
  }

  takeChanges(): WatcherChanges {
    const changes: WatcherChanges = {
      changed: Array.from(this.changes.changed),
      mkdir: Array.from(this.changes.mkdir),
      removed: Array.from(this.changes.removed),
    };

    this.changes = {
      mkdir: new Set<string>(),
      changed: new Set<string>(),
      removed: new Set<string>(),
    };
    
    return changes;
  }
}
