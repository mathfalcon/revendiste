import {logger} from '~/utils';
import type {IWhatsAppProvider, WhatsAppTemplateComponent} from './IWhatsAppProvider';

/**
 * Console WhatsApp Provider
 *
 * Development provider that logs WhatsApp messages to the console
 * instead of sending them through the WhatsApp Business API.
 */
export class ConsoleWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(params: {
    to: string;
    templateName: string;
    templateLanguage: string;
    components?: WhatsAppTemplateComponent[];
  }): Promise<void> {
    const variables = params.components
      ?.flatMap(c => c.parameters.map(p => p.text))
      .join(', ');

    logger.info('[WhatsApp Console] Message sent', {
      to: params.to,
      template: params.templateName,
      language: params.templateLanguage,
      variables: variables || '(none)',
    });
  }
}
