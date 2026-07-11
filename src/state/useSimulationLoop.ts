import { useEffect, useRef } from "react";
import { useSimulationStore } from "./simulationStore";

/** Drives the simulation forward every animation frame. Mount once near the app root. */
export function useSimulationLoop() {
  const advance = useSimulationStore((s) => s.advance);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const step = (time: number) => {
      if (lastTimeRef.current !== null) {
        const wallDt = Math.min((time - lastTimeRef.current) / 1000, 0.1); // clamp to avoid huge jumps on tab-away
        advance(wallDt);
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [advance]);
}
