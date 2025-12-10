/**
 * Ticket Sold Email Template
 *
 * Sent to buyers when their ticket purchase is successful.
 * Prompts them to upload ticket documents.
 */
export interface TicketSoldEmailProps {
    eventName: string;
    ticketCount: number;
    uploadUrl: string;
    appBaseUrl?: string;
}
export declare const TicketSoldEmail: {
    ({ eventName, ticketCount, uploadUrl, appBaseUrl, }: TicketSoldEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: TicketSoldEmailProps;
};
export default TicketSoldEmail;
//# sourceMappingURL=ticket-sold-email.d.ts.map