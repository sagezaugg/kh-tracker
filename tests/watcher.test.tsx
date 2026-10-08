import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialData, useTracker } from '../src/state/store';
import { useUi } from '../src/state/ui';

const handleStore = vi.hoisted(() => ({
  canWatchFiles: vi.fn(() => true),
  loadSaveHandle: vi.fn<() => Promise<FileSystemFileHandle | null>>(async () => null),
  storeSaveHandle: vi.fn(async () => true),
  clearSaveHandle: vi.fn(async () => {}),
}));
vi.mock('../src/state/handleStore', () => handleStore);

const { pollOnce, POLL_MS, SaveWatcher } = await import('../src/state/saveWatcher');

/** A minimal raw save: one Final Mix slot labelled "Save 1", with the given Ansem Report bits. */
function saveFile(lastModified: number, reportBits = 0, valid = true): File {
  const b = new Uint8Array(0x4000);
  if (valid) {
    b.set([0x4b, 0x48, 0x32, 0x4a], 0);
    new DataView(b.buffer).setUint32(4, 0x3a, true);
    b[0x24ff] = 45;
    b[0x2498] = 2;
    b[0x36c4] = reportBits;
  }
  // jsdom's File has no arrayBuffer(), so hand back a File-shaped object.
  return {
    name: 'KHIIFM.png',
    lastModified,
    size: b.length,
    arrayBuffer: async () => b.buffer,
  } as unknown as File;
}

function fakeHandle(file: () => File, permission: PermissionState = 'granted') {
  return {
    name: 'KHIIFM.png',
    getFile: vi.fn(async () => file()),
    queryPermission: vi.fn(async () => permission),
  } as unknown as FileSystemFileHandle;
}

const progress = () => {
  const s = useTracker.getState();
  return s.playthroughs[s.activeId].progress;
};

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useTracker.setState({
      ...initialData(),
      watch: { enabled: true, mode: 'sync', slot: 'Save 1', lastModified: 1 },
    });
    useUi.setState({ toast: null, watchStatus: { kind: 'no-file' }, watchNonce: 0 });
  });
});
afterEach(() => vi.useRealTimers());

describe('pollOnce', () => {
  it('skips an unchanged file', async () => {
    expect(
      await pollOnce(
        fakeHandle(() => saveFile(1)),
        {},
      ),
    ).toEqual({ kind: 'unchanged' });
  });

  it('waits for the file to hold still, then re-imports it', async () => {
    const mem = {};
    const h = fakeHandle(() => saveFile(2, 1 << 6));
    expect(await pollOnce(h, mem)).toEqual({ kind: 'pending' });
    const r = await pollOnce(h, mem);
    expect(r).toEqual({ kind: 'imported', message: 'Save changed. Re-imported Save 1: 1 newly checked.' });
    expect(progress().checks['r.1']).toBe(true);
    expect(progress().difficulty).toBe(2);
    expect(useTracker.getState().watch.lastModified).toBe(2);
    expect(await pollOnce(h, mem)).toEqual({ kind: 'unchanged' });
  });

  it('restarts the wait if the file changes mid-write', async () => {
    const mem = {};
    let t = 2;
    const h = fakeHandle(() => saveFile(t));
    expect((await pollOnce(h, mem)).kind).toBe('pending');
    t = 3;
    expect((await pollOnce(h, mem)).kind).toBe('pending');
    expect((await pollOnce(h, mem)).kind).toBe('imported');
  });

  it('reports a file without the slot once, then waits for the next change', async () => {
    const mem = {};
    const h = fakeHandle(() => saveFile(2, 0, false));
    await pollOnce(h, mem);
    expect((await pollOnce(h, mem)).kind).toBe('failed');
    expect(await pollOnce(h, mem)).toEqual({ kind: 'unchanged' });
  });

  it('leaves checks made by hand alone', async () => {
    act(() => {
      useTracker.getState().toggle('r.2');
    });
    const mem = {};
    const h = fakeHandle(() => saveFile(2));
    await pollOnce(h, mem);
    await pollOnce(h, mem);
    expect(progress().checks['r.2']).toBe(true);
  });
});

describe('SaveWatcher', () => {
  it('asks to resume after a reload when permission is no longer granted', async () => {
    handleStore.loadSaveHandle.mockResolvedValueOnce(fakeHandle(() => saveFile(1), 'prompt'));
    render(<SaveWatcher />);
    await vi.waitFor(() =>
      expect(useUi.getState().watchStatus).toEqual({ kind: 'needs-permission', fileName: 'KHIIFM.png' }),
    );
  });

  it('polls in the background and toasts after a re-import', async () => {
    vi.useFakeTimers();
    let t = 1;
    handleStore.loadSaveHandle.mockResolvedValueOnce(fakeHandle(() => saveFile(t, 1 << 7)));
    render(<SaveWatcher />);
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(useUi.getState().watchStatus.kind).toBe('watching');
    t = 5;
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS * 2 + 10));
    expect(useUi.getState().toast).toBe('Save changed. Re-imported Save 1: 1 newly checked.');
    expect(progress().checks['r.2']).toBe(true);
  });

  it('does nothing while the setting is off', async () => {
    act(() => useTracker.getState().setWatch({ enabled: false }));
    render(<SaveWatcher />);
    await vi.waitFor(() => expect(useUi.getState().watchStatus).toEqual({ kind: 'off' }));
    expect(handleStore.loadSaveHandle).not.toHaveBeenCalled();
  });
});

describe('Config auto re-import setting', () => {
  it('turns the setting off and on', async () => {
    const { createMemoryRouter, RouterProvider } = await import('react-router-dom');
    const { routes, routerFuture } = await import('../src/router');
    const router = createMemoryRouter(routes, { initialEntries: ['/config'], future: routerFuture });
    render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
    const btn = await screen.findByRole('button', { name: /Re-import when the save changes/ });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    act(() => btn.click());
    expect(useTracker.getState().watch.enabled).toBe(false);
    expect(screen.getByRole('button', { name: /Re-import when the save changes: Off/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
