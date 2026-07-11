import type { VentMode } from "../../engine/types";
import type { ControlRange } from "../pb980/pb980.config";

export const hamiltonC6Config = {
  id: "hamiltonC6",
  displayName: "Hamilton C6",
  modes: ["VC", "PC"] as VentMode[],
  controls: [
    { key: "fio2", label: "O2", unit: "%", min: 21, max: 100, step: 1 },
    { key: "peep", label: "PEEP", unit: "cmH2O", min: 0, max: 20, step: 1 },
    { key: "tidalVolume", label: "Vt", unit: "mL", min: 200, max: 800, step: 10, modes: ["VC"] },
    { key: "pressureControl", label: "Pcontrol", unit: "cmH2O", min: 5, max: 40, step: 1, modes: ["PC"] },
    { key: "respRate", label: "f", unit: "/min", min: 6, max: 35, step: 1 },
    { key: "inspTime", label: "Tinsp", unit: "s", min: 0.5, max: 2.5, step: 0.05 },
    { key: "riseTime", label: "P-ramp", unit: "s", min: 0.05, max: 0.6, step: 0.05, modes: ["PC"] },
    { key: "triggerSensitivity", label: "Flow Trigger", unit: "L/min", min: 0.5, max: 10, step: 0.5 },
  ] as ControlRange[],
};
