import { useFilters } from './hooks';
import common from './common.module.css';

interface FilterBarProps {
  label?: string;
  placeholder?: string;
  hideLabel?: string;
  /** Show the green-dot legend under the bar. */
  legend?: boolean;
}

/** Text filter plus hide toggle, both bound to the query string. */
export function FilterBar({
  label = 'Filter this list',
  placeholder = 'Filter…',
  hideLabel = 'Hide obtained',
  legend = true,
}: FilterBarProps) {
  const { q, hide, setQ, toggleHide } = useFilters();
  return (
    <>
      <div className={common.tools} style={{ marginTop: 12 }}>
        <label className={common.searchLabel}>
          <span className="sr-only">{label}</span>
          <input
            className={common.search}
            type="search"
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={hide ? `${common.pill} ${common.on}` : common.pill}
          aria-pressed={hide}
          onClick={toggleHide}
        >
          {hideLabel}
        </button>
      </div>
      {legend && (
        <p className={common.legend}>
          <span className={common.autoDot} aria-hidden="true" />
          Filled in automatically when you import a save. You can still change anything by hand.
        </p>
      )}
    </>
  );
}
