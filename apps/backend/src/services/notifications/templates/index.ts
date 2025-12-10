/**
 * Email Templates
 *
 * Centralized email templates for notifications.
 * Templates can be extended to support different languages in the future.
 */

export interface EmailTemplateData {
  title: string;
  description: string;
  actions?: Array<{
    type: string;
    label: string;
    url?: string;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Generate HTML email template
 */
export function generateEmailHTML(data: EmailTemplateData): string {
  const actionsHTML = data.actions
    ?.map(
      action => `
      <div style="margin: 20px 0;">
        <a href="${action.url || '#'}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600;">
          ${action.label}
        </a>
      </div>
    `,
    )
    .join('') || '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin-top: 0;">${data.title}</h1>
          <p style="color: #666; font-size: 16px;">${data.description}</p>
          ${actionsHTML}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
          <p>Este es un mensaje automático de Revendiste. Por favor, no respondas a este correo.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email template
 */
export function generateEmailText(data: EmailTemplateData): string {
  const actionsText = data.actions
    ?.map(action => `\n${action.label}: ${action.url || 'N/A'}`)
    .join('\n') || '';

  return `
${data.title}

${data.description}
${actionsText}

---
Este es un mensaje automático de Revendiste. Por favor, no respondas a este correo.
  `.trim();
}

