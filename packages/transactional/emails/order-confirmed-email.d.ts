/**
 * Order Confirmed Email Template
 *
 * Sent to buyers when their order is confirmed.
 */
export interface OrderConfirmedEmailProps {
    eventName: string;
    totalAmount: string;
    currency: string;
    orderUrl: string;
    appBaseUrl?: string;
}
export declare const OrderConfirmedEmail: {
    ({ eventName, totalAmount, currency, orderUrl, appBaseUrl, }: OrderConfirmedEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: OrderConfirmedEmailProps;
};
export default OrderConfirmedEmail;
//# sourceMappingURL=order-confirmed-email.d.ts.map