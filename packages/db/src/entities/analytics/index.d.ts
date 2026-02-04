export declare function getLastSync(): Promise<Date | 'Unknown'>
export declare function getTotalRevenue(): Promise<number>
export declare function getTotalOrderCount(): Promise<number>
export declare function getAverageOrderValue(): Promise<number>
export declare function getAverageProductRating(
  productId?: number
): Promise<number>
export declare function getOrderCountByStatus(): Promise<
  {
    status: import('@prisma/generated').$Enums.OrderStatus
    count: number
  }[]
>
export type ProductCategoryCountRow = {
  categoryId: number | null
  categoryName: string | null
  category: string
  count: number
}
export declare function getProductCountByCategory(): Promise<
  ProductCategoryCountRow[]
>
export type RevenueByCategoryRow = {
  category: string
  revenue: number
}
export declare function getRevenueByCategory(): Promise<RevenueByCategoryRow[]>
export declare function getRecentOrders(limit?: number): Promise<
  ({
    user: {
      name: string | null
      id: number
      email: string
      username: string | null
      passwordHash: string | null
      avatar: string | null
      phone: string | null
      emailVerifiedAt: Date | null
      phoneVerifiedAt: Date | null
      isActive: boolean
      isStaff: boolean
      lastLoginAt: Date | null
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
    } | null
    items: ({
      product: {
        name: string
        id: number
        isActive: boolean
        createdAt: Date
        updatedAt: Date
        currency: string
        syncedAt: Date | null
        rating: number | null
        metadata: import('@prisma/generated/runtime/client').JsonValue | null
        sku: string
        slug: string
        description: string | null
        shortDesc: string | null
        price: import('@prisma/client-runtime-utils').Decimal
        compareAtPrice: import('@prisma/client-runtime-utils').Decimal | null
        costPrice: import('@prisma/client-runtime-utils').Decimal | null
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
      }
    } & {
      name: string
      id: number
      createdAt: Date
      updatedAt: Date
      syncedAt: Date | null
      productId: number
      sku: string
      orderId: number
      variantId: number | null
      quantity: number
      unitPrice: import('@prisma/client-runtime-utils').Decimal
      taxRate: import('@prisma/client-runtime-utils').Decimal
      taxAmount: import('@prisma/client-runtime-utils').Decimal
      discountAmount: import('@prisma/client-runtime-utils').Decimal
      totalPrice: import('@prisma/client-runtime-utils').Decimal
      fulfilledQty: number
      returnedQty: number
    })[]
  } & {
    id: number
    createdAt: Date
    updatedAt: Date
    userId: number | null
    orderNumber: string
    status: import('@prisma/generated').$Enums.OrderStatus
    currency: string
    subtotal: import('@prisma/client-runtime-utils').Decimal
    taxTotal: import('@prisma/client-runtime-utils').Decimal
    shippingTotal: import('@prisma/client-runtime-utils').Decimal
    discountTotal: import('@prisma/client-runtime-utils').Decimal
    grandTotal: import('@prisma/client-runtime-utils').Decimal
    note: string | null
    shippingAddressId: number | null
    paymentStatus: string
    fulfillmentStatus: string
    ipAddress: string | null
    userAgent: string | null
    cancelledAt: Date | null
    syncedAt: Date | null
  })[]
>
export declare function getTopProductsByPrice(limit?: number): Promise<
  ({
    category: {
      name: string
      id: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      slug: string
      description: string | null
      displayOrder: number
      parentId: number | null
      image: string | null
      icon: string | null
      seoTitle: string | null
      seoDesc: string | null
    } | null
    brand: {
      name: string
      id: number
      email: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      country: string | null
      slug: string
      description: string | null
      logo: string | null
      website: string | null
      foundedYear: number | null
    } | null
  } & {
    name: string
    id: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    currency: string
    syncedAt: Date | null
    rating: number | null
    metadata: import('@prisma/generated/runtime/client').JsonValue | null
    sku: string
    slug: string
    description: string | null
    shortDesc: string | null
    price: import('@prisma/client-runtime-utils').Decimal
    compareAtPrice: import('@prisma/client-runtime-utils').Decimal | null
    costPrice: import('@prisma/client-runtime-utils').Decimal | null
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
  })[]
>
export type OrderValueByStatusRow = {
  status: string
  avgValue: number
}
export declare function getOrderValueByStatus(): Promise<
  OrderValueByStatusRow[]
>
export type ProductRatingDistributionRow = {
  rating: number
  count: number
}
export declare function getProductRatingDistribution(): Promise<
  ProductRatingDistributionRow[]
>
//# sourceMappingURL=index.d.ts.map
