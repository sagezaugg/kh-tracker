import { describe, expect, it } from 'vitest';
import {
  CODE_ALPHABET,
  MAX_BODY_BYTES,
  RATE_LIMIT,
  createMemoryStore,
  createSyncHandler,
  generateCode,
  normalizeCode,
} from '../server/sync';

const setup = () => {
  const store = createMemoryStore();
  return { store, handle: createSyncHandler(store) };
};
const req = (method: string, query = '', body?: unknown, ip = '1.1.1.1') =>
  new Request(`http://x/api/sync${query}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('sync API', () => {
  it('creates a code, then reads and updates it', async () => {
    const { handle } = setup();
    const created = await handle(req('POST', '', { games: { kh2: { profile: 'everything' } } }));
    expect(created.status).toBe(201);
    const { code, rev } = await created.json();
    expect(code).toMatch(new RegExp(`^[${CODE_ALPHABET}]{6}$`));
    expect(rev).toBe(1);

    const got = await handle(req('GET', `?code=${code.toLowerCase()}`));
    expect(await got.json()).toMatchObject({ code, rev: 1, games: { kh2: { profile: 'everything' } } });

    const put = await handle(
      req('PUT', `?code=${code}`, { baseRev: 1, games: { kh2: { profile: 'journal' } } }),
    );
    expect(put.status).toBe(200);
    expect((await put.json()).rev).toBe(2);
  });

  it('refuses a save based on an old revision and returns the newer data', async () => {
    const { handle } = setup();
    const { code } = await (await handle(req('POST', '', { games: {} }))).json();
    await handle(req('PUT', `?code=${code}`, { baseRev: 1, games: { kh1: { a: 1 } } }));
    const stale = await handle(req('PUT', `?code=${code}`, { baseRev: 1, games: { kh1: { a: 2 } } }));
    expect(stale.status).toBe(409);
    expect((await stale.json()).current).toMatchObject({ rev: 2, games: { kh1: { a: 1 } } });
  });

  it('keeps games it does not know about (future games)', async () => {
    const { handle } = setup();
    const { code } = await (await handle(req('POST', '', { games: { kh3: { x: 1 }, kh1: {} } }))).json();
    expect((await (await handle(req('GET', `?code=${code}`))).json()).games.kh3).toEqual({ x: 1 });
  });

  it('answers 404 for an unknown code and 400 for a malformed one', async () => {
    const { handle } = setup();
    expect((await handle(req('GET', '?code=ZZZZZZ'))).status).toBe(404);
    expect((await handle(req('PUT', '?code=ZZZZZZ', { baseRev: 1, games: {} }))).status).toBe(404);
    expect((await handle(req('GET', '?code=O0O0O0'))).status).toBe(400);
    expect((await handle(req('GET', ''))).status).toBe(400);
  });

  it('rejects bad payloads and oversized ones', async () => {
    const { handle } = setup();
    expect((await handle(req('POST', '', { games: { 'Bad Id!': {} } }))).status).toBe(400);
    expect((await handle(req('POST', '', { games: { kh1: 'nope' } }))).status).toBe(400);
    expect((await handle(req('POST', '', 'not json'))).status).toBe(400);
    const { code } = await (await handle(req('POST', '', { games: {} }))).json();
    expect((await handle(req('PUT', `?code=${code}`, { games: {} }))).status).toBe(400);
    const huge = { games: { kh1: { blob: 'x'.repeat(MAX_BODY_BYTES) } } };
    expect((await handle(req('POST', '', huge))).status).toBe(413);
  });

  it('rate-limits a single client', async () => {
    const { handle } = setup();
    for (let i = 0; i < RATE_LIMIT.requests; i++)
      await handle(req('GET', '?code=ZZZZZZ', undefined, '9.9.9.9'));
    expect((await handle(req('GET', '?code=ZZZZZZ', undefined, '9.9.9.9'))).status).toBe(429);
    expect((await handle(req('GET', '?code=ZZZZZZ', undefined, '8.8.8.8'))).status).toBe(404);
  });

  it('retries code generation on a clash', async () => {
    const store = createMemoryStore();
    store.records.set('222222', { rev: 1, updatedAt: '', games: {} });
    const seq = [0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const handle = createSyncHandler(store, { random: () => seq.shift() ?? 0.5 });
    const { code } = await (await handle(req('POST', '', { games: {} }))).json();
    expect(code).not.toBe('222222');
  });

  it('normalises and generates readable codes', () => {
    expect(normalizeCode(' k7qm2x ')).toBe('K7QM2X');
    expect(normalizeCode('K7QM2')).toBeNull();
    expect(normalizeCode('IL0O12')).toBeNull();
    expect(generateCode(() => 0)).toBe('222222');
  });
});
