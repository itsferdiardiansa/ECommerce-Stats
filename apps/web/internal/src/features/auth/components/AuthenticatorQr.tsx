'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@rufieltics/ui'

export function AuthenticatorQr({
  otpauthUri,
  secret,
}: {
  otpauthUri: string
  secret: string
}) {
  return (
    <div className="space-y-3">
      <Alert variant="info">
        <Info className="size-4" />
        <AlertDescription>
          Scan this with Google Authenticator, 1Password, or Authy. Keep it safe
          - you&apos;ll enter a 6-digit code from it every time you sign in.
        </AlertDescription>
      </Alert>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg border bg-white p-3">
          <QRCodeSVG value={otpauthUri} size={160} />
        </div>
        <code className="bg-muted rounded-md px-2 py-1 text-xs break-all">
          {secret}
        </code>
      </div>
    </div>
  )
}
