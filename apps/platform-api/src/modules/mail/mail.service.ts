import { Inject, Injectable } from '@nestjs/common'
import { renderEmail } from '@rufieltics/emails'
import { MAIL_TRANSPORT, type MailTransport } from './mail-transport.interface'

interface StaffInviteParams {
  to: string
  name: string
  url: string
  expiresInMinutes: number
  locale?: string
}

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport
  ) {}

  async sendStaffInvite(params: StaffInviteParams): Promise<void> {
    const { subject, html, text } = await renderEmail(
      'staff-invite',
      params.locale ?? 'en',
      {
        name: params.name,
        url: params.url,
        minutes: params.expiresInMinutes,
      }
    )
    await this.transport.send({ to: params.to, subject, text, html })
  }

  async sendTotpReset(params: StaffInviteParams): Promise<void> {
    const { subject, html, text } = await renderEmail(
      'staff-totp-reset',
      params.locale ?? 'en',
      {
        name: params.name,
        url: params.url,
        minutes: params.expiresInMinutes,
      }
    )
    await this.transport.send({ to: params.to, subject, text, html })
  }
}
