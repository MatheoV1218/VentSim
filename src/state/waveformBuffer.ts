import { RingBuffer } from "../waveforms/ringBuffer";

// ~60Hz for 12 seconds of scrollback. Lives outside Zustand/React state deliberately.
export const waveformBuffer = new RingBuffer(60 * 12);
