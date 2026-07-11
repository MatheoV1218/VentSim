// Core shared types for the physiology + ventilation engine.
// This module has zero React/store dependencies.

export type VentMode = "VC" | "PC";
export type FlowPattern = "square" | "decelerating";

export interface VentilatorSettings {
  mode: VentMode;
  fio2: number; // 0.21 - 1.0
  peep: number; // cmH2O
  tidalVolume: number; // L (VC mode target)
  pressureControl: number; // cmH2O above PEEP (PC mode target)
  respRate: number; // breaths/min (mandatory rate)
  inspTime: number; // seconds
  flowPattern: FlowPattern; // VC mode only
  riseTime: number; // seconds, PC mode pressure ramp
  triggerSensitivity: number; // L/min flow trigger (not yet used for patient effort in M0)
}

export type BreathPhase = "insp" | "exp";

export interface MechanicsState {
  phase: BreathPhase;
  phaseElapsed: number; // seconds since phase start
  cycleElapsed: number; // seconds since breath start
  volume: number; // L, above end-expiratory baseline (0 = fully passively exhaled)
  flow: number; // L/s, +inspiratory / -expiratory
  pressure: number; // cmH2O, airway pressure
  autoPeep: number; // cmH2O, trapped pressure at end-expiration
  lastVt: number; // L, delivered/exhaled tidal volume of the last completed breath
  peakPressure: number; // cmH2O, running peak for the current/last breath
  plateauPressure: number; // cmH2O, estimated (pressure at end-inspiratory pause)
}

export interface RespiratoryMechanicsParams {
  compliance: number; // L/cmH2O
  resistance: number; // cmH2O / (L/s)
}

export interface GasExchangeState {
  spo2: number; // %
  heartRate: number; // bpm
  bloodPressureSys: number; // mmHg
  bloodPressureDia: number; // mmHg
  etco2: number; // mmHg
  paco2: number; // mmHg
  pao2: number; // mmHg
  ph: number;
  hco3: number; // mEq/L
}

export interface DiseaseProfile {
  id: string;
  label: string;
  complianceMultiplier: number; // applied to baseline compliance
  resistanceMultiplier: number; // applied to baseline resistance
  shuntFraction: number; // 0-1, fraction of CO unoxygenated (V/Q mismatch / shunt)
  deadSpaceFraction: number; // 0-1, fraction of Vt that is wasted ventilation
  baselineHypoxemia: number; // mmHg subtracted from achievable PaO2 ceiling
}

export interface PatientState {
  name: string;
  diseaseId: string;
  mechanicsParams: RespiratoryMechanicsParams;
  mechanics: MechanicsState;
  gas: GasExchangeState;
}

export interface WaveformSample {
  t: number; // sim-seconds
  pressure: number;
  flow: number;
  volume: number;
}
