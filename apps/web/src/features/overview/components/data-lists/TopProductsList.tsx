import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCachedTopProductsByPrice } from '@/services/analytics'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export async function TopProductsList() {
  const products = await getCachedTopProductsByPrice(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Availability</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-muted-foreground text-xs line-clamp-2">
                      {product.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  ${(product.price ?? 0).toFixed(2)}
                </TableCell>
                <TableCell>{product.rating?.toFixed(1) ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category?.name ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.brand?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={product.availability ? 'default' : 'secondary'}
                  >
                    {product.availability ? 'Available' : 'Unavailable'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
