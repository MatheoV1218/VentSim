import { create } from "zustand";
import type { PatientState, VentilatorSettings } from "../engine/types";
import type { SimSpeed } from "../engine/simClock";
import { createPatient, tickFast, tickSlow } from "../engine/physiology/patientState";
import { waveformBuffer } from "./waveformBuffer";

export const defaultSettings: VentilatorSettings = {
  mode: "VC",
  fio2: 0.4,
  peep: 5,
  tidalVolume: 0.45,
  pressureControl: 15,
  respRate: 14,
  inspTime: 1.0,
  flowPattern: "square",
  riseTime: 0.15,
  triggerSensitivity: 2,
};

const SLOW_TICK_INTERVAL = 1; // sim-seconds between gas-exchange updates
const O2_BOOST_DURATION = 120; // sim-seconds, mirrors the real PB980's timed 100% O2 button

interface SimulationStore {
  patient: PatientState;
  settings: VentilatorSettings; // applied — what the engine actually runs
  pendingSettings: VentilatorSettings; // draft — edited on the Vent Settings screen, not yet live
  selectedControlKey: string | null;
  diseaseId: string;
  speed: SimSpeed;
  simTime: number;
  slowTickAccumulator: number;
  o2Boost: { active: boolean; priorFio2: number; untilSimTime: number } | null;

  setMode: (mode: VentilatorSettings["mode"]) => void;
  selectControl: (key: string | null) => void;
  adjustPending: (key: keyof VentilatorSettings, delta: number, min: number, max: number) => void;
  setPendingValue: (key: keyof VentilatorSettings, value: number) => void;
  acceptPending: () => void;
  cancelPending: () => void;
  hasPendingChanges: () => boolean;
  triggerO2Boost: () => void;
  setDisease: (diseaseId: string) => void;
  setSpeed: (speed: SimSpeed) => void;
  reset: () => void;
  advance: (wallDtSeconds: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  patient: createPatient("normal"),
  settings: defaultSettings,
  pendingSettings: defaultSettings,
  selectedControlKey: null,
  diseaseId: "normal",
  speed: 1,
  simTime: 0,
  slowTickAccumulator: 0,
  o2Boost: null,

  setMode: (mode) =>
    set((state) => ({
      settings: { ...state.settings, mode },
      pendingSettings: { ...state.pendingSettings, mode },
    })),

  selectControl: (key) => set({ selectedControlKey: key }),

  adjustPending: (key, delta, min, max) =>
    set((state) => {
      const current = state.pendingSettings[key] as number;
      const next = Math.max(min, Math.min(max, Number((current + delta).toFixed(3))));
      return { pendingSettings: { ...state.pendingSettings, [key]: next } };
    }),

  setPendingValue: (key, value) =>
    set((state) => ({ pendingSettings: { ...state.pendingSettings, [key]: value } })),

  acceptPending: () => set((state) => ({ settings: { ...state.pendingSettings } })),

  cancelPending: () => set((state) => ({ pendingSettings: { ...state.settings } })),

  hasPendingChanges: () => {
    const { settings, pendingSettings } = get();
    return (Object.keys(pendingSettings) as (keyof VentilatorSettings)[]).some(
      (k) => pendingSettings[k] !== settings[k]
    );
  },

  triggerO2Boost: () =>
    set((state) => {
      if (state.o2Boost?.active) return {};
      const priorFio2 = state.settings.fio2;
      return {
        settings: { ...state.settings, fio2: 1.0 },
        pendingSettings: { ...state.pendingSettings, fio2: 1.0 },
        o2Boost: { active: true, priorFio2, untilSimTime: state.simTime + O2_BOOST_DURATION },
      };
    }),

  setDisease: (diseaseId) => {
    waveformBuffer.clear();
    set({
      diseaseId,
      patient: createPatient(diseaseId),
      simTime: 0,
      slowTickAccumulator: 0,
      o2Boost: null,
    });
  },

  setSpeed: (speed) => set({ speed }),

  reset: () => {
    waveformBuffer.clear();
    set((state) => ({
      patient: createPatient(state.diseaseId),
      simTime: 0,
      slowTickAccumulator: 0,
      o2Boost: null,
    }));
  },

  advance: (wallDtSeconds) => {
    const { speed } = get();
    if (speed === 0) return;
    const simDt = wallDtSeconds * speed;

    set((state) => {
      let patient = tickFast(state.patient, state.settings, simDt);
      let slowAcc = state.slowTickAccumulator + simDt;

      while (slowAcc >= SLOW_TICK_INTERVAL) {
        patient = tickSlow(patient, state.settings, SLOW_TICK_INTERVAL);
        slowAcc -= SLOW_TICK_INTERVAL;
      }

      const newSimTime = state.simTime + simDt;
      waveformBuffer.push({
        t: newSimTime,
        pressure: patient.mechanics.pressure,
        flow: patient.mechanics.flow * 60, // engine works in L/s; display convention is L/min
        volume: patient.mechanics.volume,
      });

      let settings = state.settings;
      let pendingSettings = state.pendingSettings;
      let o2Boost = state.o2Boost;
      if (o2Boost?.active && newSimTime >= o2Boost.untilSimTime) {
        settings = { ...settings, fio2: o2Boost.priorFio2 };
        pendingSettings = { ...pendingSettings, fio2: o2Boost.priorFio2 };
        o2Boost = null;
      }

      return { patient, simTime: newSimTime, slowTickAccumulator: slowAcc, settings, pendingSettings, o2Boost };
    });
  },
}));
