'use client'

import { Loading } from '@/components/ui/loading'
import { ApiError } from '@/lib/api-client'
import { useProfile } from '@/features/account/hooks/useAccountQueries'
import { FormError } from '@/features/auth/components/FormError'
import { ProfileIdentityCard } from '@/features/account/components/profile/ProfileIdentityCard'
import { PersonalDetailsCard } from '@/features/account/components/profile/PersonalDetailsCard'
import { EmailCard } from '@/features/account/components/profile/EmailCard'
import { PhoneCard } from '@/features/account/components/profile/PhoneCard'
import { OrganizationCard } from '@/features/account/components/profile/OrganizationCard'
import { SecurityOverviewCard } from '@/features/account/components/profile/SecurityOverviewCard'
import { DangerZoneCard } from '@/features/account/components/profile/DangerZoneCard'

export default function ProfilePage() {
  const { error: loadError, isLoading } = useProfile()

  const error =
    loadError instanceof ApiError
      ? loadError.message
      : loadError
        ? 'Could not load your profile.'
        : null

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account details.
        </p>
      </div>

      <FormError message={error} />

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <ProfileIdentityCard />
          <PersonalDetailsCard />
          <EmailCard />
          <PhoneCard />
          <OrganizationCard />
          <SecurityOverviewCard />
          <DangerZoneCard />
        </>
      )}
    </div>
  )
}
