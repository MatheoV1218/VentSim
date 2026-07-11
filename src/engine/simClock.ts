export type SimSpeed = 0 | 1 | 2 | 4; // 0 = paused

export interface SimClock {
  simTime: number; // seconds of sim-time elapsed
  speed: SimSpeed;
}

export function createSimClock(): SimClock {
  return { simTime: 0, speed: 1 };
}

/** Advance sim clock by a real wall-clock delta (seconds), scaled by speed. Returns new clock + scaled dt. */
export function advanceClock(clock: SimClock, wallDtSeconds: number): { clock: SimClock; simDt: number } {
  const simDt = wallDtSeconds * clock.speed;
  return { clock: { ...clock, simTime: clock.simTime + simDt }, simDt };
}
