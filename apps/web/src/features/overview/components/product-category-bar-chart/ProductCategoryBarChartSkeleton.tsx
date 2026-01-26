import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function BarGraphSkeleton() {
  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch gap-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 pt-2 pb-6'>
          <CardTitle>
            <Skeleton className='h-6 w-40' />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <Skeleton className='h-[280px] w-full rounded' />
      </CardContent>
    </Card>
  );
}
