interface ControlTileProps {
  label: string;
  unit: string;
  appliedValue: number;
  pendingValue: number;
  decimals?: number;
  selected: boolean;
  onSelect: () => void;
}

/** A single ventilator parameter tile. Shows the live applied value; when the
 * operator has dialed in a change that hasn't been accepted yet, the pending
 * value is shown in amber — mirroring how real vents stage a change before it goes live. */
export function ControlTile({
  label,
  unit,
  appliedValue,
  pendingValue,
  decimals = 0,
  selected,
  onSelect,
}: ControlTileProps) {
  const dirty = Math.abs(pendingValue - appliedValue) > 1e-6;

  return (
    <button
      type="button"
      className={`control-tile ${selected ? "control-tile-selected" : ""} ${dirty ? "control-tile-dirty" : ""}`}
      onClick={onSelect}
    >
      <div className="control-tile-label">{label}</div>
      <div className="control-tile-value">
        {appliedValue.toFixed(decimals)} <span className="control-tile-unit">{unit}</span>
      </div>
      {dirty && (
        <div className="control-tile-pending">
          → {pendingValue.toFixed(decimals)} {unit}
        </div>
      )}
    </button>
  );
}
