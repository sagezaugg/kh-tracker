import type { ReactNode } from 'react';
import { useProgress } from '../state/store';
import { isOn } from '../model/progress';
import { ChecklistRow, ChecklistRows } from './ChecklistRow';
import { Section } from './Section';
import { useCheckToggle } from './hooks';
import common from './common.module.css';

export interface RowSpec {
  id: string;
  name: string;
  tag?: string;
  auto?: boolean;
  onDelete?: () => void;
}

interface ItemSectionProps {
  title: string;
  rows: readonly RowSpec[];
  note?: string;
  /** Lower-cased text filter. */
  needle: string;
  hide: boolean;
  badge?: ReactNode;
  children?: ReactNode;
}

/** A Section of checklist rows with the shared text filter and hide-obtained toggle applied. */
export function ItemSection({ title, rows, note, needle, hide, badge, children }: ItemSectionProps) {
  const p = useProgress();
  const toggle = useCheckToggle();
  const done = rows.filter((r) => isOn(p, r.id)).length;
  const visible = rows.filter(
    (r) =>
      (!hide || !isOn(p, r.id)) && (!needle || `${r.name} ${r.tag ?? ''}`.toLowerCase().includes(needle)),
  );
  return (
    <Section title={title} count={`${done} / ${rows.length}`} note={note} badge={badge}>
      {children}
      {visible.length > 0 && (
        <ChecklistRows>
          {visible.map((r) => (
            <ChecklistRow key={r.id} {...r} on={isOn(p, r.id)} onToggle={toggle} />
          ))}
        </ChecklistRows>
      )}
      {visible.length === 0 && <p className={common.note}>Nothing to show here.</p>}
    </Section>
  );
}
