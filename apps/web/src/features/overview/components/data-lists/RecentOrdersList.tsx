import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getRecentOrders } from '@rufieltics/db';

export async function RecentOrdersList() {
  const orders = await getRecentOrders(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {orders.map((order) => (
          <div key={order.id} className='space-y-2 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div className='font-medium'>Order #{order.id}</div>
              <Badge
                variant={
                  order.status === 'Delivered'
                    ? 'default'
                    : order.status === 'Shipped'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {order.status}
              </Badge>
            </div>
            <div className='text-muted-foreground text-sm'>
              <div>Customer: {order.user?.name || 'Unknown'}</div>
              <div>Total: ${order.totalPrice?.toFixed(2)}</div>
              <div>Date: {new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
            <div className='text-sm'>
              <div className='font-medium'>Items:</div>
              <ul className='list-inside list-disc space-y-1'>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} (x{item.quantity}) - $
                    {item.unitPrice?.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
