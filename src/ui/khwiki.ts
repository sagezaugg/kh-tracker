/**
 * A KHWiki page URL from its title, optionally with a #section
 * ("Winner's Proof" -> https://www.khwiki.com/Winner's_Proof, "Trophies#Kingdom_Hearts_Final_Mix" keeps the anchor).
 */
export function khwikiUrl(title: string): string {
  const [page, section] = title.split('#', 2);
  const path = encodeURIComponent(page.replace(/ /g, '_')).replace(/%2F/g, '/');
  return `https://www.khwiki.com/${path}${section ? `#${encodeURIComponent(section)}` : ''}`;
}
