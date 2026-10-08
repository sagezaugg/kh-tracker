import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { diffBytes, diffReport, parseRange } from '../src/core/saveDiff';
import { renderAt, resetAll } from './helpers';

describe('diffBytes', () => {
  const a = new Uint8Array([0b0000_0001, 0xff, 7, 0]);
  const b = new Uint8Array([0b0000_1001, 0xff, 9, 0, 5]);

  it('lists changed bytes with the bits that flipped', () => {
    expect(diffBytes(a, b)).toEqual([
      { offset: 0, before: 1, after: 9, set: [3], cleared: [] },
      { offset: 2, before: 7, after: 9, set: [3], cleared: [1, 2] },
      { offset: 4, before: 0, after: 5, set: [0, 2], cleared: [] },
    ]);
  });

  it('filters by range and to single-bit flips', () => {
    expect(diffBytes(a, b, { start: 1, end: 3 }).map((c) => c.offset)).toEqual([2]);
    expect(diffBytes(a, b, { singleBitOnly: true }).map((c) => c.offset)).toEqual([0]);
  });

  it('writes a pasteable report', () => {
    expect(diffReport(diffBytes(a, b, { singleBitOnly: true }), 'x')).toBe(
      '# x: 1 changed byte\n0x0000  0x01 -> 0x09  00000001 -> 00001001  +bit3',
    );
  });

  it('parses hex and decimal ranges', () => {
    expect(parseRange('0x1D00-0x1E00')).toEqual({ start: 0x1d00, end: 0x1e00 });
    expect(parseRange('10 - 20')).toEqual({ start: 10, end: 20 });
    expect(parseRange('20-10')).toBeNull();
    expect(parseRange('')).toBeNull();
  });
});

describe('save diff page', () => {
  beforeEach(resetAll);
  it('renders outside any game', () => {
    renderAt('/tools/save-diff');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Save Diff');
    expect(screen.getByText('Load both saves to compare them.')).toBeInTheDocument();
  });
});
