/**
 * Payment Failed Email Template
 *
 * Sent to buyers when payment processing fails.
 */
export interface PaymentFailedEmailProps {
    eventName: string;
    errorMessage?: string;
    retryUrl: string;
    appBaseUrl?: string;
}
export declare const PaymentFailedEmail: {
    ({ eventName, errorMessage, retryUrl, appBaseUrl, }: PaymentFailedEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: PaymentFailedEmailProps;
};
export default PaymentFailedEmail;
//# sourceMappingURL=payment-failed-email.d.ts.map