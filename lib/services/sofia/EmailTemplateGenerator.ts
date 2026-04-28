import DOMPurify from 'isomorphic-dompurify';

interface EmailTemplateData {
  subject: string;
  body: string;
  ctaLink?: string;
  ctaText?: string;
  // Add more dynamic fields as needed
}

export class SofiaEmailTemplateGenerator {
  /**
   * Sanitize HTML input to prevent XSS attacks
   * Uses DOMPurify for comprehensive sanitization
   */
  private sanitizeHtml(value: string): string {
    // First pass: DOMPurify sanitization
    const sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [], // Strip all attributes
      KEEP_CONTENT: true, // Keep text content
    });
    
    // Second pass: HTML entity encoding for extra safety
    return this.escapeHtml(sanitized);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private sanitizeUrl(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  generateHtmlTemplate(data: EmailTemplateData): string {
    // Double sanitization: DOMPurify + HTML entity encoding
    const safeSubject = this.sanitizeHtml(data.subject);
    const safeBody = this.sanitizeHtml(data.body);
    const safeCtaText = this.sanitizeHtml(data.ctaText || 'Learn More');
    const safeCtaLink = this.sanitizeUrl(data.ctaLink);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${safeSubject}</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
              .header { background-color: #b8704a; color: white; padding: 10px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; }
              .button { display: inline-block; background-color: #d18b5c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
              .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Buffr Host</h2>
              </div>
              <div class="content">
                  <p>Dear Guest,</p>
                  <p>${safeBody}</p>
                  ${safeCtaLink ? `<p><a href="${safeCtaLink}" class="button">${safeCtaText}</a></p>` : ''}
                  <p>Thank you for choosing Buffr Host.</p>
                  <p>Best regards,<br>Sofia Concierge</p>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Buffr Host. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  generateTextTemplate(data: EmailTemplateData): string {
    const cleanBody = data.body.replace(/<[^>]*>/g, '').trim();
    const cleanCtaText = (data.ctaText || 'Learn More').replace(/<[^>]*>/g, '').trim();
    const safeCtaLink = this.sanitizeUrl(data.ctaLink);

    let text = `Dear Guest,

${cleanBody}
`;
    if (safeCtaLink) {
      text += `
${cleanCtaText}: ${safeCtaLink}
`;
    }
    text += `
Thank you for choosing Buffr Host.

Best regards,
Sofia Concierge

© ${new Date().getFullYear()} Buffr Host. All rights reserved.
`;
    return text;
  }
}
