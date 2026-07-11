# VentSim — Design & Architecture Document

Mechanical ventilation training simulator for RT students. Personal study tool. React + Vite + TS, no backend, no mobile.

---

## 1. Design Philosophy

- **Cause and effect, not quizzing.** No right/wrong popups during live play. The patient responds physiologically to whatever the player does. Explanations, if any, are opt-in and shown *after* the fact.
- **Sandbox is the product.** Career mode is a wrapper around content unlocking, never a gate on ventilator/patient access. Every mode (Sandbox, ABG Challenge, Scenario) sits on the same engine and is reachable directly from a top-level menu.
- **Realism over gamification.** Waveforms, alarms, and control layouts should look and behave like the real device families they model. No score multipliers, no XP popups during live simulation — those belong to Career mode's meta-layer only.
- **Time is a first-class dial.** Pause / 1x / 2x / 4x / reset are core UX, not a debug feature, because physiological trends unfold over minutes and nobody wants to sit through real-time apnea onset.

---

## 2. System Architecture

### 2.1 High-level module split

```
src/
  engine/               # pure TS, no React, no DOM — the physiology + gas exchange model
    physiology/
      lungMechanics.ts      # compliance, resistance, auto-PEEP, work of breathing
      gasExchange.ts        # SpO2, PaO2, PaCO2, pH, HCO3, EtCO2 trending
      cardiovascular.ts     # HR, BP responses (secondary effects: hypoxia, sedation, PEEP/preload)
      diseaseModifiers.ts   # COPD/ARDS/asthma/etc. as parameter transforms on a baseline patient
      patientState.ts       # PatientState type + integrator (the "physiology tick")
    ventilation/
      breathCycle.ts        # inspiration/expiration state machine, trigger logic, cycling
      modes/                # VC, PC, PRVC, PS, SIMV, CPAP/PSV, NIV — mode → target waveform shape
      circuitFaults.ts       # leaks, obstruction, water, disconnect — perturbations to the mechanics
    simClock.ts            # sim-time vs wall-time, speed multiplier, pause
    types.ts               # PatientState, VentilatorSettings, AlarmState, WaveformSample, etc.

  ventilators/            # "skin + control set + mode list" per device, thin over engine
    pb980/
      PB980Shell.tsx         # bezel, screen chrome, physical control layout
      PB980Screen/           # the on-device UI: waveform panel, settings panel, alarm banner
      pb980.config.ts        # ModeDefinition[], control ranges/steps, alarm defaults — DATA not logic
    shared/
      VentilatorShell.tsx    # common chrome contract every skin implements
      controls/              # reusable Knob, Toggle, NumericStepper, SoftKey components
    registry.ts             # ventilatorId -> { Shell, config } — how new models get added later

  waveforms/
    WaveformCanvas.tsx      # single canvas/SVG renderer, given a ring buffer of samples
    PressureTime.tsx / FlowTime.tsx / VolumeTime.tsx
    PVLoop.tsx / FVLoop.tsx
    ringBuffer.ts           # fixed-size sample buffer per channel, engine pushes each tick

  state/                  # Zustand stores (see 2.3)
    simulationStore.ts     # current PatientState, VentilatorSettings, AlarmState, sim clock
    scenarioStore.ts       # active preset, dynamic-case script position
    progressStore.ts       # career unlocks, persisted to localStorage
    uiStore.ts             # active mode/screen, selected ventilator, panel layout

  modes/
    sandbox/               # SandboxScreen.tsx — disease/ventilator pickers, time controls, compare view
    abgChallenge/
    scenarios/
    career/

  data/
    patients/              # PatientPreset[] — JSON-like TS objects, see 2.4
    diseases/              # DiseaseProfile[] — parameter deltas applied to a baseline

  app/
    App.tsx, routes, top-level layout
```

**Key boundary:** `engine/` never imports React and never touches Zustand. It exports pure functions: `tick(patient, ventilatorSettings, dtSeconds) -> patient'`. This makes the physiology testable in isolation and reusable if the UI ever changes.

### 2.2 The simulation loop

- A single `requestAnimationFrame` driver in `simulationStore` (or a small hook `useSimulationLoop`) computes wall-clock delta, multiplies by the sim-speed factor, and calls `engine.tick()`.
- Two tick rates:
  - **Fast tick (every rAF frame, ~60Hz):** breath-cycle mechanics — pressure/flow/volume waveform sample generation. This needs to be smooth for waveform rendering.
  - **Slow tick (~1Hz sim-time, decoupled from rAF):** gas exchange / cardiovascular trending (SpO2, ABG, HR, BP) — these change over seconds-to-minutes, so recomputing every frame is wasted work. Implemented as an accumulator inside the same loop, not a separate `setInterval`, so pause/speed controls apply uniformly.
