import type { ReactNode } from 'react';

/**
 * Drawn stand-ins for spell icons: neither game's spells have menu icons on the wikis, so these are our
 * own SVGs (no game art). One colour per element, on a faint round badge so they sit well beside sprites.
 */
export const GLYPHS: Readonly<Record<string, { color: string; body: ReactNode }>> = {
  fire: {
    color: '#ff7a2e',
    body: (
      <>
        <path
          d="M12 3c1 3.5 5 5.4 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.6 2.2-4.8.3 1.6 1 2.6 2 3.1C10.6 8.6 11 5.6 12 3Z"
          fill="#ff7a2e"
        />
        <path d="M12 12c.6 1.5 2.2 2.3 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1.4.9-2.1 2.2-4Z" fill="#ffd54a" />
      </>
    ),
  },
  blizzard: {
    color: '#8fe3ff',
    body: (
      <g stroke="#8fe3ff" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M12 4v16M5.1 8l13.8 8M5.1 16l13.8-8" />
        <path d="M10 5.5 12 7l2-1.5M10 18.5 12 17l2 1.5M5.6 10.6l2.2.3-.9 2.1M18.4 13.4l-2.2-.3.9-2.1M6.9 13l.9 2.1-2.2.3M17.1 11l-.9-2.1 2.2-.3" />
      </g>
    ),
  },
  thunder: {
    color: '#ffe14a',
    body: (
      <path
        d="M13.5 3 6.5 13.2h4.4L9.6 21l7.9-11h-4.6l.6-7Z"
        fill="#ffe14a"
        stroke="#a87b00"
        strokeWidth=".6"
      />
    ),
  },
  cure: {
    color: '#6fe39a',
    body: (
      <>
        <path d="M6 18C6 10 11 5.5 19 5c-.4 8-5 13-13 13Z" fill="#6fe39a" />
        <path d="M6.5 17.5 15 9" stroke="#1f7a45" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  magnet: {
    color: '#c58cff',
    body: (
      <>
        <path d="M6 5v7a6 6 0 0 0 12 0V5h-3.5v7a2.5 2.5 0 0 1-5 0V5H6Z" fill="#c58cff" />
        <path d="M6 5h3.5v3H6zM14.5 5H18v3h-3.5z" fill="#eef4ff" />
      </>
    ),
  },
  reflect: {
    color: '#7fd3ff',
    body: (
      <>
        <path
          d="M12 3.5 19 7.5v9L12 20.5 5 16.5v-9L12 3.5Z"
          fill="rgba(127,211,255,.25)"
          stroke="#7fd3ff"
          strokeWidth="1.6"
        />
        <path d="M9 9.5 12 8l3 1.5" stroke="#eef4ff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  gravity: {
    color: '#9b7bff',
    body: (
      <>
        <circle cx="12" cy="12" r="4.2" fill="#9b7bff" />
        <ellipse
          cx="12"
          cy="12"
          rx="8"
          ry="3"
          fill="none"
          stroke="#c9b8ff"
          strokeWidth="1.3"
          transform="rotate(-20 12 12)"
        />
        <path d="M12 2.8v2.4M12 18.8v2.4" stroke="#c9b8ff" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },
  stop: {
    color: '#f2c94c',
    body: (
      <>
        <circle cx="12" cy="12" r="7.5" fill="rgba(242,201,76,.2)" stroke="#f2c94c" strokeWidth="1.8" />
        <path d="M12 7.5V12l3 2" stroke="#f2c94c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  aero: {
    color: '#a8f0d4',
    body: (
      <g stroke="#a8f0d4" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M4 9h10.5a2.5 2.5 0 1 0-2.5-2.5" />
        <path d="M4 13h13a3 3 0 1 1-3 3" />
        <path d="M4 17h5" />
      </g>
    ),
  },
};

/** The glyph for an item id like `lv.fire`, if it's a spell. */
export const magicGlyphName = (itemId: string): string | undefined => {
  const key = itemId.startsWith('lv.') ? itemId.slice(3) : '';
  return key in GLYPHS ? key : undefined;
};

export const MAGIC_GLYPHS = Object.keys(GLYPHS);
