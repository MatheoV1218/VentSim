import type { WaveformSample } from "../engine/types";

/** Fixed-size mutable ring buffer. Lives outside React/Zustand state so pushes
 * (up to 60/sec) don't trigger component re-renders — canvases read it directly in rAF. */
export class RingBuffer {
  private samples: WaveformSample[];
  private writeIndex = 0;
  private count = 0;
  readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.samples = new Array(capacity);
  }

  push(sample: WaveformSample) {
    this.samples[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }

  /** Returns samples oldest-first. */
  toArray(): WaveformSample[] {
    if (this.count < this.capacity) {
      return this.samples.slice(0, this.count);
    }
    return [...this.samples.slice(this.writeIndex), ...this.samples.slice(0, this.writeIndex)];
  }

  clear() {
    this.writeIndex = 0;
    this.count = 0;
  }
}
