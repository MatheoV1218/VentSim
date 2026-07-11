import { useSimulationStore } from "../../state/simulationStore";
import { useUiStore } from "../../state/uiStore";
import { useSimulationLoop } from "../../state/useSimulationLoop";
import { diseaseProfiles } from "../../data/diseases/diseaseProfiles";
import { getVentilator } from "../../ventilators/registry";
import { DevicePicker } from "./DevicePicker";
import type { SimSpeed } from "../../engine/simClock";

const SPEEDS: SimSpeed[] = [0, 1, 2, 4];

export function SandboxScreen() {
  useSimulationLoop();

  const diseaseId = useSimulationStore((s) => s.diseaseId);
  const setDisease = useSimulationStore((s) => s.setDisease);
  const speed = useSimulationStore((s) => s.speed);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const reset = useSimulationStore((s) => s.reset);
  const simTime = useSimulationStore((s) => s.simTime);

  const selectedVentilatorId = useUiStore((s) => s.selectedVentilatorId);
  const selectVentilator = useUiStore((s) => s.selectVentilator);
  const selected = selectedVentilatorId ? getVentilator(selectedVentilatorId) : undefined;
  const Shell = selected?.Shell;

  return (
    <div className="sandbox-screen">
      <div className="sandbox-toolbar">
        <div className="sandbox-group">
          <label>Patient</label>
          <select value={diseaseId} onChange={(e) => setDisease(e.target.value)}>
            {Object.values(diseaseProfiles).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sandbox-group">
          <label>Sim Time</label>
          <span className="sim-time">{formatTime(simTime)}</span>
        </div>

        <div className="sandbox-group">
          <label>Speed</label>
          <div className="speed-buttons">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={s === speed ? "speed-btn speed-btn-active" : "speed-btn"}
                onClick={() => setSpeed(s)}
              >
                {s === 0 ? "Pause" : `${s}x`}
              </button>
            ))}
          </div>
        </div>

        {Shell && (
          <button className="switch-device-btn" onClick={() => selectVentilator(null)}>
            Switch Device ({selected?.displayName})
          </button>
        )}

        <button className="reset-btn" onClick={reset}>
          Reset Patient
        </button>
      </div>

      {Shell ? <Shell /> : <DevicePicker />}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
