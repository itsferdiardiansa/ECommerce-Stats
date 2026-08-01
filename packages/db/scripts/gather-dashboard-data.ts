import 'dotenv/config'
import { fileURLToPath } from 'url'
import {
  getTotalRevenue,
  getTotalOrderCount,
  getAverageOrderValue,
  getAverageProductRating,
  getOrderCountByStatus,
  getProductCountByCategory,
  getRevenueByCategory,
  getRecentOrders,
  getTopProductsByPrice,
} from '../src/entities/analytics'

async function gather() {
  const totalRevenue = await getTotalRevenue()
  const totalOrders = await getTotalOrderCount()
  const avgOrderValue = await getAverageOrderValue()
  const avgProductRating = await getAverageProductRating()

  const ordersByStatus = await getOrderCountByStatus()
  const productsByCategory = await getProductCountByCategory()

  const recentOrders = await getRecentOrders(5)

  const topProducts = await getTopProductsByPrice(5)

  const revenueByCategory = await getRevenueByCategory()

  const payload = {
    metrics: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      avgProductRating,
    },
    charts: {
      ordersByStatus,
      productsByCategory,
      revenueByCategory,
    },
    tables: {
      recentOrders,
      topProducts,
    },
  }

  console.log(JSON.stringify(payload, null, 2))
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  gather().catch(e => {
    console.error(e)
    process.exit(1)
  })
}

export default gather
