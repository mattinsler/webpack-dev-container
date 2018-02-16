export type BackoffFn = (backoff: Fibonacci, ms: number) => void;

export interface FibonacciOpts {
  min: number;
  max: number;
}

export class Fibonacci {
  private timeoutId?: NodeJS.Timer;
  private last = [0, 1];

  private readonly fn: BackoffFn;
  private readonly opts: FibonacciOpts;

  constructor(fn: BackoffFn, opts: Partial<FibonacciOpts> = {}) {
    this.fn = fn;
    this.opts = {
      min: opts.min || 0,
      max: opts.max || 5000
    };
  }

  cancel = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      delete this.timeoutId;
    }
    this.reset();
  };

  reset = () => {
    this.last = [0, 1];
  };

  trigger = () => {
    const { last } = this;
    const next = Math.min(this.opts.max, last[0] + last[1]);
    this.last = [this.last[1], next];
    this.timeoutId = setTimeout(() => this.fn(this, next), next);
  };
}
