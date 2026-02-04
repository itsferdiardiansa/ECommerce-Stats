import { Prisma } from '../../../prisma/generated'
export declare function createProduct(
  data: Prisma.ProductCreateInput
): Promise<{
  name: string
  id: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  currency: string
  syncedAt: Date | null
  rating: number | null
  metadata: Prisma.JsonValue | null
  sku: string
  slug: string
  description: string | null
  shortDesc: string | null
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  costPrice: Prisma.Decimal | null
  isDigital: boolean
  stockQuantity: number
  lowStockLimit: number
  weight: number | null
  width: number | null
  height: number | null
  depth: number | null
  reviewCount: number
  categoryId: number | null
  brandId: number | null
}>
export declare function getProductById(id: number): Promise<{
  name: string
  id: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  currency: string
  syncedAt: Date | null
  rating: number | null
  metadata: Prisma.JsonValue | null
  sku: string
  slug: string
  description: string | null
  shortDesc: string | null
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  costPrice: Prisma.Decimal | null
  isDigital: boolean
  stockQuantity: number
  lowStockLimit: number
  weight: number | null
  width: number | null
  height: number | null
  depth: number | null
  reviewCount: number
  categoryId: number | null
  brandId: number | null
} | null>
export declare function updateProduct(
  id: number,
  data: Prisma.ProductUpdateInput
): Promise<{
  name: string
  id: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  currency: string
  syncedAt: Date | null
  rating: number | null
  metadata: Prisma.JsonValue | null
  sku: string
  slug: string
  description: string | null
  shortDesc: string | null
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  costPrice: Prisma.Decimal | null
  isDigital: boolean
  stockQuantity: number
  lowStockLimit: number
  weight: number | null
  width: number | null
  height: number | null
  depth: number | null
  reviewCount: number
  categoryId: number | null
  brandId: number | null
}>
export declare function deleteProduct(id: number): Promise<{
  name: string
  id: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  currency: string
  syncedAt: Date | null
  rating: number | null
  metadata: Prisma.JsonValue | null
  sku: string
  slug: string
  description: string | null
  shortDesc: string | null
  price: Prisma.Decimal
  compareAtPrice: Prisma.Decimal | null
  costPrice: Prisma.Decimal | null
  isDigital: boolean
  stockQuantity: number
  lowStockLimit: number
  weight: number | null
  width: number | null
  height: number | null
  depth: number | null
  reviewCount: number
  categoryId: number | null
  brandId: number | null
}>
export declare function listProducts(
  params?: Prisma.ProductFindManyArgs
): Promise<
  {
    name: string
    id: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    currency: string
    syncedAt: Date | null
    rating: number | null
    metadata: Prisma.JsonValue | null
    sku: string
    slug: string
    description: string | null
    shortDesc: string | null
    price: Prisma.Decimal
    compareAtPrice: Prisma.Decimal | null
    costPrice: Prisma.Decimal | null
    isDigital: boolean
    stockQuantity: number
    lowStockLimit: number
    weight: number | null
    width: number | null
    height: number | null
    depth: number | null
    reviewCount: number
    categoryId: number | null
    brandId: number | null
  }[]
>
//# sourceMappingURL=index.d.ts.map
