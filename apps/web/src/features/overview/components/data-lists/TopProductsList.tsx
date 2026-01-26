import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getTopProductsByPrice } from '@rufieltics/db';

export async function TopProductsList() {
  const products = await getTopProductsByPrice(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {products.map((product) => (
          <div key={product.id} className='space-y-2 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-medium'>{product.name}</h4>
              <div className='flex gap-2'>
                <Badge variant={product.availability ? 'default' : 'secondary'}>
                  {product.availability ? 'Available' : 'Unavailable'}
                </Badge>
                <Badge variant='outline'>ID: {product.id}</Badge>
              </div>
            </div>
            <div className='text-muted-foreground space-y-1 text-sm'>
              <div>Price: ${product.price?.toFixed(2)}</div>
              <div>Rating: {product.rating?.toFixed(1)}/5</div>
              {product.category && <div>Category: {product.category.name}</div>}
              {product.brand && <div>Brand: {product.brand.name}</div>}
            </div>
            {product.description && (
              <div className='text-muted-foreground text-sm'>
                <div className='font-medium'>Description:</div>
                <div className='line-clamp-2'>{product.description}</div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
