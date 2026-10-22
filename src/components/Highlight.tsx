import { Fragment } from "react";

export type Tone = "red" | "peach" | "green";

export const TONE_LABEL: Record<Tone, string> = {
  green: "Checks out",
  peach: "Motive",
  red: "Contradiction",
};

interface HighlightProps {
  children: string;
  tone?: Tone;
  /** Whether the mark is drawn. Toggling it sweeps the highlighter across. */
  on?: boolean;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Total time for the stroke to cross the phrase, in ms. Defaults to 180ms per word. */
  sweep?: number;
}

/**
 * A highlighter stroke over a phrase. Split into one <mark> per word so the
 * phrase can wrap; each word starts as the previous one finishes, so the
 * stroke reads as one sweep left to right.
 */
export default function Highlight({ children, tone = "red", on = true, delay = 0, sweep }: HighlightProps) {
  const words = children.split(/(\s+)/);
  const count = words.filter((w) => w.trim()).length || 1;
  const step = sweep ? sweep / count : 180;
  let index = 0;
  return (
    <>
      {words.map((part, i) => {
        if (/^\s+$/.test(part) || part === "") return <Fragment key={i}>{part}</Fragment>;
        const d = Math.round(delay + index++ * step);
        return (
          <mark
            key={i}
            className="hl"
            data-tone={tone}
            data-on={on}
            style={{ "--d": `${on ? d : 0}ms` } as React.CSSProperties}
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}
