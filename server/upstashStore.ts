import { Redis } from '@upstash/redis';
import type { SyncRecord, SyncStore } from './sync.js';

/**
 * Sync records in Upstash Redis (installed from the Vercel Marketplace, which adds the credentials as
 * environment variables). Each code is a hash { rev, updatedAt, games } so a small script can compare the
 * revision and write in one atomic step. Values are handled as strings (automatic deserialization off).
 */

const key = (code: string) => `sync:${code}`;

// Returns 1 if written, 0 if the code is taken.
const CREATE = `
if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
redis.call('HSET', KEYS[1], 'rev', ARGV[1], 'updatedAt', ARGV[2], 'games', ARGV[3])
redis.call('EXPIRE', KEYS[1], ARGV[4])
return 1`;

// Returns 1 if written, -1 if the code doesn't exist, -2 if someone else saved first.
const REPLACE = `
local rev = redis.call('HGET', KEYS[1], 'rev')
if not rev then return -1 end
if rev ~= ARGV[1] then return -2 end
redis.call('HSET', KEYS[1], 'rev', ARGV[2], 'updatedAt', ARGV[3], 'games', ARGV[4])
redis.call('EXPIRE', KEYS[1], ARGV[5])
return 1`;

export function createUpstashStore(env: Record<string, string | undefined> = process.env): SyncStore {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Upstash Redis credentials are not configured');
  const redis = new Redis({ url, token, automaticDeserialization: false });

  return {
    async get(code) {
      const h = await redis.hgetall<Record<string, string>>(key(code));
      if (!h || h.rev === undefined) return null;
      return {
        rev: Number(h.rev),
        updatedAt: String(h.updatedAt ?? ''),
        games: JSON.parse(String(h.games ?? '{}')),
      };
    },
    async create(code, record: SyncRecord, ttl) {
      const r = await redis.eval(
        CREATE,
        [key(code)],
        [String(record.rev), record.updatedAt, JSON.stringify(record.games), String(ttl)],
      );
      return Number(r) === 1;
    },
    async replace(code, expectedRev, record, ttl) {
      const r = Number(
        await redis.eval(
          REPLACE,
          [key(code)],
          [
            String(expectedRev),
            String(record.rev),
            record.updatedAt,
            JSON.stringify(record.games),
            String(ttl),
          ],
        ),
      );
      return r === 1 ? 'ok' : r === -1 ? 'missing' : 'conflict';
    },
    async hit(k, windowSeconds) {
      const n = await redis.incr(k);
      if (n === 1) await redis.expire(k, windowSeconds);
      return n;
    },
  };
}
