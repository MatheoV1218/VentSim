import type { DiseaseProfile, GasExchangeState, MechanicsState, VentilatorSettings } from "../types";

// Reference constant tuned so a healthy adult (Vt 0.5L, RR 14, ~30% dead space) settles near PaCO2 40 mmHg.
const PACO2_K = 200;

function severinghausSpO2(pao2: number): number {
  const p3 = Math.pow(pao2, 3);
  const num = p3 + 150 * pao2;
  return Math.max(0, Math.min(100, (num / (num + 23400)) * 100));
}

function computeTargets(
  gas: GasExchangeState,
  mechanics: MechanicsState,
  settings: VentilatorSettings,
  disease: DiseaseProfile
) {
  const vt = mechanics.lastVt > 0 ? mechanics.lastVt : settings.tidalVolume;
  const alveolarVt = vt * (1 - disease.deadSpaceFraction);
  const minuteAlveolarVent = Math.max(alveolarVt * settings.respRate, 0.3); // L/min, floor to avoid div/0

  const paco2Target = Math.max(15, Math.min(120, PACO2_K / minuteAlveolarVent));

  const alveolarO2 = settings.fio2 * 713 - paco2Target * 1.25;
  const shuntPenalty = disease.shuntFraction * 220;
  const pao2Target = Math.max(35, Math.min(600, alveolarO2 - shuntPenalty - disease.baselineHypoxemia));

  const spo2Target = severinghausSpO2(pao2Target);

  const dsGradient = disease.deadSpaceFraction * 10;
  const etco2Target = Math.max(0, paco2Target - dsGradient);

  const phTarget = 6.1 + Math.log10(gas.hco3 / (0.03 * paco2Target));

  // Hypoxia/hypercapnia drive a compensatory cardiovascular response.
  const hypoxiaDrive = Math.max(0, 92 - spo2Target) * 1.8;
  const hypercapniaDrive = Math.max(0, paco2Target - 45) * 0.4;
  const hrTarget = Math.max(50, Math.min(170, 78 + hypoxiaDrive + hypercapniaDrive));
  const severeHypoxiaPenalty = spo2Target < 75 ? (75 - spo2Target) * 0.8 : 0;
  const sysTarget = Math.max(70, 118 + hypercapniaDrive * 0.3 - severeHypoxiaPenalty);
  const diaTarget = Math.max(40, 74 + hypercapniaDrive * 0.15 - severeHypoxiaPenalty * 0.5);

  return { paco2Target, pao2Target, spo2Target, etco2Target, phTarget, hrTarget, sysTarget, diaTarget };
}

/** First-order lag toward target, tau in seconds. dt is the slow-tick delta (sim-seconds). */
function lag(current: number, target: number, tau: number, dt: number): number {
  const alpha = 1 - Math.exp(-dt / tau);
  return current + (target - current) * alpha;
}

export function tickGasExchange(
  gas: GasExchangeState,
  mechanics: MechanicsState,
  settings: VentilatorSettings,
  disease: DiseaseProfile,
  dt: number
): GasExchangeState {
  const t = computeTargets(gas, mechanics, settings, disease);

  return {
    paco2: lag(gas.paco2, t.paco2Target, 60, dt),
    pao2: lag(gas.pao2, t.pao2Target, 45, dt),
    spo2: lag(gas.spo2, t.spo2Target, 20, dt),
    etco2: lag(gas.etco2, t.etco2Target, 15, dt),
    ph: lag(gas.ph, t.phTarget, 90, dt),
    hco3: gas.hco3, // renal compensation is a slower (hours) process, out of scope for a live sim tick
    heartRate: lag(gas.heartRate, t.hrTarget, 25, dt),
    bloodPressureSys: lag(gas.bloodPressureSys, t.sysTarget, 30, dt),
    bloodPressureDia: lag(gas.bloodPressureDia, t.diaTarget, 30, dt),
  };
}

export function createInitialGasExchange(disease: DiseaseProfile): GasExchangeState {
  const baselineHco3 = disease.id === "copd" ? 30 : 24; // chronic metabolic compensation
  return {
    spo2: 97,
    heartRate: 78,
    bloodPressureSys: 118,
    bloodPressureDia: 74,
    etco2: 36,
    paco2: disease.id === "copd" ? 50 : 40,
    pao2: 95,
    ph: disease.id === "copd" ? 7.37 : 7.4,
    hco3: baselineHco3,
  };
}
