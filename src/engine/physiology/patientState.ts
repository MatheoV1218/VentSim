import type { PatientState, VentilatorSettings } from "../types";
import { BASELINE_COMPLIANCE, BASELINE_RESISTANCE, diseaseProfiles } from "../../data/diseases/diseaseProfiles";
import { createInitialMechanics, tickBreathCycle } from "../ventilation/breathCycle";
import { createInitialGasExchange, tickGasExchange } from "./gasExchange";

export function createPatient(diseaseId: string, name = "Sim Patient"): PatientState {
  const disease = diseaseProfiles[diseaseId] ?? diseaseProfiles.normal;
  return {
    name,
    diseaseId: disease.id,
    mechanicsParams: {
      compliance: BASELINE_COMPLIANCE * disease.complianceMultiplier,
      resistance: BASELINE_RESISTANCE * disease.resistanceMultiplier,
    },
    mechanics: createInitialMechanics(),
    gas: createInitialGasExchange(disease),
  };
}

/** Fast tick: breath mechanics only. Call every animation frame. */
export function tickFast(patient: PatientState, settings: VentilatorSettings, dt: number): PatientState {
  return {
    ...patient,
    mechanics: tickBreathCycle(patient.mechanics, patient.mechanicsParams, settings, dt),
  };
}

/** Slow tick: gas exchange / cardiovascular trending. Call at ~1Hz sim-time. */
export function tickSlow(patient: PatientState, settings: VentilatorSettings, dt: number): PatientState {
  const disease = diseaseProfiles[patient.diseaseId] ?? diseaseProfiles.normal;
  return {
    ...patient,
    gas: tickGasExchange(patient.gas, patient.mechanics, settings, disease, dt),
  };
}
