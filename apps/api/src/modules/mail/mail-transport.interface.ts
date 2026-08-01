export const MAIL_TRANSPORT = 'MAIL_TRANSPORT'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Delivery boundary for outbound mail. Swap the implementation (log, SMTP, SES,
 * …) without touching callers. Bound to the {@link MAIL_TRANSPORT} token.
 */
export interface MailTransport {
  send(message: MailMessage): Promise<void>
}
