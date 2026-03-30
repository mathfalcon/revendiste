/**
 * Event image utilities - prefer flyer for display, fall back to hero.
 * Use for checkout, order cards, and any UI that shows an event image.
 */

export type EventImage = {
  imageType: string;
  url: string;
  id?: string;
};

/**
 * Returns the best image to display for an event: flyer first, then hero.
 * Use when you need a single thumbnail/display image (e.g. cards, checkout).
 */
export function getEventDisplayImage(
  images: EventImage[] | undefined,
): EventImage | undefined {
  if (!images?.length) return undefined;
  return (
    images.find(img => img.imageType === 'flyer') ??
    images.find(img => img.imageType === 'hero')
  );
}
