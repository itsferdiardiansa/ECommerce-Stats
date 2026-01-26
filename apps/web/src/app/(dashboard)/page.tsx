import { Suspense } from 'react';
import {
  TotalRevenueCard,
  TotalOrderCountCard,
  AverageOrderValueCard,
  AverageProductRatingCard,
  StatCardSkeleton
} from '@/features/overview/components/stat-cards';
import {
  OrderStatusPieChart,
  PieGraphSkeleton
} from '@/features/overview/components/order-status-pie-chart';
import {
  BarGraphSkeleton,
  ProductCategoryBarChart
} from '@/features/overview/components/product-category-bar-chart';
import {
  RecentOrdersList,
  TopProductsList,
  RecentOrdersListSkeleton,
  TopProductsListSkeleton
} from '@/features/overview/components/data-lists';
import {
  RevenueByCategoryChart,
  RevenueByCategoryChartSkeleton
} from '@/features/overview/components/revenue-by-category-chart';
import { LastSyncAlert } from '@/features/overview/components/last-sync-alert';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function OverviewPage() {
  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-2xl font-bold tracking-tight'>Hi, Ferdi</h2>
      </div>

      <ErrorBoundary>
        <LastSyncAlert />
      </ErrorBoundary>

      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
        <ErrorBoundary>
          <Suspense fallback={<StatCardSkeleton />}>
            <TotalRevenueCard />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<StatCardSkeleton />}>
            <TotalOrderCountCard />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<StatCardSkeleton />}>
            <AverageOrderValueCard />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<StatCardSkeleton />}>
            <AverageProductRatingCard />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <ErrorBoundary>
          <Suspense fallback={<PieGraphSkeleton />}>
            <OrderStatusPieChart />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<BarGraphSkeleton />}>
            <ProductCategoryBarChart />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <ErrorBoundary>
          <Suspense fallback={<RecentOrdersListSkeleton />}>
            <RecentOrdersList />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<TopProductsListSkeleton />}>
            <TopProductsList />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        <ErrorBoundary>
          <Suspense fallback={<RevenueByCategoryChartSkeleton />}>
            <RevenueByCategoryChart />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
