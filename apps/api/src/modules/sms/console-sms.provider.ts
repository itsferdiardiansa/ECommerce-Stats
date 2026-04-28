import { Injectable, Logger } from '@nestjs/common'
import { SmsProvider } from './sms.provider'

/**
 * Local development stub - prints OTP codes to the console instead of
 * dispatching real SMS messages.
 *
 * ─── Production recommendations ────────────────────────────────────────────
 *
 * 1. Twilio Verify  (recommended)
 * 2. Vonage (Nexmo)
 * 3. AWS SNS
 * ────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger('SmsProvider')

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(
      `[DEV] OTP for ${phone}: ${code}  (replace ConsoleSmsProvider with a real provider for production)`
    )
  }
}
