import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCachedRecentOrders } from '@/services/analytics'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export async function RecentOrdersList() {
  const orders = await getCachedRecentOrders(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">ID</TableHead>
              <TableHead className="text-center">Customer</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="text-center font-mono text-xs">
                  #{order.id}
                </TableCell>
                <TableCell className="text-center">
                  {order.user?.name || 'Unknown'}
                </TableCell>
                <TableCell className="text-center">
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
                </TableCell>
                <TableCell className="font-mono text-center">
                  ${(order.totalPrice ?? 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className="text-center">
                  {order.items.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
