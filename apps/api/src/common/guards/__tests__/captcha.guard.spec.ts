import { ForbiddenException, ExecutionContext } from '@nestjs/common'
import { CaptchaGuard } from '../captcha.guard'

const ctx = (ip: string, body: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ ip, body }) }),
  }) as unknown as ExecutionContext

const build = (opts: {
  enabled: boolean
  verify?: boolean
  failures: number
  threshold?: number
}) => {
  const captcha = {
    isEnabled: jest.fn().mockReturnValue(opts.enabled),
    verify: jest.fn().mockResolvedValue(opts.verify ?? false),
  }
  const anomaly = {
    recentFailures: jest.fn().mockResolvedValue(opts.failures),
  }
  const config = { get: (_k: string, d: number) => opts.threshold ?? d }
  const guard = new CaptchaGuard(
    captcha as never,
    anomaly as never,
    config as never
  )
  return { guard, captcha, anomaly }
}

describe('CaptchaGuard', () => {
  it('passes through when captcha is disabled (never reads Redis)', async () => {
    const { guard, anomaly } = build({ enabled: false, failures: 99 })
    await expect(guard.canActivate(ctx('1.1.1.1', {}))).resolves.toBe(true)
    expect(anomaly.recentFailures).not.toHaveBeenCalled()
  })

  it('passes through when the IP is below the failure threshold', async () => {
    const { guard, captcha } = build({
      enabled: true,
      failures: 2,
      threshold: 3,
    })
    await expect(guard.canActivate(ctx('1.1.1.1', {}))).resolves.toBe(true)
    expect(captcha.verify).not.toHaveBeenCalled()
  })

  it('accepts a valid token once the IP is flagged', async () => {
    const { guard } = build({
      enabled: true,
      failures: 5,
      threshold: 3,
      verify: true,
    })
    await expect(
      guard.canActivate(ctx('1.1.1.1', { captchaToken: 'ok' }))
    ).resolves.toBe(true)
  })

  it('rejects a missing/invalid token once the IP is flagged', async () => {
    const { guard } = build({
      enabled: true,
      failures: 5,
      threshold: 3,
      verify: false,
    })
    await expect(guard.canActivate(ctx('1.1.1.1', {}))).rejects.toBeInstanceOf(
      ForbiddenException
    )
  })
})
