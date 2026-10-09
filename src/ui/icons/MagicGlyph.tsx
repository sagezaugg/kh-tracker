import { GLYPHS } from './glyphData';

/** A drawn spell glyph (see glyphData.tsx). */
export function MagicGlyph({ name, size, className }: { name: string; size: number; className?: string }) {
  const g = GLYPHS[name];
  if (!g) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="11.2"
        fill="rgba(4,12,48,.55)"
        stroke={g.color}
        strokeOpacity=".45"
        strokeWidth=".8"
      />
      {g.body}
    </svg>
  );
}
