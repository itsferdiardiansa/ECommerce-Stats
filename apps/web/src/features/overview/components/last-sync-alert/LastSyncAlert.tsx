import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { getLastSync } from '@rufieltics/db';

export async function LastSyncAlert() {
  const lastSync = await getLastSync();

  return (
    <Alert>
      <AlertTitle>Last Sync Information</AlertTitle>
      <AlertDescription>
        Last synchronized: {lastSync.toLocaleString()}
      </AlertDescription>
    </Alert>
  );
}
