import type {
  MechanicsState,
  RespiratoryMechanicsParams,
  VentilatorSettings,
} from "../types";

/**
 * Single-compartment lung model (equation of motion):
 *   Paw = PEEPtotal + V/C + R*flow
 * VC mode drives a prescribed flow waveform and derives pressure.
 * PC mode drives a prescribed pressure waveform (with rise-time ramp) and derives flow via
 *   flow = (Ptarget - PEEPtotal - V/C) / R
 * Expiration is always passive (RC exponential decay) regardless of mode, which is what
 * produces auto-PEEP / air trapping when the set expiratory time is short relative to R*C.
 *
 * Plateau pressure is the elastic-only component (PEEPtotal + V/C) at end-inspiration — the
 * same reading a real zero-flow inspiratory pause would show — which is what makes Cdyn/Rdyn
 * (derived from Ppeak vs Pplat) come out physiologically meaningful instead of Ppeak==Pplat.
 */
export function tickBreathCycle(
  mechanics: MechanicsState,
  params: RespiratoryMechanicsParams,
  settings: VentilatorSettings,
  dt: number
): MechanicsState {
  const cycleDuration = 60 / settings.respRate;
  const ti = Math.min(settings.inspTime, cycleDuration * 0.9);
  const te = cycleDuration - ti;
  const { compliance: C, resistance: R } = params;
  const peepTotal = settings.peep + mechanics.autoPeep;

  let { phase, phaseElapsed, cycleElapsed, volume, flow, peakPressure, lastVt, autoPeep } = mechanics;
  let plateauPressure = mechanics.plateauPressure;
  let meanAirwayPressure = mechanics.meanAirwayPressure;
  let dynamicCompliance = mechanics.dynamicCompliance;
  let dynamicResistance = mechanics.dynamicResistance;
  let meanPressureAccum = mechanics.meanPressureAccum;
  let pressure = mechanics.pressure;

  phaseElapsed += dt;
  cycleElapsed += dt;

  if (phase === "insp") {
    if (settings.mode === "VC") {
      flow = settings.tidalVolume / ti; // square pattern; decelerating handled as a shape hint in UI only for M0
      volume += flow * dt;
      pressure = peepTotal + volume / C + R * flow;
    } else {
      // PC: ramp target pressure over riseTime, then hold.
      const targetAbovePeep = settings.pressureControl;
      const rampFrac = settings.riseTime > 0 ? Math.min(phaseElapsed / settings.riseTime, 1) : 1;
      const targetPressure = peepTotal + targetAbovePeep * rampFrac;
      flow = (targetPressure - peepTotal - volume / C) / Math.max(R, 0.1);
      volume += flow * dt;
      pressure = peepTotal + volume / C + R * flow;
    }
    peakPressure = Math.max(peakPressure, pressure);
    meanPressureAccum += pressure * dt;

    if (phaseElapsed >= ti) {
      lastVt = volume;
      plateauPressure = peepTotal + volume / C;
      dynamicResistance = flow > 0.001 ? (peakPressure - plateauPressure) / flow : 0;
      dynamicCompliance = plateauPressure - peepTotal > 0.001 ? volume / (plateauPressure - peepTotal) : C;
      phase = "exp";
      phaseElapsed = 0;
    }
  } else {
    // Passive exhalation: dV/dt = -V / (R*C)
    const tau = Math.max(R * C, 0.05);
    flow = -volume / tau;
    volume = Math.max(volume + flow * dt, 0);
    pressure = peepTotal + volume / C + R * flow;
    meanPressureAccum += pressure * dt;

    if (phaseElapsed >= te) {
      // Whatever volume remains above baseline is trapped gas -> auto-PEEP for next breath.
      autoPeep = volume / C;
      meanAirwayPressure = cycleElapsed > 0.001 ? meanPressureAccum / cycleElapsed : pressure;
      meanPressureAccum = 0;
      phase = "insp";
      phaseElapsed = 0;
      cycleElapsed = 0;
      peakPressure = pressure;
    }
  }

  return {
    phase,
    phaseElapsed,
    cycleElapsed,
    volume,
    flow,
    pressure,
    autoPeep,
    lastVt,
    peakPressure,
    plateauPressure,
    meanAirwayPressure,
    dynamicCompliance,
    dynamicResistance,
    meanPressureAccum,
  };
}

export function createInitialMechanics(): MechanicsState {
  return {
    phase: "insp",
    phaseElapsed: 0,
    cycleElapsed: 0,
    volume: 0,
    flow: 0,
    pressure: 0,
    autoPeep: 0,
    lastVt: 0,
    peakPressure: 0,
    plateauPressure: 0,
    meanAirwayPressure: 0,
    dynamicCompliance: 0,
    dynamicResistance: 0,
    meanPressureAccum: 0,
  };
}
