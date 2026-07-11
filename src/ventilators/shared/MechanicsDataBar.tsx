import type { MechanicsState, VentilatorSettings } from "../../engine/types";

/** The persistent, always-visible strip of ventilator-derived mechanics numbers
 * (rate, volumes, pressures, dynamic compliance/resistance) real ICU vents show
 * above the waveforms at all times — never hidden behind a settings screen. */
export function MechanicsDataBar({
  mechanics,
  settings,
  className = "",
}: {
  mechanics: MechanicsState;
  settings: VentilatorSettings;
  className?: string;
}) {
  const minuteVent = mechanics.lastVt * settings.respRate;

  return (
    <div className={`mech-databar ${className}`}>
      <DataCell label="RR" value={settings.respRate.toFixed(0)} unit="/min" />
      <DataCell label="VTE" value={(mechanics.lastVt * 1000).toFixed(0)} unit="mL" />
      <DataCell label="VE" value={minuteVent.toFixed(1)} unit="L/min" />
      <DataCell label="Ppeak" value={mechanics.peakPressure.toFixed(0)} unit="cmH2O" />
      <DataCell label="Pmean" value={mechanics.meanAirwayPressure.toFixed(1)} unit="cmH2O" />
      <DataCell label="Pplat" value={mechanics.plateauPressure.toFixed(0)} unit="cmH2O" />
      <DataCell label="Cdyn" value={(mechanics.dynamicCompliance * 1000).toFixed(0)} unit="mL/cmH2O" />
      <DataCell label="Rdyn" value={mechanics.dynamicResistance.toFixed(0)} unit="cmH2O/L/s" />
      <DataCell label="Auto-PEEP" value={mechanics.autoPeep.toFixed(1)} unit="cmH2O" warn={mechanics.autoPeep > 2} />
    </div>
  );
}

function DataCell({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className={`mech-cell ${warn ? "mech-cell-warn" : ""}`}>
      <div className="mech-cell-label">{label}</div>
      <div className="mech-cell-value">
        {value}
        <span className="mech-cell-unit">{unit}</span>
      </div>
    </div>
  );
}
