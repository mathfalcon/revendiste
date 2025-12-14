/**
 * Document Reminder Email Template
 *
 * Sent to sellers as a reminder to upload ticket documents
 * when the event is approaching.
 */
export interface DocumentReminderEmailProps {
    eventName: string;
    eventStartDate: string;
    ticketCount: number;
    hoursUntilEvent: number;
    uploadUrl: string;
    appBaseUrl?: string;
}
export declare const DocumentReminderEmail: {
    ({ eventName, eventStartDate, ticketCount, hoursUntilEvent, uploadUrl, appBaseUrl, }: DocumentReminderEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: DocumentReminderEmailProps;
};
export default DocumentReminderEmail;
//# sourceMappingURL=document-reminder-email.d.ts.map