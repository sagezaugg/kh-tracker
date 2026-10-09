import { isRouteErrorResponse } from 'react-router';
import { REPO_URL } from '../site';

/** A one-line description of whatever was thrown. */
export function describeError(err: unknown): string {
  if (isRouteErrorResponse(err)) return `${err.status} ${err.statusText}`.trim();
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}

/** Prefilled GitHub issue: the page and the error, nothing from the player's progress. */
export function issueUrl(path: string, detail: string): string {
  const body = `**Page:** \`${path}\`\n**Error:** \`${detail}\`\n\n**What I was doing:**\n\n`;
  const q = new URLSearchParams({ title: `Error on ${path}`, body });
  return `${REPO_URL}/issues/new?${q.toString()}`;
}
