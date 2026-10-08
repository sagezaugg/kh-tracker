interface CupIconProps {
  className?: string;
}

/** Generic trophy cup glyph (original artwork). */
export function CupIcon({ className }: CupIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7 3h10v2h3.5v2.5A4.5 4.5 0 0 1 16.6 12 5 5 0 0 1 13 14.8V17h3v4H8v-4h3v-2.2A5 5 0 0 1 7.4 12 4.5 4.5 0 0 1 3.5 7.5V5H7zm0 4H5.5v.5A2.5 2.5 0 0 0 7 9.8zm10 0v2.8a2.5 2.5 0 0 0 1.5-2.3V7z"
        fill="currentColor"
      />
    </svg>
  );
}
