import { useState } from "react";
import { useSimulationStore } from "../../state/simulationStore";
import { waveformBuffer } from "../../state/waveformBuffer";
import { WaveformCanvas } from "../../waveforms/WaveformCanvas";
import { ControlTile } from "../shared/ControlTile";
import { VitalsDock } from "../shared/VitalsDock";
import { RotaryKnob } from "../shared/RotaryKnob";
import { pb980Config } from "./pb980.config";
import type { VentMode, VentilatorSettings } from "../../engine/types";

type Tab = "monitor" | "settings" | "alarms";

export function PB980Shell() {
  const settings = useSimulationStore((s) => s.settings);
  const pendingSettings = useSimulationStore((s) => s.pendingSettings);
  const selectedControlKey = useSimulationStore((s) => s.selectedControlKey);
  const selectControl = useSimulationStore((s) => s.selectControl);
  const adjustPending = useSimulationStore((s) => s.adjustPending);
  const acceptPending = useSimulationStore((s) => s.acceptPending);
  const cancelPending = useSimulationStore((s) => s.cancelPending);
  const hasPendingChanges = useSimulationStore((s) => s.hasPendingChanges());
  const setMode = useSimulationStore((s) => s.setMode);
  const triggerO2Boost = useSimulationStore((s) => s.triggerO2Boost);
  const o2Boost = useSimulationStore((s) => s.o2Boost);
  const simTime = useSimulationStore((s) => s.simTime);
  const patient = useSimulationStore((s) => s.patient);
  const diseaseId = useSimulationStore((s) => s.diseaseId);

  const [tab, setTab] = useState<Tab>("monitor");
  const [locked, setLocked] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [nebulizerOn, setNebulizerOn] = useState(false);
  const [alarmSilencedUntil, setAlarmSilencedUntil] = useState<number | null>(null);

  const applicableControls = pb980Config.controls.filter((c) => !c.modes || c.modes.includes(settings.mode));

  const readApplied = (key: string) => convertOut(key, (settings as unknown as Record<string, number>)[key]);
  const readPending = (key: string) => convertOut(key, (pendingSettings as unknown as Record<string, number>)[key]);

  const selectedConfig = applicableControls.find((c) => c.key === selectedControlKey);
  const alarmSilenceRemaining = alarmSilencedUntil !== null ? Math.max(0, alarmSilencedUntil - simTime) : 0;

  const handleKnobTurn = (dir: 1 | -1) => {
    if (!selectedConfig) return;
    const stepInSettingsUnits = toSettingsUnits(selectedConfig.key, selectedConfig.step);
    adjustPending(
      selectedConfig.key as keyof VentilatorSettings,
      dir * stepInSettingsUnits,
      toSettingsUnits(selectedConfig.key, selectedConfig.min),
      toSettingsUnits(selectedConfig.key, selectedConfig.max)
    );
  };

  return (
    <div className="device-frame pb980-frame">
      <div className="device-badge">
        <span className="device-badge-model">980</span>
        <span className="device-badge-brand">VentSim</span>
      </div>

      <div className="device-screen-bezel">
        <div className={`device-screen ${locked ? "device-screen-locked" : ""}`}>
          <div className="screen-statusbar">
            <span className="screen-mode-chip">{settings.mode === "VC" ? "VC" : "PC"}</span>
            <span className="screen-patient-label">{patient.name} · {diseaseLabel(diseaseId)}</span>
            <span className="screen-simtime">{formatTime(simTime)}</span>
            <span className={`screen-alarm-banner ${alarmSilenceRemaining > 0 ? "screen-alarm-silenced" : "screen-alarm-none"}`}>
              {alarmSilenceRemaining > 0 ? `ALARMS SILENCED ${Math.ceil(alarmSilenceRemaining)}s` : "NO ALARMS"}
            </span>
            {o2Boost?.active && <span className="screen-o2-boost">100% O2 · {Math.ceil(o2Boost.untilSimTime - simTime)}s</span>}
          </div>

          <div className="screen-tabs">
            {(["monitor", "settings", "alarms"] as Tab[]).map((t) => (
              <button key={t} className={`screen-tab ${tab === t ? "screen-tab-active" : ""}`} onClick={() => setTab(t)}>
                {t === "monitor" ? "Monitoring" : t === "settings" ? "Vent Settings" : "Alarms"}
              </button>
            ))}
          </div>

          <div className="screen-content">
            {tab === "monitor" && (
              <div className="pb980-body">
                <div className="pb980-waveforms">
                  <WaveformCanvas buffer={waveformBuffer} valueKey="pressure" color="#f2c14e" yMin={-5} yMax={45} label="Paw" unit="cmH2O" frozen={frozen} />
                  <WaveformCanvas buffer={waveformBuffer} valueKey="flow" color="#4ecbf2" yMin={-60} yMax={60} label="Flow" unit="L/min" frozen={frozen} />
                  <WaveformCanvas buffer={waveformBuffer} valueKey="volume" color="#7cf24e" yMin={-0.1} yMax={0.8} label="Volume" unit="L" frozen={frozen} />
                </div>
                <VitalsDock gas={patient.gas} mechanics={patient.mechanics} />
              </div>
            )}

            {tab === "settings" && (
              <div className="settings-screen">
                <div className="settings-mode-row">
                  {pb980Config.modes.map((m: VentMode) => (
                    <button key={m} className={m === settings.mode ? "mode-btn mode-btn-active" : "mode-btn"} onClick={() => setMode(m)}>
                      {m === "VC" ? "Volume Control" : "Pressure Control"}
                    </button>
                  ))}
                </div>

                <div className="control-tile-grid">
                  {applicableControls.map((c) => (
                    <ControlTile
                      key={c.key}
                      label={c.label}
                      unit={c.unit}
                      appliedValue={readApplied(c.key)}
                      pendingValue={readPending(c.key)}
                      decimals={c.step < 1 ? 2 : 0}
                      selected={selectedControlKey === c.key}
                      onSelect={() => selectControl(c.key)}
                    />
                  ))}
                </div>

                <div className="knob-panel">
                  <RotaryKnob disabled={!selectedConfig} onTurn={handleKnobTurn} />
                  <div className="knob-hint">
                    {selectedConfig ? `Turn to adjust ${selectedConfig.label}` : "Select a parameter"}
                  </div>
                </div>

                <div className="accept-bar">
                  <button className="accept-btn" disabled={!hasPendingChanges} onClick={acceptPending}>
                    Accept Changes
                  </button>
                  <button className="cancel-btn" disabled={!hasPendingChanges} onClick={cancelPending}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tab === "alarms" && (
              <div className="alarms-screen">
                <p className="alarms-placeholder">
                  Alarm limits and troubleshooting logic arrive in a later milestone. For now the device reports
                  &ldquo;No Alarms&rdquo; at all times.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="device-physical-controls">
        <button className="hw-btn" onClick={() => triggerO2Boost()} disabled={!!o2Boost?.active}>
          100% O2
        </button>
        <button
          className={`hw-btn ${alarmSilenceRemaining > 0 ? "hw-btn-active" : ""}`}
          onClick={() => setAlarmSilencedUntil(simTime + 120)}
        >
          Alarm Silence
        </button>
        <button className={`hw-btn ${nebulizerOn ? "hw-btn-active" : ""}`} onClick={() => setNebulizerOn((v) => !v)}>
          Nebulizer
        </button>
        <button className={`hw-btn ${frozen ? "hw-btn-active" : ""}`} onClick={() => setFrozen((v) => !v)}>
          Freeze
        </button>
        <button className={`hw-btn ${locked ? "hw-btn-active" : ""}`} onClick={() => setLocked((v) => !v)}>
          {locked ? "Unlock" : "Screen Lock"}
        </button>
      </div>
    </div>
  );
}

function diseaseLabel(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// FiO2 is stored as a 0-1 fraction and tidal volume in liters; the UI works in %/mL.
function convertOut(key: string, value: number): number {
  if (key === "fio2") return value * 100;
  if (key === "tidalVolume") return value * 1000;
  return value;
}
function toSettingsUnits(key: string, value: number): number {
  if (key === "fio2") return value / 100;
  if (key === "tidalVolume") return value / 1000;
  return value;
}
