import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { generateSecret, generateURI, verifySync } from 'otplib'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { RedisService } from '@/modules/redis/redis.service'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const STEP_SECONDS = 30

@Injectable()
export class TotpService {
  private readonly issuer: string
  private readonly epochTolerance: number
  private readonly key: Buffer | null

  constructor(
    private readonly redisService: RedisService,
    config: ConfigService
  ) {
    this.issuer = config.get<string>('security.totp.issuer', 'Rufieltics')
    this.epochTolerance =
      config.get<number>('security.totp.window', 1) * STEP_SECONDS

    const raw = config.get<string>('security.totp.encryptionKey', '')
    this.key = raw ? this.deriveKey(raw) : null
  }

  private deriveKey(raw: string): Buffer {
    const key = /^[0-9a-f]{64}$/i.test(raw)
      ? Buffer.from(raw, 'hex')
      : Buffer.from(raw, 'base64')
    return key.length === 32 ? key : Buffer.alloc(0)
  }

  private requireKey(): Buffer {
    if (!this.key || this.key.length !== 32) {
      throw new InternalServerErrorException(
        'TOTP_ENCRYPTION_KEY is missing or not a 32-byte key'
      )
    }
    return this.key
  }

  generateSecret(): string {
    return generateSecret()
  }

  buildOtpauthUri(accountName: string, secret: string): string {
    return generateURI({ issuer: this.issuer, label: accountName, secret })
  }

  encryptSecret(secret: string): string {
    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv(ALGORITHM, this.requireKey(), iv)
    const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
    return [
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      enc.toString('base64'),
    ].join('.')
  }

  decryptSecret(payload: string): string {
    const [iv, tag, data] = payload.split('.')
    if (!iv || !tag || !data) {
      throw new InternalServerErrorException('Stored TOTP secret is malformed')
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.requireKey(),
      Buffer.from(iv, 'base64')
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  }

  async verifyAndConsume(
    userId: number,
    secret: string,
    token: string
  ): Promise<boolean> {
    const key = `totp:step:${userId}`
    const lastStep = await this.redisService.get<number>(key)

    let result
    try {
      result = verifySync({
        secret,
        token,
        epochTolerance: this.epochTolerance,
        ...(typeof lastStep === 'number' ? { afterTimeStep: lastStep } : {}),
      })
    } catch {
      return false
    }

    if (!result.valid) return false

    const timeStep = 'timeStep' in result ? result.timeStep : undefined
    if (typeof timeStep === 'number') {
      await this.redisService.set(key, timeStep, STEP_SECONDS * 4)
    }

    return true
  }
}
