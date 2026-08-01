import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { CaptchaService } from '@/features/auth/services/captcha.service'
import { AnomalyStore } from '@/modules/redis/stores'

@Injectable()
export class CaptchaGuard implements CanActivate {
  private readonly threshold: number
  private readonly windowSeconds: number

  constructor(
    private readonly captcha: CaptchaService,
    private readonly anomaly: AnomalyStore,
    config: ConfigService
  ) {
    this.threshold = config.get<number>('security.captcha.threshold', 3)
    this.windowSeconds = config.get<number>(
      'security.captcha.windowSeconds',
      900
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.captcha.isEnabled()) return true

    const req = context.switchToHttp().getRequest<Request>()
    const ip = req.ip
    const failures = await this.anomaly.recentFailures(
      `ip:${ip}`,
      this.windowSeconds
    )
    if (failures < this.threshold) return true

    const token = (req.body as { captchaToken?: string })?.captchaToken
    const ok = await this.captcha.verify(token, ip)
    if (!ok) {
      throw new ForbiddenException('auth.errors.captcha_required')
    }
    return true
  }
}
