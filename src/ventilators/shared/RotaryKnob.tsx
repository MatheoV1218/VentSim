import { useEffect, useRef, useState } from "react";

interface RotaryKnobProps {
  disabled?: boolean;
  onTurn: (direction: 1 | -1) => void;
  onPress?: () => void;
}

/** A draggable/scrollable dial, styled to feel like a physical ventilator encoder.
 * Drag vertically or scroll to turn; click to confirm (mirrors the real hardware gesture). */
export function RotaryKnob({ disabled, onTurn, onPress }: RotaryKnobProps) {
  const [rotation, setRotation] = useState(0);
  const dragRef = useRef<{ startY: number; accum: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef({ disabled, onTurn });
  stateRef.current = { disabled, onTurn };

  const turn = (dir: 1 | -1) => {
    if (stateRef.current.disabled) return;
    setRotation((r) => r + dir * 18);
    stateRef.current.onTurn(dir);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, accum: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled || !dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    const steps = Math.trunc((dy - dragRef.current.accum) / 12);
    if (steps !== 0) {
      dragRef.current.accum += steps * 12;
      for (let i = 0; i < Math.abs(steps); i++) turn(steps > 0 ? 1 : -1);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  // React attaches wheel listeners passively by default, which blocks preventDefault
  // (needed to stop the page from scrolling while dialing in a value). A native
  // listener registered with {passive:false} sidesteps that.
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (stateRef.current.disabled) return;
      e.preventDefault();
      turn(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`rotary-knob ${disabled ? "rotary-knob-disabled" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={onPress}
      aria-label="Rotary encoder"
    >
      <span className="rotary-knob-face" style={{ transform: `rotate(${rotation}deg)` }}>
        <span className="rotary-knob-notch" />
      </span>
    </button>
  );
}
