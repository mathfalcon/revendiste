/** Payload pushed to `window.dataLayer` for GTM (and downstream Meta Pixel, etc.). */
export interface DataLayerEvent {
  event: string;
  event_id: string;
  user_id?: string | null;
  value?: number;
  currency?: string;
  timestamp: string;
  [key: string]: unknown;
}
