import type { DiseaseProfile } from "../../engine/types";

export const diseaseProfiles: Record<string, DiseaseProfile> = {
  normal: {
    id: "normal",
    label: "Normal Lungs",
    complianceMultiplier: 1,
    resistanceMultiplier: 1,
    shuntFraction: 0.03,
    deadSpaceFraction: 0.3,
    baselineHypoxemia: 0,
  },
  copd: {
    id: "copd",
    label: "COPD Exacerbation",
    complianceMultiplier: 1.3, // hyperinflated, more compliant lung units
    resistanceMultiplier: 3.5, // the dominant abnormality: expiratory flow limitation
    shuntFraction: 0.08,
    deadSpaceFraction: 0.45,
    baselineHypoxemia: 15,
  },
  ards: {
    id: "ards",
    label: "ARDS",
    complianceMultiplier: 0.35, // stiff, non-compliant lung
    resistanceMultiplier: 1.4,
    shuntFraction: 0.28,
    deadSpaceFraction: 0.5,
    baselineHypoxemia: 45,
  },
};

export const BASELINE_COMPLIANCE = 0.05; // L/cmH2O (~50 mL/cmH2O)
export const BASELINE_RESISTANCE = 8; // cmH2O / (L/s)
