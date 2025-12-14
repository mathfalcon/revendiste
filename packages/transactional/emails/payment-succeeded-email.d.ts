/**
 * Payment Succeeded Email Template
 *
 * Sent to buyers when payment is successfully processed.
 */
export interface PaymentSucceededEmailProps {
    eventName: string;
    totalAmount: string;
    currency: string;
    orderUrl: string;
    appBaseUrl?: string;
}
export declare const PaymentSucceededEmail: {
    ({ eventName, totalAmount, currency, orderUrl, appBaseUrl, }: PaymentSucceededEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: PaymentSucceededEmailProps;
};
export default PaymentSucceededEmail;
//# sourceMappingURL=payment-succeeded-email.d.ts.map