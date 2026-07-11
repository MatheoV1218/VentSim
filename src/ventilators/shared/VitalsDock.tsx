import type { GasExchangeState, MechanicsState } from "../../engine/types";

export function VitalsDock({ gas, mechanics }: { gas: GasExchangeState; mechanics: MechanicsState }) {
  return (
    <div className="pb980-vitals">
      <VitalTile label="SpO2" value={gas.spo2.toFixed(0)} unit="%" warn={gas.spo2 < 90} />
      <VitalTile label="HR" value={gas.heartRate.toFixed(0)} unit="bpm" />
      <VitalTile label="BP" value={`${gas.bloodPressureSys.toFixed(0)}/${gas.bloodPressureDia.toFixed(0)}`} unit="mmHg" />
      <VitalTile label="EtCO2" value={gas.etco2.toFixed(0)} unit="mmHg" />
      <VitalTile label="PaCO2" value={gas.paco2.toFixed(0)} unit="mmHg" warn={gas.paco2 > 55} />
      <VitalTile label="PaO2" value={gas.pao2.toFixed(0)} unit="mmHg" warn={gas.pao2 < 60} />
      <VitalTile label="pH" value={gas.ph.toFixed(2)} unit="" warn={gas.ph < 7.3} />
      <VitalTile label="Ppeak" value={mechanics.peakPressure.toFixed(1)} unit="cmH2O" />
      <VitalTile label="Pplat" value={mechanics.plateauPressure.toFixed(1)} unit="cmH2O" />
      <VitalTile label="Auto-PEEP" value={mechanics.autoPeep.toFixed(1)} unit="cmH2O" warn={mechanics.autoPeep > 2} />
      <VitalTile label="Exh. Vt" value={(mechanics.lastVt * 1000).toFixed(0)} unit="mL" />
    </div>
  );
}

function VitalTile({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className={`vital-tile ${warn ? "vital-warn" : ""}`}>
      <div className="vital-label">{label}</div>
      <div className="vital-value">
        {value} <span className="vital-unit">{unit}</span>
      </div>
    </div>
  );
}
