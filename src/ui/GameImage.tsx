import { useContext, useState } from 'react';
import { GameContext } from '../games/context';
import { magicGlyphName } from './icons/glyphData';
import { MagicGlyph } from './icons/MagicGlyph';

interface GameImageProps {
  src: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * A self-hosted game image. Always decorative (the name is shown as text next to it), lazily loaded with
 * fixed dimensions, and it removes itself if the file fails to load instead of showing a broken box.
 */
export function GameImage({ src, width, height, className }: GameImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) return null;
  return (
    <img
      className={className}
      src={src}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
    />
  );
}

/**
 * The icon for an item: a spell glyph, a game image, or nothing. Works only inside a game's screens.
 * `size` is the height of a square icon; wide ones (Keyblades, staves) are a little shorter and as wide as
 * their shape needs.
 */
export function ItemIcon({ id, size = 28, className }: { id: string; size?: number; className?: string }) {
  const game = useContext(GameContext);
  const glyph = magicGlyphName(id);
  if (glyph) return <MagicGlyph name={glyph} size={size} className={className} />;
  const icon = game?.icons.items[id];
  if (!icon) return null;
  const [src, w, h] = icon;
  const height = w > h * 1.5 ? Math.round(size * 0.7) : size;
  return <GameImage src={src} width={Math.round((height * w) / h)} height={height} className={className} />;
}
