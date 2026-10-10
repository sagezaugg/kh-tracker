/**
 * Cross-device sync: one record per 6-character code, holding every game's progress. Not private by design:
 * anyone with the code can read and write it. The handler is plain Web Request -> Response with a pluggable
 * store, so the same code runs on Vercel (Upstash Redis), in `npm run dev` and in tests (memory).
 *
 *   POST /api/sync              { games }            -> 201 { code, rev, updatedAt }
 *   GET  /api/sync?code=XXXXXX                       -> 200 { code, rev, updatedAt, games } | 404
 *   PUT  /api/sync?code=XXXXXX  { baseRev, games }   -> 200 { rev, updatedAt } | 409 { current } | 404
 */

export interface SyncRecord {
  rev: number;
  updatedAt: string;
  /** Game id -> that game's synced tracker data. Unknown (future) games are stored as-is. */
  games: Record<string, unknown>;
}

export interface SyncStore {
  get(code: string): Promise<SyncRecord | null>;
  /** Writes only if the code is unused. */
  create(code: string, record: SyncRecord, ttlSeconds: number): Promise<boolean>;
  /** Writes only if the stored rev is still `expectedRev`. */
  replace(
    code: string,
    expectedRev: number,
    record: SyncRecord,
    ttlSeconds: number,
  ): Promise<'ok' | 'conflict' | 'missing'>;
  /** Counts a request against a rate-limit window; returns the count so far. */
  hit(key: string, windowSeconds: number): Promise<number>;
}

/** No 0/O, 1/I/L: easy to read aloud and type on a phone. 31^6 ≈ 887 million codes. */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_LENGTH = 6;
export const MAX_BODY_BYTES = 100 * 1024;
export const MAX_GAMES = 24;
/** Codes nobody has written to for a year expire. */
export const TTL_SECONDS = 365 * 24 * 60 * 60;
export const RATE_LIMIT = { requests: 60, windowSeconds: 60 };

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);
const GAME_ID_RE = /^[a-z0-9]{2,12}$/;

export function normalizeCode(raw: string | null): string | null {
  const code = (raw ?? '').trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

export function generateCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return code;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Game ids must look like ids and each game's data must be an object. Contents are validated by the app. */
function validGames(v: unknown): Record<string, unknown> | null {
  if (!isObj(v)) return null;
  const entries = Object.entries(v);
  if (entries.length > MAX_GAMES) return null;
  for (const [id, data] of entries) if (!GAME_ID_RE.test(id) || !isObj(data)) return null;
  return v;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

async function readBody(request: Request): Promise<Record<string, unknown> | 'too-large' | null> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return 'too-large';
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return 'too-large';
  try {
    const parsed: unknown = JSON.parse(text);
    return isObj(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return fwd || request.headers.get('x-real-ip') || 'unknown';
}

export interface HandlerOptions {
  now?: () => Date;
  random?: () => number;
}

export function createSyncHandler(store: SyncStore, opts: HandlerOptions = {}) {
  const now = opts.now ?? (() => new Date());
  return async function handle(request: Request): Promise<Response> {
    const count = await store.hit(`rl:${clientKey(request)}`, RATE_LIMIT.windowSeconds);
    if (count > RATE_LIMIT.requests) return json(429, { error: 'Too many requests. Try again in a minute.' });

    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === 'POST') {
      const body = await readBody(request);
      if (body === 'too-large') return json(413, { error: 'Progress is too large to sync.' });
      const games = body && validGames(body.games ?? {});
      if (!games) return json(400, { error: 'Invalid progress data.' });
      const record: SyncRecord = { rev: 1, updatedAt: now().toISOString(), games };
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = generateCode(opts.random);
        if (await store.create(code, record, TTL_SECONDS)) {
          return json(201, { code, rev: record.rev, updatedAt: record.updatedAt });
        }
      }
      return json(503, { error: 'Could not create a sync code. Try again.' });
    }

    const code = normalizeCode(url.searchParams.get('code'));
    if (!code) return json(400, { error: 'Sync codes are 6 letters and numbers.' });

    if (method === 'GET') {
      const record = await store.get(code);
      return record
        ? json(200, { code, ...record })
        : json(404, { error: 'No progress is saved under that code.' });
    }

    if (method === 'PUT') {
      const body = await readBody(request);
      if (body === 'too-large') return json(413, { error: 'Progress is too large to sync.' });
      const games = body && validGames(body.games);
      const baseRev = body?.baseRev;
      if (!games || typeof baseRev !== 'number' || !Number.isInteger(baseRev)) {
        return json(400, { error: 'Invalid progress data.' });
      }
      const record: SyncRecord = { rev: baseRev + 1, updatedAt: now().toISOString(), games };
      const result = await store.replace(code, baseRev, record, TTL_SECONDS);
      if (result === 'missing') return json(404, { error: 'No progress is saved under that code.' });
      if (result === 'conflict') return json(409, { current: { code, ...(await store.get(code)) } });
      return json(200, { rev: record.rev, updatedAt: record.updatedAt });
    }

    return json(405, { error: 'Method not allowed.' });
  };
}

/** In-memory store for local development and tests. */
export function createMemoryStore(): SyncStore & { records: Map<string, SyncRecord> } {
  const records = new Map<string, SyncRecord>();
  const hits = new Map<string, { count: number; until: number }>();
  const copy = (r: SyncRecord): SyncRecord => JSON.parse(JSON.stringify(r));
  return {
    records,
    async get(code) {
      const r = records.get(code);
      return r ? copy(r) : null;
    },
    async create(code, record) {
      if (records.has(code)) return false;
      records.set(code, copy(record));
      return true;
    },
    async replace(code, expectedRev, record) {
      const cur = records.get(code);
      if (!cur) return 'missing';
      if (cur.rev !== expectedRev) return 'conflict';
      records.set(code, copy(record));
      return 'ok';
    },
    async hit(key, windowSeconds) {
      const t = Date.now();
      const h = hits.get(key);
      if (!h || h.until < t) {
        hits.set(key, { count: 1, until: t + windowSeconds * 1000 });
        return 1;
      }
      h.count++;
      return h.count;
    },
  };
}
