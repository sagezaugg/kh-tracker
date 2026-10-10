import { createSyncHandler } from '../server/sync.js';
import { createUpstashStore } from '../server/upstashStore.js';

/** Vercel Function for /api/sync (see server/sync.ts). The store is created per cold start. */
let handle: ((request: Request) => Promise<Response>) | null = null;

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      handle ??= createSyncHandler(createUpstashStore());
      return await handle(request);
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: 'Sync is unavailable right now.' }), {
        status: 503,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }
  },
};
