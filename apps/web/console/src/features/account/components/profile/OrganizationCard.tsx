'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '../../hooks/useAccountQueries'

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function OrganizationCard() {
  const { data: profile } = useProfile()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Your workspace and role.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {profile?.organization ? (
          <>
            <Row label="Workspace">
              <span className="font-medium">{profile.organization.name}</span>
            </Row>
            <Row label="Your role">
              <Badge variant="secondary" className="capitalize">
                {profile.organization.role.toLowerCase()}
              </Badge>
            </Row>
            <Row label="Members">
              <span className="font-medium">
                {profile.organization.memberCount}
              </span>
            </Row>
          </>
        ) : (
          <p className="text-muted-foreground">
            You are not part of an organization yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
