import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function RevenueByCategoryChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className='h-6 w-40' />
        </CardTitle>
        <div className='text-muted-foreground text-sm'>
          <Skeleton className='h-4 w-64' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-[350px] w-full space-y-2'>
          <div className='flex h-full items-end justify-between pb-20'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex flex-col items-center space-y-2'>
                <Skeleton className='h-32 w-10' />
                <Skeleton className='h-3 w-14' />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
