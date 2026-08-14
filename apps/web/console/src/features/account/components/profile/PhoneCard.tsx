'use client'

import { Info } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PhoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone number</CardTitle>
        <CardDescription>Used for account recovery and alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info />
          <AlertTitle>Phone number is unavailable</AlertTitle>
          <AlertDescription>
            Adding a phone number for recovery and SMS alerts isn&apos;t
            available yet. We&apos;ll enable it in a future update.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
