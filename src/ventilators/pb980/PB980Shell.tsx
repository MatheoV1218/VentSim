import { useState } from "react";
import { useSimulationStore } from "../../state/simulationStore";
import { waveformBuffer } from "../../state/waveformBuffer";
import { WaveformCanvas } from "../../waveforms/WaveformCanvas";
import { ControlTile } from "../shared/ControlTile";
import { MechanicsDataBar } from "../shared/MechanicsDataBar";
import { RotaryKnob } from "../shared/RotaryKnob";
import { pb980Config } from "./pb980.config";
import type { VentilatorSettings } from "../../engine/types";

type View = "monitor" | "alarms";

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

  const [view, setView] = useState<View>("monitor");
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

          <MechanicsDataBar mechanics={patient.mechanics} settings={settings} className="pb980-databar" />

          {view === "monitor" ? (
            <>
              <div className="pb980-waveforms">
                <WaveformCanvas buffer={waveformBuffer} valueKey="pressure" color="#f2c14e" yMin={-5} yMax={45} label="Paw" unit="cmH2O" frozen={frozen} />
                <WaveformCanvas buffer={waveformBuffer} valueKey="flow" color="#4ecbf2" yMin={-60} yMax={60} label="Flow" unit="L/min" frozen={frozen} />
                <WaveformCanvas buffer={waveformBuffer} valueKey="volume" color="#7cf24e" yMin={-0.1} yMax={0.8} label="Volume" unit="L" frozen={frozen} />
              </div>

              <div className="pb980-bottomrow">
                <div className="patient-infobox">
                  <div className="patient-infobox-type">Adult</div>
                  <div className="patient-infobox-mode">{settings.mode === "VC" ? "A/C VC" : "A/C PC"}</div>
                  <button
                    className={`mode-btn ${settings.mode === "VC" ? "" : "mode-btn-active"}`}
                    onClick={() => setMode(settings.mode === "VC" ? "PC" : "VC")}
                  >
                    Switch to {settings.mode === "VC" ? "PC" : "VC"}
                  </button>
                </div>

                <div className="settings-strip">
                  <div className="control-tile-grid control-tile-grid-strip">
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
                  <div className="knob-panel knob-panel-inline">
                    <RotaryKnob disabled={!selectedConfig} onTurn={handleKnobTurn} />
                    <div className="knob-hint">
                      {selectedConfig ? `Turn to adjust ${selectedConfig.label}` : "Tap a parameter"}
                    </div>
                    <button className="accept-btn accept-btn-inline" disabled={!hasPendingChanges} onClick={acceptPending}>
                      Accept
                    </button>
                    <button className="cancel-btn cancel-btn-inline" disabled={!hasPendingChanges} onClick={cancelPending}>
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="screen-iconrail">
                  <button className="screen-iconbtn" onClick={() => setView("monitor")} title="Home">
                    <span>⌂</span>Home
                  </button>
                  <button className="screen-iconbtn" onClick={() => setView("alarms")} title="Alarms">
                    <span>🔔</span>Alarms
                  </button>
                  <button className="screen-iconbtn" title="Help">
                    <span>?</span>Help
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="alarms-screen">
              <p className="alarms-placeholder">
                Alarm limits and troubleshooting logic arrive in a later milestone. For now the device reports
                &ldquo;No Alarms&rdquo; at all times.
              </p>
              <button className="screen-iconbtn" onClick={() => setView("monitor")}>
                <span>⌂</span>Back to Monitor
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="device-physical-controls">
        <IconHwButton icon="☀" label="Brightness" />
        <IconHwButton icon="🔒" label={locked ? "Unlock" : "Lock"} active={locked} onClick={() => setLocked((v) => !v)} />
        <IconHwButton
          icon="🔕"
          label="Alarm Silence"
          active={alarmSilenceRemaining > 0}
          onClick={() => setAlarmSilencedUntil(simTime + 120)}
        />
        <IconHwButton icon="💨" label="Nebulizer" active={nebulizerOn} onClick={() => setNebulizerOn((v) => !v)} />
        <IconHwButton icon="❄" label="Freeze" active={frozen} onClick={() => setFrozen((v) => !v)} />
        <IconHwButton icon="O2" label="100% O2" active={!!o2Boost?.active} onClick={() => triggerO2Boost()} disabled={!!o2Boost?.active} />
      </div>
    </div>
  );
}

function IconHwButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`hw-btn hw-btn-icon ${active ? "hw-btn-active" : ""}`} onClick={onClick} disabled={disabled}>
      <span className="hw-btn-glyph">{icon}</span>
      <span className="hw-btn-caption">{label}</span>
    </button>
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
