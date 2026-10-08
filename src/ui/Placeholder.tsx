interface PlaceholderProps {
  children: string;
}

/** Temporary body for screens that haven't been ported yet. */
export function Placeholder({ children }: PlaceholderProps) {
  return <p style={{ color: 'var(--c-text-dim)', fontSize: 15, margin: '6px 0 10px' }}>{children}</p>;
}
