import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { MailTransport, MailMessage } from '../mail-transport.interface'

export class SmtpMailTransport implements MailTransport {
  private readonly logger = new Logger('MailTransport')
  private readonly transporter: Transporter
  private readonly from: string

  constructor(config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM', 'no-reply@rufieltics.local')
    const user = config.get<string>('SMTP_USER')

    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: parseInt(config.get<string>('SMTP_PORT', '587'), 10),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user
        ? { user, pass: config.get<string>('SMTP_PASSWORD') }
        : undefined,
    })
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
    this.logger.log(
      `[MAIL:smtp] sent to=${message.to} subject="${message.subject}"`
    )
  }
}
