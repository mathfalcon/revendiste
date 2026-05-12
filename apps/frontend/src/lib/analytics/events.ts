export const ANALYTICS_EVENTS = {
  EVENT_PAGE_VIEWED: 'event_page_viewed',
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  ORDER_STARTED: 'order_started',
  CHECKOUT_PAYMENT_INITIATED: 'checkout_payment_initiated',
  CHECKOUT_COUNTRY_SELECTED: 'checkout_country_selected',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_ABANDONED: 'checkout_abandoned',
  PAYMENT_LINK_ERROR: 'payment_link_error',
  LISTING_FORM_STARTED: 'listing_form_started',
  TICKET_LISTING_CREATED: 'ticket_listing_created',
  TICKET_DOCUMENT_UPLOADED: 'ticket_document_uploaded',
  TICKET_DOCUMENT_DOWNLOADED: 'ticket_document_downloaded',
  PAYOUT_REQUESTED: 'payout_requested',
  PAYOUT_METHOD_ADDED: 'payout_method_added',
  PAYOUT_METHOD_DELETED: 'payout_method_deleted',
  IDENTITY_VERIFICATION_STARTED: 'identity_verification_started',
  SUPPORT_CASE_CREATED: 'support_case_created',
  FILTER_APPLIED: 'filter_applied',
  CONTACT_WHATSAPP_CLICKED: 'contact_whatsapp_clicked',
  CONTACT_INSTAGRAM_CLICKED: 'contact_instagram_clicked',
  CONTACT_TIKTOK_CLICKED: 'contact_tiktok_clicked',
  CONTACT_TWITTER_CLICKED: 'contact_twitter_clicked',
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Internal event name → Meta standard event (configure matching triggers in GTM). */
export const META_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  event_page_viewed: 'ViewContent',
  search_performed: 'Search',
  order_started: 'AddToCart',
  checkout_payment_initiated: 'InitiateCheckout',
  checkout_completed: 'Purchase',
  listing_form_started: 'Lead',
  ticket_listing_created: 'CompleteRegistration',
};
