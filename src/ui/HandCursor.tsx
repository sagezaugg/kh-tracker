interface HandCursorProps {
  className?: string;
}

/** The white pointing glove that bobs beside the active menu item. Decorative only. */
export function HandCursor({ className }: HandCursorProps) {
  return (
    <svg className={className} viewBox="0 0 34 22" aria-hidden="true" focusable="false">
      <path
        d="M2 8.5c0-2 1.6-3.5 3.5-3.5H15l2.2-3h3.3l.9 3H31a2 2 0 0 1 0 4H21v1h2.6a2 2 0 0 1 0 4H21v1h1.4a2 2 0 0 1 0 4H9.5C5.4 19 2 15.6 2 11.5z"
        fill="#ffffff"
        stroke="#1a1f2e"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
