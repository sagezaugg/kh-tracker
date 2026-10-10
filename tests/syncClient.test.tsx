import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStore, createSyncHandler } from '../server/sync';
import { syncedPart } from '../src/core/store';
import { KH1 } from '../src/games/kh1/game';
import { KH2 } from '../src/games/kh2/game';
import {
  disableSync,
  enableSync,
  fingerprint,
  joinSync,
  pushIfChanged,
  resolveSync,
  syncNow,
  useSync,
} from '../src/sync/engine';
import { kh2Progress, renderAt, resetAll } from './helpers';

let server = createMemoryStore();
let offline = false;

beforeEach(() => {
  resetAll();
  disableSync();
  server = createMemoryStore();
  offline = false;
  const handle = createSyncHandler(server);
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    if (offline) throw new TypeError('Failed to fetch');
    return handle(new Request(`http://localhost${input}`, init));
  });
});
afterEach(() => vi.unstubAllGlobals());

const code = () => useSync.getState().code!;
const remote = () => server.records.get(code())!;
/** Another device saves: rewrites one game on the server and bumps the revision. */
const otherDeviceSaves = (gameId: string, change: (data: ReturnType<typeof syncedPart>) => void) => {
  const rec = remote();
  const data = structuredClone(rec.games[gameId]) as ReturnType<typeof syncedPart>;
  change(data);
  server.records.set(code(), { ...rec, rev: rec.rev + 1, games: { ...rec.games, [gameId]: data } });
};
const checkOn = (data: ReturnType<typeof syncedPart>, id: string) => {
  data.playthroughs[data.activeId].progress.checks[id] = true;
};
const kh1Checks = () => {
  const s = KH1.store.getState();
  return s.playthroughs[s.activeId].progress.checks;
};

describe('sync engine', () => {
  it('turns on with a new code holding every game', async () => {
    act(() => void KH2.store.getState().toggle('w.StormRider'));
    await act(enableSync);
    expect(code()).toMatch(/^[A-Z2-9]{6}$/);
    expect(Object.keys(remote().games).sort()).toEqual(['kh1', 'kh2']);
    expect(useSync.getState().status).toEqual({ kind: 'idle' });
  });

  it('pulls a change made on another device', async () => {
    await act(enableSync);
    otherDeviceSaves('kh2', (d) => checkOn(d, 'w.StormRider'));
    await act(syncNow);
    expect(kh2Progress().checks['w.StormRider']).toBe(true);
  });

  it('does not upload anything back after a pull, so two devices never ping-pong', async () => {
    act(() => void KH2.store.getState().toggle('w.StormRider'));
    await act(enableSync);
    otherDeviceSaves('kh2', (d) => checkOn(d, 'w.Hades'));
    const rev = remote().rev;
    await act(syncNow);
    await act(syncNow);
    await act(pushIfChanged);
    expect(kh2Progress().checks['w.Hades']).toBe(true);
    expect(remote().rev).toBe(rev);
  });

  it('fingerprints data the same before and after a round trip through JSON', () => {
    const data = { a: 1, b: undefined, c: { d: [1, { e: undefined }] } };
    expect(fingerprint(data)).toBe(fingerprint(JSON.parse(JSON.stringify(data))));
    expect(fingerprint({ x: 1, y: 2 })).toBe(fingerprint({ y: 2, x: 1 }));
    expect(fingerprint({ x: 1 })).not.toBe(fingerprint({ x: 2 }));
  });

  it('uploads a change made here', async () => {
    await act(enableSync);
    act(() => void KH2.store.getState().toggle('w.StormRider'));
    await act(pushIfChanged);
    const data = remote().games.kh2 as ReturnType<typeof syncedPart>;
    expect(data.playthroughs[data.activeId].progress.checks['w.StormRider']).toBe(true);
  });

  it('merges automatically when the two devices changed different games', async () => {
    await act(enableSync);
    otherDeviceSaves('kh2', (d) => checkOn(d, 'w.StormRider'));
    act(() => void KH1.store.getState().toggle('kb.oathkeeper'));
    await act(pushIfChanged);
    expect(useSync.getState().status).toEqual({ kind: 'idle' });
    expect(kh2Progress().checks['w.StormRider']).toBe(true);
    const kh1 = remote().games.kh1 as ReturnType<typeof syncedPart>;
    expect(kh1.playthroughs[kh1.activeId].progress.checks['kb.oathkeeper']).toBe(true);
  });

  it('asks when the same game changed on both, and can take the other device', async () => {
    await act(enableSync);
    otherDeviceSaves('kh1', (d) => checkOn(d, 'kb.lionheart'));
    act(() => void KH1.store.getState().toggle('kb.oathkeeper'));
    await act(syncNow);
    expect(useSync.getState().status).toMatchObject({ kind: 'conflict', games: ['kh1'] });
    await act(() => resolveSync('theirs'));
    expect(kh1Checks()['kb.lionheart']).toBe(true);
    expect(kh1Checks()['kb.oathkeeper']).toBeUndefined();
    expect(useSync.getState().status).toEqual({ kind: 'idle' });
  });

  it('can keep this device in a conflict, overwriting the other copy', async () => {
    await act(enableSync);
    otherDeviceSaves('kh1', (d) => checkOn(d, 'kb.lionheart'));
    act(() => void KH1.store.getState().toggle('kb.oathkeeper'));
    await act(syncNow);
    await act(() => resolveSync('mine'));
    const kh1 = remote().games.kh1 as ReturnType<typeof syncedPart>;
    const checks = kh1.playthroughs[kh1.activeId].progress.checks;
    expect(checks['kb.oathkeeper']).toBe(true);
    expect(checks['kb.lionheart']).toBeUndefined();
  });

  it('keeps games from newer versions of the tracker when it uploads', async () => {
    await act(enableSync);
    const rec = remote();
    server.records.set(code(), { ...rec, rev: rec.rev + 1, games: { ...rec.games, kh3: { future: true } } });
    await act(syncNow);
    act(() => void KH2.store.getState().toggle('w.StormRider'));
    await act(pushIfChanged);
    expect(remote().games.kh3).toEqual({ future: true });
  });

  it('joins a code straight away on a device with no progress', async () => {
    await act(enableSync);
    otherDeviceSaves('kh2', (d) => checkOn(d, 'w.StormRider'));
    const shared = code();
    act(() => disableSync());
    resetAll();
    await act(async () => void (await joinSync(shared.toLowerCase())));
    expect(code()).toBe(shared);
    expect(kh2Progress().checks['w.StormRider']).toBe(true);
  });

  it('asks before joining on a device that already has progress', async () => {
    await act(enableSync);
    otherDeviceSaves('kh2', (d) => checkOn(d, 'w.StormRider'));
    const shared = code();
    act(() => disableSync());
    act(() => void KH1.store.getState().toggle('kb.oathkeeper'));
    await act(async () => void (await joinSync(shared)));
    expect(useSync.getState().status.kind).toBe('join-choice');
    await act(() => resolveSync('theirs'));
    expect(kh2Progress().checks['w.StormRider']).toBe(true);
    expect(kh1Checks()['kb.oathkeeper']).toBeUndefined();
  });

  it('reports an unknown code when joining', async () => {
    const res = await joinSync('ZZZZZZ');
    expect(res.error).toMatch(/No progress/);
    expect(code()).toBeNull();
  });

  it('goes offline quietly and catches up later', async () => {
    await act(enableSync);
    offline = true;
    act(() => void KH2.store.getState().toggle('w.StormRider'));
    await act(pushIfChanged);
    expect(useSync.getState().status).toEqual({ kind: 'offline' });
    offline = false;
    await act(syncNow);
    const data = remote().games.kh2 as ReturnType<typeof syncedPart>;
    expect(data.playthroughs[data.activeId].progress.checks['w.StormRider']).toBe(true);
  });

  it('says so when the code has gone', async () => {
    await act(enableSync);
    server.records.delete(code());
    await act(syncNow);
    expect(useSync.getState().status).toMatchObject({ kind: 'error' });
  });
});

