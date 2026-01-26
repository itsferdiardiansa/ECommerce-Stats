import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function RecentOrdersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className='h-6 w-32' />
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='space-y-2 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-6 w-20 rounded-full' />
            </div>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
            </div>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-4 w-40' />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