- Pause = stop advancing sim-time, not stop rendering (so the player can still read the frozen screen).
- Speed multiplier just scales `dt` passed into `tick()`. The engine has no wall-clock dependency, which is what makes 4x speed safe.

### 2.3 State management

**Zustand**, not Context, because the simulation loop writes high-frequency updates (waveform samples every frame) and Zustand's selector-based subscriptions avoid re-rendering the whole tree on every tick — only components that `useStore(selector)` on the changed slice re-render.

- `simulationStore`: `patientState`, `ventilatorSettings`, `alarmState`, `clock` (running/speed/simTimeElapsed). Waveform ring buffers live *outside* Zustand (plain mutable arrays refs) to avoid triggering React re-renders 60x/sec — `WaveformCanvas` reads them directly in a rAF-driven draw call, not via store subscription.
- `scenarioStore`: which preset/dynamic-case is active, script cursor for scripted deterioration events.
- `progressStore`: career tier, unlocked scenarios — persisted via Zustand's `persist` middleware to `localStorage`.
- `uiStore`: navigation/selection state, ephemeral.

### 2.4 Data-driven content

Ventilators, disease profiles, and patient presets are all plain TS data objects (typed, not hardcoded logic), so:
- Adding the Hamilton C6 later = new `ventilators/hamiltonC6/` folder + config + registry entry. Zero changes to `engine/`.
- Adding a new disease = a `DiseaseProfile` (compliance/resistance/shunt multipliers, secretion rate, etc.) applied on top of a baseline `PatientState`.
- Patient presets reference a disease profile + demographic overrides (weight/height/history/labs) + starting ABG.

### 2.5 Alarms

`AlarmEvaluator` runs each slow tick, comparing live values against `VentilatorSettings.alarmLimits`. Alarms are state (active/acknowledged/silenced), not events — the player must address the underlying physiological/mechanical cause (e.g., actually reduce a leak, not just hit silence) for the alarm to clear. Alarm definitions live per-ventilator config since limit names/behavior vary by device family.

---

## 3. Milestones

**M0 — Vertical slice** (proves the architecture end-to-end)
PB980 shell (screen + a functional subset of physical controls) · one disease preset (e.g. normal-lung baseline + COPD) · physiology tick loop (mechanics + basic gas exchange) · Pressure-Time, Flow-Time, Volume-Time waveforms live and responsive · VC and PC modes wired · FiO2/PEEP/Vt/RR/I:E adjustable and affecting the patient · pause/speed/reset.

**M1 — Sandbox mode polish**
Disease picker, ventilator settings fully wired (trigger sensitivity, rise time, flow pattern, apnea backup), PV and FV loops added, side-by-side compare view, reset-to-baseline.

**M2 — Physiology depth + patient library**
Cardiovascular responses (HR/BP to hypoxia/PEEP/sedation), auto-PEEP/dynamic compliance modeling, secretions/bronchospasm as adjustable sandbox parameters, expand to ~10-12 patient presets from the list given.

**M3 — ABG Challenge mode**
Starting-ABG generator, appropriateness-driven trending logic, optional post-hoc explanation panel.

**M4 — Alarms**
Full alarm set with real trigger/clear conditions tied to physiology and circuit faults (leak, disconnect, obstruction), alarm log.

**M5 — Additional ventilators**
Hamilton C6/G5, then Servo-u/i, Dräger Evita/V500, V60 NIV, LTV — each reusing the shared engine, proving the registry pattern holds.

**M6 — Career mode**
Progression tiers, unlock gating on *scenario difficulty only*, persisted progress.

**M7 — Dynamic cases, procedures, stretch content**
Scripted mid-scenario deterioration events, interactive procedures (intubation, suctioning, etc.), CXR/breath-sound audio nice-to-haves.

---

## 4. Decisions (confirmed)

1. **Waveform rendering:** Canvas.
2. **PB980 visual fidelity for M0:** screen-only UI (waveforms, settings panel, alarm banner); physical bezel/knob chrome added in a later pass.
3. **Persistence:** deferred to M1 — M0 sandbox settings reset on reload.
