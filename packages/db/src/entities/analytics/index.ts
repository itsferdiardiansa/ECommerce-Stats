import { db } from '@/libs/prisma'

export async function getLastSync() {
  return db.product
    .findFirst({
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    })
    .then(record => record?.syncedAt || 'Unknown')
}

export async function getTotalRevenue() {
  const items = await db.orderItem.findMany({
    select: { unitPrice: true, quantity: true },
  })
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

export async function getTotalOrderCount() {
  return db.order.count()
}

export async function getAverageOrderValue() {
  const result = await db.order.aggregate({
    _avg: { totalPrice: true },
  })
  return result._avg.totalPrice || 0
}

export async function getAverageProductRating(productId?: number) {
  if (productId) {
    const result = await db.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
    })
    return result._avg.rating || 0
  } else {
    const result = await db.productReview.aggregate({
      _avg: { rating: true },
    })
    return result._avg.rating || 0
  }
}

export async function getOrderCountByStatus() {
  const result = await db.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  return result.map(data => ({ status: data.status, count: data._count._all }))
}

export type ProductCategoryCountRow = {
  categoryId: number | null
  categoryName: string | null
  category: string
  count: number
}

export async function getProductCountByCategory(): Promise<
  ProductCategoryCountRow[]
> {
  const productGroupResults = await db.product.groupBy({
    by: ['categoryId'],
    _count: { _all: true },
  })
  const categoryIds = productGroupResults
    .map(productGroup => productGroup.categoryId)
    .filter(
      (categoryId): categoryId is number =>
        categoryId !== null && categoryId !== undefined
    )
  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })
  const categoryIdToNameMap = Object.fromEntries(
    categories.map(category => [category.id, category.name])
  )
  return productGroupResults.map(productGroup => {
    const categoryName =
      productGroup.categoryId != null
        ? (categoryIdToNameMap[productGroup.categoryId] ?? null)
        : null
    const label = categoryName ?? 'Uncategorized'
    return {
      categoryId: productGroup.categoryId,
      categoryName,
      category: label,
      count: productGroup._count._all,
    }
  })
}

export type RevenueByCategoryRow = {
  category: string
  revenue: number
}

export async function getRevenueByCategory(): Promise<RevenueByCategoryRow[]> {
  const orderItems = await db.orderItem.findMany({
    include: { product: { include: { category: true } } },
  })
  const revenueByCategoryMap = new Map<string, number>()
  for (const item of orderItems) {
    const categoryName = item.product.category?.name ?? 'Uncategorized'
    const prev = revenueByCategoryMap.get(categoryName) ?? 0
    revenueByCategoryMap.set(
      categoryName,
      prev + (item.unitPrice ?? 0) * (item.quantity ?? 0)
    )
  }
  return Array.from(revenueByCategoryMap.entries()).map(
    ([category, revenue]) => ({
      category,
      revenue,
    })
  )
}

export async function getRecentOrders(limit = 5) {
  return db.order.findMany({
    orderBy: { id: 'desc' },
    take: limit,
    include: {
      user: true,
      items: {
        include: { product: true },
      },
    },
  })
}

export async function getTopProductsByPrice(limit = 5) {
  return db.product.findMany({
    orderBy: { price: 'desc' },
    take: limit,
    include: {
      category: true,
      brand: true,
    },
  })
}

export type OrderValueByStatusRow = {
  status: string
  avgValue: number
}

export async function getOrderValueByStatus(): Promise<
  OrderValueByStatusRow[]
> {
  const result = await db.order.groupBy({
    by: ['status'],
    _avg: { totalPrice: true },
  })
  return result.map(data => ({
    status: data.status,
    avgValue: data._avg.totalPrice || 0,
  }))
}

export type ProductRatingDistributionRow = {
  rating: number
  count: number
}

export async function getProductRatingDistribution(): Promise<
  ProductRatingDistributionRow[]
> {
  const result = await db.productReview.groupBy({
    by: ['rating'],
    _count: { _all: true },
  })
  return result.map(data => ({
    rating: data.rating,
    count: data._count._all,
  }))
}
