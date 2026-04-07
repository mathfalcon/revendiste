/**
 * Event image utilities — list/card surfaces use the flyer when present (square art),
 * otherwise the hero. Thumbnails are stored per row (flyer thumbs from flyer bytes,
 * hero thumbs from hero bytes), so always take `url` + `thumbnailUrl` from the same
 * image object this helper returns.
 */

export type EventImage = {
  imageType: string;
  url: string;
  id?: string;
  thumbnailUrl?: string | null;
};

/**
 * Flyer first, then hero. Ignores `og_hero` and other types.
 * Use for EventCard, trending strip, checkout, order summaries, etc.
 */
export function getEventDisplayImage(
  images: EventImage[] | undefined | null,
): EventImage | undefined {
  if (!images?.length) return undefined;
  return (
    images.find(img => img.imageType === 'flyer') ??
    images.find(img => img.imageType === 'hero')
  );
}
