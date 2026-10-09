import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { KH1 } from '../src/games/kh1/game';
import { KH2 } from '../src/games/kh2/game';
import type { GameDefinition } from '../src/games/types';
import { khwikiUrl } from '../src/ui/khwiki';
import { kh2Progress, renderAt, resetAll } from './helpers';

beforeEach(resetAll);

describe.each([KH1, KH2] as GameDefinition[])('$id how-to-obtain notes', (game) => {
  const notes = game.info.items;

  it('only names real items, each with a KHWiki page', () => {
    expect(Object.keys(notes).filter((id) => !game.catalog.itemById.has(id))).toEqual([]);
    for (const [id, n] of Object.entries(notes)) {
      expect(n.wiki.trim(), id).not.toBe('');
      if (n.how !== undefined) expect(n.how, id).toMatch(/^[A-Z].*\.$/);
    }
  });

  it('covers every piece of equipment', () => {
    const equipment = game.catalog.items.filter((i) => ['keyblade', 'staff', 'shield'].includes(i.category));
    expect(equipment.length).toBeGreaterThan(0);
    expect(equipment.filter((i) => !notes[i.id]).map((i) => i.id)).toEqual([]);
  });

  it('covers every ability: forms, magic, summons and charms', () => {
    const abilities = game.catalog.items.filter((i) =>
      ['form', 'anti', 'magic', 'summon', 'charm'].includes(i.category),
    );
    expect(abilities.length).toBeGreaterThan(0);
    expect(abilities.filter((i) => !notes[i.id]?.how).map((i) => i.id)).toEqual([]);
  });
});

describe('notes coverage', () => {
  it('has a written note for every item except the Mythril Shield, which KHWiki does not say how to get', () => {
    const withoutNote = [KH1, KH2].flatMap((g) =>
      Object.entries(g.info.items)
        .filter(([, n]) => !n.how)
        .map(([id]) => `${g.id}:${id}`),
    );
    expect(withoutNote).toEqual(['kh1:sh.mythril-shield']);
    // 72 equipment + 30 abilities.
    expect(Object.keys(KH1.info.items).length + Object.keys(KH2.info.items).length).toBe(102);
  });

  it('builds KHWiki links from page titles', () => {
    expect(khwikiUrl("Winner's Proof")).toBe("https://www.khwiki.com/Winner's_Proof");
    expect(khwikiUrl('Adamant Shield (KH)')).toBe('https://www.khwiki.com/Adamant_Shield_(KH)');
  });
});

describe('info button', () => {
  const open = async (name: string) => {
    renderAt('/kh2/keyblades');
    const btn = screen.getByRole('button', { name: `About ${name}` });
    await userEvent.click(btn);
    return btn;
  };

  it('opens a popover with the note and link, without checking the row', async () => {
    const btn = await open('Oathkeeper');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const pop = screen.getByRole('dialog', { name: 'Oathkeeper' });
    expect(pop).toHaveTextContent(KH2.info.items['kb.oathkeeper'].how!);
    expect(screen.getByRole('link', { name: /Read more on KHWiki/ })).toHaveAttribute(
      'href',
      'https://www.khwiki.com/Oathkeeper',
    );
    expect(kh2Progress().checks['kb.oathkeeper']).toBeUndefined();
  });

  it('closes with Esc and returns focus to the button', async () => {
    const btn = await open('Oathkeeper');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Oathkeeper' })).not.toBeInTheDocument();
    expect(btn).toHaveFocus();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on a click outside and when the button is pressed again', async () => {
    const btn = await open('Fenrir');
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Fenrir' })).not.toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.getByRole('dialog', { name: 'Fenrir' })).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.queryByRole('dialog', { name: 'Fenrir' })).not.toBeInTheDocument();
  });

  it('opens from the keyboard', async () => {
    renderAt('/kh2/keyblades');
    screen.getByRole('button', { name: 'About Two Become One' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Two Become One' })).toBeInTheDocument();
  });

  it('appears on level steppers too', async () => {
    renderAt('/kh2/drive');
    const stepper = screen.getByRole('group', { name: 'Valor Form' });
    await userEvent.click(within(stepper).getByRole('button', { name: 'About Valor Form' }));
    expect(screen.getByRole('dialog', { name: 'Valor Form' })).toHaveTextContent(
      KH2.info.items['lv.valor'].how!,
    );
  });

  it('only appears on rows with a note', () => {
    renderAt('/kh2/worlds/tt');
    expect(screen.queryAllByRole('button', { name: /^About / })).toEqual([]);
  });

  it('has no axe violations while open', async () => {
    await open('Oathkeeper');
    const res = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, 'label-content-name-mismatch': { enabled: false } },
    });
    expect(
      res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
});
