import { useState } from 'react';
import { useProgress, useTracker } from '../games/context';
import { ItemSection } from './ItemSection';
import { Section } from './Section';
import common from './common.module.css';

interface CustomGoalsProps {
  needle: string;
  hide: boolean;
}

/** "Your goals" list plus the add-a-goal form. Custom goals count toward Everything. */
export function CustomGoals({ needle, hide }: CustomGoalsProps) {
  const custom = useProgress().custom;
  const addCustom = useTracker((s) => s.addCustom);
  const removeCustom = useTracker((s) => s.removeCustom);
  const [text, setText] = useState('');
  const rows = custom.map((g) => ({ id: g.id, name: g.t, onDelete: () => removeCustom(g.id) }));
  const add = () => {
    if (!text.trim()) return;
    addCustom(text);
    setText('');
  };
  return (
    <>
      <ItemSection title="Your goals" rows={rows} needle={needle} hide={hide} />
      <Section title="Add a goal">
        <p className={common.note}>
          Add anything else you count toward your 100%, like a no-damage run. Custom goals count toward
          Everything.
        </p>
        <form
          className={common.addrow}
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className={common.searchLabel} style={{ flexBasis: 260 }}>
            <span className="sr-only">New goal</span>
            <input
              className={common.search}
              type="text"
              placeholder="e.g. S-rank every Gummi route"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
            />
          </label>
          <button type="submit" className={`${common.pill} ${common.blue}`} disabled={!text.trim()}>
            Add goal
          </button>
        </form>
      </Section>
    </>
  );
}
