import { useEffect, useRef } from "react";
import type { RingBuffer } from "./ringBuffer";
import type { WaveformSample } from "../engine/types";

interface WaveformCanvasProps {
  buffer: RingBuffer;
  valueKey: keyof Pick<WaveformSample, "pressure" | "flow" | "volume">;
  color: string;
  yMin: number;
  yMax: number;
  label: string;
  unit: string;
  windowSeconds?: number;
  frozen?: boolean;
}

export function WaveformCanvas({
  buffer,
  valueKey,
  color,
  yMin,
  yMax,
  label,
  unit,
  windowSeconds = 10,
  frozen = false,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frozenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // background grid
      ctx.strokeStyle = "#1a2e2a";
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= width; gx += width / 10) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy <= height; gy += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const samples = buffer.toArray();
      if (samples.length > 1) {
        if (frozen) {
          if (frozenAtRef.current === null) frozenAtRef.current = samples[samples.length - 1].t;
        } else {
          frozenAtRef.current = null;
        }
        const now = frozenAtRef.current ?? samples[samples.length - 1].t;
        const startT = now - windowSeconds;

        const xFor = (t: number) => ((t - startT) / windowSeconds) * width;
        const yFor = (v: number) => height - ((v - yMin) / (yMax - yMin)) * height;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (const s of samples) {
          if (s.t < startT) continue;
          const x = xFor(s.t);
          const y = yFor(s[valueKey]);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // label
      ctx.fillStyle = color;
      ctx.font = "12px monospace";
      ctx.fillText(`${label} (${unit})`, 6, 14);

      if (frozen) {
        ctx.fillStyle = "#f2c14e";
        ctx.font = "bold 11px monospace";
        ctx.fillText("FROZEN", width - 56, 14);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [buffer, valueKey, color, yMin, yMax, label, unit, windowSeconds, frozen]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}
