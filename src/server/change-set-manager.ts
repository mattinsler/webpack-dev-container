import * as path from "path";
import * as fs from "fs-extra";
import { EventEmitter } from "events";

import { ChangeMessage } from "../common/messages";

function trimPath(value: string) {
  return value.trim().replace(/^\/+/, "");
}

export class ChangeSetManager extends EventEmitter {
  private readonly root: string;

  private applying = false;
  private changes: ChangeMessage[] = [];

  constructor(root: string) {
    super();
    this.root = root;
  }

  private apply = async (): Promise<void> => {
    if (this.applying || this.changes.length === 0) {
      return;
    }

    this.applying = true;

    const should = {
      install: false,
      refresh: false,
      restart: false
    };

    while (this.changes.length > 0) {
      const changes = [...this.changes];
      this.changes = [];

      for (const { changed, mkdir, removed } of changes) {
        await Promise.all(
          removed.map(file => fs.remove(path.join(this.root, file)))
        );
        await Promise.all(
          mkdir.map(file => fs.mkdirs(path.join(this.root, file)))
        );
        await Promise.all(
          Object.keys(changed).map(file => {
            return fs.writeFile(path.join(this.root, file), changed[file]);
          })
        );

        if (changed["package.json"]) {
          should.install = true;
          should.restart = true;
        } else if (changed["webpack.config.js"]) {
          should.restart = true;
        }
        if (
          Object.keys(changed).filter(
            f => ["package.json", "webpack.config.js"].indexOf(f) === -1
          ).length > 0
        ) {
          should.refresh = true;
        }
      }
    }

    this.applying = false;

    this.emit("apply", should);

    setImmediate(this.apply);
  };

  add(change: ChangeMessage) {
    this.changes.unshift({
      ...change,
      changed: Object.keys(change.changed).reduce((o, key) => {
        o[trimPath(key)] = change.changed[key];
        return o;
      }, {}),
      mkdir: change.mkdir.map(trimPath),
      removed: change.removed.map(trimPath)
    });
    setImmediate(this.apply);
  }
}
