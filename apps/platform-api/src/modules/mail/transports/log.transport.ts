import { Injectable, Logger } from '@nestjs/common'
import type { MailTransport, MailMessage } from '../mail-transport.interface'

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
