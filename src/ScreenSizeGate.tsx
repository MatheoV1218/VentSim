import { useEffect, useState, type ReactNode } from "react";

const MIN_WIDTH = 1000;

function isTooSmall(): boolean {
  return window.innerWidth < MIN_WIDTH;
}

/** VentSim is built for laptop/desktop use — the ventilator UI needs real screen space
 * to be usable. Rather than a broken cramped layout on phones/small tablets, block
 * below MIN_WIDTH and tell the user to switch devices. */
export function ScreenSizeGate({ children }: { children: ReactNode }) {
  const [tooSmall, setTooSmall] = useState(isTooSmall);

  useEffect(() => {
    const onResize = () => setTooSmall(isTooSmall());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (tooSmall) {
    return (
      <div className="screen-gate">
        <div className="screen-gate-card">
          <div className="screen-gate-icon">🖥️</div>
          <h1>VentSim needs a bigger screen</h1>
          <p>
            This is a full ventilator control panel with live waveforms — it's built for laptop and
            desktop use, not phones or small tablets. Please switch to a device with a wider screen
            to practice.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
