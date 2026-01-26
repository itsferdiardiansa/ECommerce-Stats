import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { getCachedLastSync } from '@/services/analytics'
import { formatDateTime } from '@/lib/utils'

export async function LastSyncAlert() {
  const lastSync = await getCachedLastSync()

  return (
    <Alert>
      <AlertTitle>Last Sync Information</AlertTitle>
      <AlertDescription>
        Last synchronized: {formatDateTime(lastSync)}
      </AlertDescription>
    </Alert>
  )
}
