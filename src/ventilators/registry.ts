import type { ComponentType } from "react";
import { PB980Shell } from "./pb980/PB980Shell";
import { HamiltonC6Shell } from "./hamiltonC6/HamiltonC6Shell";

export interface VentilatorEntry {
  id: string;
  displayName: string;
  manufacturer: string;
  blurb: string;
  status: "available" | "planned";
  Shell?: ComponentType;
}

/** Every ventilator the app knows about. Adding a model means adding a skin
 * (config + Shell component) here — the physiology engine never changes. */
export const ventilatorRegistry: VentilatorEntry[] = [
  {
    id: "pb980",
    displayName: "Puritan Bennett 980",
    manufacturer: "Medtronic",
    blurb: "Full-featured ICU ventilator with a dark touchscreen, physical rotary encoder, and hardware button row.",
    status: "available",
    Shell: PB980Shell,
  },
  {
    id: "hamiltonC6",
    displayName: "Hamilton C6",
    manufacturer: "Hamilton Medical",
    blurb: "Touchscreen-first ICU ventilator with a light housing and a single integrated dial.",
    status: "available",
    Shell: HamiltonC6Shell,
  },
  {
    id: "servoU",
    displayName: "Servo-u",
    manufacturer: "Getinge",
    blurb: "Large-format touchscreen ventilator with Open Lung Tool graphics.",
    status: "planned",
  },
  {
    id: "evitaV500",
    displayName: "Evita V500",
    manufacturer: "Dräger",
    blurb: "ICU ventilator with the SmartPilot dial-and-menu control scheme.",
    status: "planned",
  },
  {
    id: "v60",
    displayName: "V60",
    manufacturer: "Dräger",
    blurb: "Dedicated NIV/CPAP/BiPAP platform for mask ventilation.",
    status: "planned",
  },
  {
    id: "ltv",
    displayName: "LTV Series",
    manufacturer: "Vyaire",
    blurb: "Compact transport ventilator for inter-facility and field use.",
    status: "planned",
  },
];

export function getVentilator(id: string): VentilatorEntry | undefined {
  return ventilatorRegistry.find((v) => v.id === id);
}
