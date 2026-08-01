import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name)
  private readonly enabled: boolean
  private readonly secretKey: string
  private readonly verifyUrl: string

  constructor(config: ConfigService) {
    this.enabled = config.get<boolean>('security.captcha.enabled', false)
    this.secretKey = config.get<string>('security.captcha.secretKey', '')
    this.verifyUrl = config.get<string>(
      'security.captcha.verifyUrl',
      'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    )
  }

  isEnabled(): boolean {
    return this.enabled
  }

  async verify(token: string | undefined, ip?: string): Promise<boolean> {
    if (!token) return false
    try {
      const body = new URLSearchParams({
        secret: this.secretKey,
        response: token,
      })
      if (ip) body.set('remoteip', ip)

      const res = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const data = (await res.json()) as { success?: boolean }
      return data.success === true
    } catch (err) {
      this.logger.error(`Turnstile verify failed: ${err}`)
      return false
    }
  }
}
