import { Injectable, Inject } from '@nestjs/common'
import { MAIL_TRANSPORT } from './mail-transport.interface'
import type { MailTransport, MailMessage } from './mail-transport.interface'

/**
 * Thin façade over the configured {@link MailTransport}. Callers depend on this,
 * not on a concrete transport, so the delivery backend stays swappable.
 */
@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport
  ) {}

  send(message: MailMessage): Promise<void> {
    return this.transport.send(message)
  }
}
