/**
 * Seller Ticket Sold Email Template
 *
 * Sent to sellers when their tickets are sold.
 * Conditionally shows upload button based on timing restrictions.
 */
export interface SellerTicketSoldEmailProps {
    eventName: string;
    eventStartDate: string;
    ticketCount: number;
    uploadUrl?: string;
    hoursUntilAvailable?: number;
    appBaseUrl?: string;
}
export declare const SellerTicketSoldEmail: {
    ({ eventName, eventStartDate, ticketCount, uploadUrl, hoursUntilAvailable, appBaseUrl, }: SellerTicketSoldEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: SellerTicketSoldEmailProps;
};
export default SellerTicketSoldEmail;
//# sourceMappingURL=seller-ticket-sold-email.d.ts.map