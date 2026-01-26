import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function RecentSalesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className='h-6 w-32' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center space-x-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-[200px]' />
                <Skeleton className='h-4 w-[150px]' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
