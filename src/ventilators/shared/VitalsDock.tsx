import type { GasExchangeState, MechanicsState } from "../../engine/types";

/** True bedside-monitor readouts only (SpO2/HR/BP/capnography/ABG) — ventilator-derived
 * mechanics (Ppeak, Pplat, Cdyn, Rdyn, auto-PEEP...) live on the ventilator's own screen instead. */
export function VitalsDock({ gas }: { gas: GasExchangeState; mechanics?: MechanicsState }) {
  return (
    <div className="pb980-vitals">
      <VitalTile label="SpO2" value={gas.spo2.toFixed(0)} unit="%" warn={gas.spo2 < 90} big accent="#7cf2a0" />
      <VitalTile label="HR" value={gas.heartRate.toFixed(0)} unit="bpm" big accent="#7cf2a0" />
      <VitalTile label="NIBP" value={`${gas.bloodPressureSys.toFixed(0)}/${gas.bloodPressureDia.toFixed(0)}`} unit="mmHg" accent="#ff8080" />
      <VitalTile label="EtCO2" value={gas.etco2.toFixed(0)} unit="mmHg" accent="#f2e04e" />
      <VitalTile label="PaCO2" value={gas.paco2.toFixed(0)} unit="mmHg" warn={gas.paco2 > 55} accent="#f2e04e" />
      <VitalTile label="PaO2" value={gas.pao2.toFixed(0)} unit="mmHg" warn={gas.pao2 < 60} accent="#7cf2a0" />
      <VitalTile label="pH" value={gas.ph.toFixed(2)} unit="" warn={gas.ph < 7.3} accent="#c9a6ff" />
      <VitalTile label="HCO3" value={gas.hco3.toFixed(0)} unit="mEq/L" accent="#c9a6ff" />
    </div>
  );
}

function VitalTile({
  label,
  value,
  unit,
  warn,
  big,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  warn?: boolean;
  big?: boolean;
  accent: string;
}) {
  return (
    <div className={`vital-tile ${warn ? "vital-warn" : ""}`}>
      <div className="vital-label">{label}</div>
      <div className={`vital-value ${big ? "vital-value-big" : ""}`} style={{ color: warn ? undefined : accent }}>
        {value} <span className="vital-unit">{unit}</span>
      </div>
    </div>
  );
}
