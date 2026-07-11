import type { VentMode } from "../../engine/types";

export interface ControlRange {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  modes?: VentMode[]; // which modes this control applies to; omit = all modes
}

export const pb980Config = {
  id: "pb980",
  displayName: "Puritan Bennett 980",
  modes: ["VC", "PC"] as VentMode[],
  controls: [
    { key: "fio2", label: "FiO2", unit: "%", min: 21, max: 100, step: 1 },
    { key: "peep", label: "PEEP", unit: "cmH2O", min: 0, max: 20, step: 1 },
    { key: "tidalVolume", label: "Tidal Volume", unit: "mL", min: 200, max: 800, step: 10, modes: ["VC"] },
    { key: "pressureControl", label: "Pressure Control", unit: "cmH2O", min: 5, max: 40, step: 1, modes: ["PC"] },
    { key: "respRate", label: "Resp Rate", unit: "/min", min: 6, max: 35, step: 1 },
    { key: "inspTime", label: "Insp Time", unit: "s", min: 0.5, max: 2.5, step: 0.05 },
    { key: "riseTime", label: "Rise Time", unit: "s", min: 0.05, max: 0.6, step: 0.05, modes: ["PC"] },
    { key: "triggerSensitivity", label: "Trigger Sens.", unit: "L/min", min: 0.5, max: 10, step: 0.5 },
  ] as ControlRange[],
};
