import type { CSSProperties } from "react";
import vinyl from "./vinyl.svg";
export function VinylDeck({
  label,
  side,
  angle,
  scratching,
}: {
  label: string;
  side: string;
  angle: number;
  scratching: boolean;
}) {
  return (
    <>
      <span
        className="vinyl-scratch"
        data-scratching={scratching}
        style={{ transform: `rotate(${angle}deg)` } as CSSProperties}
        aria-hidden="true"
      >
        <img src={vinyl} alt="" draggable={false} />
        <span className="vinyl-print">
          OPEN
          <br />
          SKINS
        </span>
      </span>
      <span className="vinyl-tonearm" aria-hidden="true">
        <i />
      </span>
      <span className="vinyl-caption">
        <b>DECK {side}</b>
        <span>{label}</span>
      </span>
    </>
  );
}