describe('sync banner', () => {
  it('appears on every page while a conflict waits, linking to Config', async () => {
    await act(enableSync);
    otherDeviceSaves('kh1', (d) => checkOn(d, 'kb.lionheart'));
    act(() => void KH1.store.getState().toggle('kb.oathkeeper'));
    await act(syncNow);
    renderAt('/kh2/worlds/tt');
    const banner = screen.getByRole('complementary', { name: 'Sync' });
    expect(banner).toHaveTextContent('KH1FM progress changed on two devices');
    expect(within(banner).getByRole('link', { name: /Choose which to keep/ })).toHaveAttribute(
      'href',
      '/kh1/config',
    );
  });
});

describe('sync card', () => {
  it('turns sync on from Config and shows the code', async () => {
    renderAt('/kh2/config');
    const card = screen.getByRole('region', { name: 'Sync between devices' });
    await userEvent.click(within(card).getByRole('button', { name: 'Turn on sync' }));
    expect(await within(card).findByLabelText('Your sync code')).toHaveTextContent(code());
    expect(within(card).getByText(/^Synced /)).toBeInTheDocument();
  });

  it('joins with a code typed in lower case', async () => {
    await act(enableSync);
    const shared = code();
    act(() => disableSync());
    renderAt('/kh1/config');
    const card = screen.getByRole('region', { name: 'Sync between devices' });
    await userEvent.type(within(card).getByRole('textbox'), shared.toLowerCase());
    await userEvent.click(within(card).getByRole('button', { name: 'Use this code' }));
    expect(await within(card).findByLabelText('Your sync code')).toHaveTextContent(shared);
  });

  it('stops syncing on this device without touching progress', async () => {
    act(() => void KH2.store.getState().toggle('w.StormRider'));
    await act(enableSync);
    renderAt('/kh2/config');
    await userEvent.click(screen.getByRole('button', { name: 'Stop syncing on this device' }));
    expect(useSync.getState().code).toBeNull();
    expect(kh2Progress().checks['w.StormRider']).toBe(true);
  });
});
