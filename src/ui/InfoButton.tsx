import { useContext, useEffect, useId, useRef, useState } from 'react';
import { GameContext } from '../games/context';
import { khwikiUrl } from './khwiki';
import styles from './InfoButton.module.css';

/**
 * The (i) button at the end of a checklist row, for items with a how-to-obtain note. It sits outside the
 * row's checkbox label, so it never toggles the item. Click, tap, Enter or Space opens a small popover;
 * Esc, a click outside or the button again closes it. With a mouse, hovering previews it.
 */
export function InfoButton({ id, name }: { id: string; name: string }) {
  const info = useContext(GameContext)?.info.items[id];
  const [state, setState] = useState<'closed' | 'preview' | 'open'>('closed');
  const wrap = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popId = useId();
  const shown = state !== 'closed';

  useEffect(() => {
    if (state !== 'open') return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setState('closed');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setState('closed');
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [state]);

  if (!info) return null;
  return (
    <span
      ref={wrap}
      className={styles.wrap}
      onPointerEnter={(e) => e.pointerType === 'mouse' && state === 'closed' && setState('preview')}
      onPointerLeave={(e) => e.pointerType === 'mouse' && state === 'preview' && setState('closed')}
    >
      <button
        ref={button}
        type="button"
        className={styles.btn}
        aria-label={`About ${name}`}
        aria-expanded={state === 'open'}
        aria-controls={popId}
        onClick={() => setState((s) => (s === 'open' ? 'closed' : 'open'))}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4.2M8 4.6v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div id={popId} role="dialog" aria-label={name} className={styles.pop} hidden={!shown}>
        <p className={styles.name}>{name}</p>
        {info.how && <p className={styles.how}>{info.how}</p>}
        <a className={styles.link} href={khwikiUrl(info.wiki)} target="_blank" rel="noreferrer">
          Read more on KHWiki
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </span>
  );
}
