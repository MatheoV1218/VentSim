import { ventilatorRegistry } from "../../ventilators/registry";
import { useUiStore } from "../../state/uiStore";

export function DevicePicker() {
  const selectVentilator = useUiStore((s) => s.selectVentilator);

  return (
    <div className="device-picker">
      {ventilatorRegistry.map((v) => (
        <button
          key={v.id}
          className="device-card"
          disabled={v.status === "planned"}
          onClick={() => v.status === "available" && selectVentilator(v.id)}
        >
          <div className="device-card-name">{v.displayName}</div>
          <div className="device-card-maker">{v.manufacturer}</div>
          <div className="device-card-blurb">{v.blurb}</div>
          <span className={`device-card-badge ${v.status === "available" ? "device-card-badge-available" : "device-card-badge-planned"}`}>
            {v.status === "available" ? "Ready" : "Coming Soon"}
          </span>
        </button>
      ))}
    </div>
  );
}
