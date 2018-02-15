import { spawn } from 'child_process';
// import * as Webpack from 'webpack';
// import * as WebpackDevServer from 'webpack-dev-server';

export class DevServer {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  install() {
    console.log('== INSTALL ==');
    
    return new Promise(resolve => {
      const proc = spawn('/bin/sh', ['-c', 'npm install'], { cwd: this.root, stdio: 'inherit' });
      proc.on('close', (code: number, string: string) => {
        resolve();
      });
    });  
  }

  refresh() {
    console.log('== REFRESH ==');
  }

  restart() {
    console.log('== RESTART ==');
  }
}
