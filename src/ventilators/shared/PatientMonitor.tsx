import { VitalsDock } from "./VitalsDock";
import type { GasExchangeState, MechanicsState } from "../../engine/types";

/** A separate bedside patient monitor, rendered alongside whichever ventilator is active —
 * real ICU vents don't display SpO2/HR/BP/ABG themselves; that comes off the monitor. */
export function PatientMonitor({ gas, mechanics }: { gas: GasExchangeState; mechanics: MechanicsState }) {
  return (
    <div className="patient-monitor">
      <div className="patient-monitor-header">
        <span className="patient-monitor-dot" />
        PATIENT MONITOR
      </div>
      <VitalsDock gas={gas} mechanics={mechanics} />
    </div>
  );
}
