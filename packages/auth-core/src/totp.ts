import { generateSecret, generateURI, verifySync } from 'otplib'

export function generateTotpSecret(): string {
  return generateSecret()
}

export function buildOtpauthUri(
  secret: string,
  account: string,
  issuer: string
): string {
  return generateURI({ issuer, label: account, secret })
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return verifySync({ secret, token }).valid
  } catch {
    return false
  }
}
