/** A KHWiki page URL from its title ("Winner's Proof" -> https://www.khwiki.com/Winner%27s_Proof). */
export function khwikiUrl(title: string): string {
  return `https://www.khwiki.com/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/')}`;
}
