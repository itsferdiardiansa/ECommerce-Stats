import { Injectable, Logger } from '@nestjs/common'
import type { MailTransport, MailMessage } from '../mail-transport.interface'

/**
 * Default transport for local/dev and any environment without SMTP configured.
 * It doesn't send anything — it logs the message that *would* be sent, so the
 * full notification path is observable end-to-end without a mail provider.
 */
@Injectable()
export class LogMailTransport implements MailTransport {
  private readonly logger = new Logger('MailTransport')

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `[MAIL:log] to=${message.to} subject="${message.subject}" | ${message.text}`
    )
    return Promise.resolve()
  }
}
