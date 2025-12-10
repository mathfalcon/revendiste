/**
 * Order Expired Email Template
 *
 * Sent to buyers when their order expires.
 */
export interface OrderExpiredEmailProps {
    eventName: string;
    appBaseUrl?: string;
}
export declare const OrderExpiredEmail: {
    ({ eventName, appBaseUrl, }: OrderExpiredEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: OrderExpiredEmailProps;
};
export default OrderExpiredEmail;
//# sourceMappingURL=order-expired-email.d.ts.map