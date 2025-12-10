/**
 * Base Email Template
 *
 * Provides a consistent layout with header and footer for all Revendiste emails.
 * Uses Tailwind CSS for styling with the design system colors.
 */
interface BaseEmailProps {
    preview?: string;
    title: string;
    children: React.ReactNode;
    appBaseUrl?: string;
}
export declare function BaseEmail({ preview, title, children, appBaseUrl, }: BaseEmailProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=base-template.d.ts.map