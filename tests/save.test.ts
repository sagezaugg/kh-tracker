// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseError, parseSave } from '../src/games/kh2/save/parseSave';
import { detect } from '../src/games/kh2/save/detect';
import {
  EQUIP_FORM_BASE,
  EQUIP_FORM_STRIDE,
  PC_FILE_SIZE,
  PC_FIRST_SLOT,
  PC_SLOT_STRIDE,
  PS2_CARD_SIZE,
  PS2_PAGE_DATA,
  PS2_PAGE_RAW,
  SLOT_SIZE,
} from '../src/games/kh2/save/offsets';
import { LOCATION_BY_ID } from '../src/games/kh2/data/locations';

interface SlotOpts {
  version?: number;
  region?: string;
  lv?: number;
}

/** Writes a minimal slot (magic, version, LV, munny, difficulty, world) into `buf` at `at`. */
function writeSlot(buf: Uint8Array, at: number, { version = 0x3a, region = 'J', lv = 45 }: SlotOpts = {}) {
  buf.set([0x4b, 0x48, 0x32, region.charCodeAt(0)], at);
  new DataView(buf.buffer).setUint32(at + 4, version, true);
  buf[at + 0x24ff] = lv;
  new DataView(buf.buffer).setUint32(at + 0x2440, 3779, true);
  buf[at + 0x2498] = 3;
  buf[at + 0x0c] = 18;
}

const setBit = (buf: Uint8Array, at: number, offset: number, bit: number) => {
  buf[at + offset] |= 1 << bit;
};

describe('parseSave', () => {
  it('finds a hand-built Final Mix slot and reads its header', () => {
    const buf = new Uint8Array(0x8000);
    writeSlot(buf, 0x200);
    const res = parseSave(buf.buffer);
    expect(res.format).toBe('raw');
    expect(res.unsupported).toBe(0);
    expect(res.slots).toHaveLength(1);
    const [s] = res.slots;
    expect(s).toMatchObject({
      label: 'Save 1',
      offset: 0x200,
      lv: 45,
      munny: 3779,
      difficulty: 3,
      diffName: 'Critical',
      world: 'The World That Never Was',
    });
    expect(s.bytes).toHaveLength(SLOT_SIZE);
    expect(parseError(res)).toBeNull();
  });

  it('accepts every region byte', () => {
    for (const region of ['J', 'U', 'E']) {
      const buf = new Uint8Array(0x4000);
      writeSlot(buf, 0, { region });
      expect(parseSave(buf).slots, region).toHaveLength(1);
    }
  });

  it('reports original KH2 saves as not Final Mix', () => {
    const buf = new Uint8Array(0x8000);
    writeSlot(buf, 0x10, { version: 0x2d });
    writeSlot(buf, 0x4000, { version: 0x2a });
    const res = parseSave(buf);
    expect(res.slots).toHaveLength(0);
    expect(res.unsupported).toBe(2);
    expect(parseError(res)).toMatch(/non-Final Mix/);
  });

  it('rejects slots whose Sora LV is out of range', () => {
    const buf = new Uint8Array(0x4000);
    writeSlot(buf, 0, { lv: 0 });
    expect(parseSave(buf).slots).toHaveLength(0);
    writeSlot(buf, 0, { lv: 100 });
    expect(parseSave(buf).slots).toHaveLength(0);
  });

  it('handles an empty file', () => {
    const res = parseSave(new ArrayBuffer(0));
    expect(res).toEqual({ format: 'raw', slots: [], unsupported: 0 });
    expect(parseError(res)).toMatch(/No Kingdom Hearts II Final Mix save data/);
  });

  it('labels PC slots by their position', () => {
    const buf = new Uint8Array(PC_FILE_SIZE);
    writeSlot(buf, PC_FIRST_SLOT + PC_SLOT_STRIDE);
    writeSlot(buf, PC_FIRST_SLOT + 3 * PC_SLOT_STRIDE, { lv: 99 });
    const res = parseSave(buf);
    expect(res.format).toBe('pc');
    expect(res.slots.map((s) => s.label)).toEqual(['Slot 1', 'Slot 3']);
    expect(res.slots[1].lv).toBe(99);
  });

  it('strips ECC bytes from a PCSX2 card before scanning', () => {
    // Build the logical 8 MiB image with a save starting mid-page, then interleave junk ECC.
    const logical = new Uint8Array((PS2_CARD_SIZE / PS2_PAGE_RAW) * PS2_PAGE_DATA);
    const at = 0x12345;
    writeSlot(logical, at);
    setBit(logical, at, 0x36c4, 6); // Ansem Report 1
    const card = new Uint8Array(PS2_CARD_SIZE).fill(0xff);
    for (let p = 0; p * PS2_PAGE_DATA < logical.length; p++) {
      card.set(logical.subarray(p * PS2_PAGE_DATA, (p + 1) * PS2_PAGE_DATA), p * PS2_PAGE_RAW);
    }
    const res = parseSave(card);
    expect(res.format).toBe('ps2-card');
    expect(res.slots).toHaveLength(1);
    expect(res.slots[0].offset).toBe(at);
    expect(res.slots[0].lv).toBe(45);
    expect(detect(res.slots[0].bytes).checks['r.1']).toBe(true);
  });
});

describe('detect', () => {
  function slotWith(edit: (b: Uint8Array) => void): Uint8Array {
    const buf = new Uint8Array(SLOT_SIZE + 0x10);
    writeSlot(buf, 0);
    edit(buf);
    return parseSave(buf).slots[0].bytes;
  }

  it('reads flags, counts, equipped Keyblades and clamped levels', () => {
    const chest = LOCATION_BY_ID.get('w.BambooGroveEther');
    if (!chest) throw new Error('missing fixture location');
    const bytes = slotWith((b) => {
      setBit(b, 0, chest.offset, chest.bit);
      setBit(b, 0, 0x36c6, 2); // Ansem Report 13
      b[0x35a2] = 1; // Oathkeeper in inventory
      new DataView(b.buffer).setUint16(EQUIP_FORM_BASE + 2 * EQUIP_FORM_STRIDE, 500, true); // Ultima on Limit
      setBit(b, 0, 0x36c0, 1); // Valor unlocked
      b[0x32f6] = 9; // Valor LV, clamped to 7
      b[0x332e] = 5; // Wisdom LV but locked
      b[0x3594] = 3; // Firaga
      b[0x3526] = 0; // Summon LV clamps up to 1
      b[0x36b4] = 1; // Proof of Peace
    });
    const d = detect(bytes);
    expect(d.checks['w.BambooGroveEther']).toBe(true);
    expect(d.checks['w.BambooGroveDarkShard']).toBe(false);
    expect(d.checks['r.13']).toBe(true);
    expect(d.checks['r.1']).toBe(false);
    expect(d.checks['kb.oathkeeper']).toBe(true);
    expect(d.checks['kb.ultima-weapon']).toBe(true);
    expect(d.checks['kb.fenrir']).toBe(false);
    expect(d.checks['pf.peace']).toBe(true);
    expect(d.values['lv.sora']).toBe(45);
    expect(d.values['lv.valor']).toBe(7);
    expect(d.values['lv.wisdom']).toBe(0);
    expect(d.values['lv.fire']).toBe(3);
    expect(d.values['lv.summon']).toBe(1);
  });

  it('only reports save-probed items', () => {
    const d = detect(slotWith(() => {}));
    expect('pz.awakening' in d.checks).toBe(false);
    expect('do.vexen' in d.checks).toBe(false);
    expect('do.xemnas' in d.checks).toBe(true);
    expect('lv.anti' in d.values).toBe(false);
  });
});
