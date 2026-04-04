/**
 * WhatsApp template component for variable substitution.
 * WhatsApp Business API requires pre-approved templates with numbered parameters.
 */
export interface WhatsAppTemplateComponent {
  type: 'body';
  parameters: Array<{type: 'text'; text: string}>;
}

/**
 * WhatsApp Provider Interface
 *
 * Defines the contract for WhatsApp notification providers.
 * Uses the WhatsApp Business API template messaging system.
 * All business-initiated messages must use pre-approved templates.
 */
export interface IWhatsAppProvider {
  /**
   * Send a WhatsApp template message
   * @param params - Message parameters
   * @returns Promise that resolves when message is sent
   * @throws Error if message sending fails
   */
  sendMessage(params: {
    /** Recipient phone number in E.164 format (e.g. +59899123456) */
    to: string;
    /** Pre-approved template name (e.g. 'document_reminder') */
    templateName: string;
    /** Template language code (e.g. 'es') */
    templateLanguage: string;
    /** Template variable components */
    components?: WhatsAppTemplateComponent[];
  }): Promise<void>;
}
