import { Prisma } from '../../../prisma/generated'
export declare function createOrder(data: Prisma.OrderCreateInput): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  orderNumber: string
  status: import('@prisma/generated/client').$Enums.OrderStatus
  currency: string
  subtotal: Prisma.Decimal
  taxTotal: Prisma.Decimal
  shippingTotal: Prisma.Decimal
  discountTotal: Prisma.Decimal
  grandTotal: Prisma.Decimal
  note: string | null
  shippingAddressId: number | null
  paymentStatus: string
  fulfillmentStatus: string
  ipAddress: string | null
  userAgent: string | null
  cancelledAt: Date | null
  syncedAt: Date | null
}>
export declare function getOrderById(id: number): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  orderNumber: string
  status: import('@prisma/generated/client').$Enums.OrderStatus
  currency: string
  subtotal: Prisma.Decimal
  taxTotal: Prisma.Decimal
  shippingTotal: Prisma.Decimal
  discountTotal: Prisma.Decimal
  grandTotal: Prisma.Decimal
  note: string | null
  shippingAddressId: number | null
  paymentStatus: string
  fulfillmentStatus: string
  ipAddress: string | null
  userAgent: string | null
  cancelledAt: Date | null
  syncedAt: Date | null
} | null>
export declare function updateOrder(
  id: number,
  data: Prisma.OrderUpdateInput
): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  orderNumber: string
  status: import('@prisma/generated/client').$Enums.OrderStatus
  currency: string
  subtotal: Prisma.Decimal
  taxTotal: Prisma.Decimal
  shippingTotal: Prisma.Decimal
  discountTotal: Prisma.Decimal
  grandTotal: Prisma.Decimal
  note: string | null
  shippingAddressId: number | null
  paymentStatus: string
  fulfillmentStatus: string
  ipAddress: string | null
  userAgent: string | null
  cancelledAt: Date | null
  syncedAt: Date | null
}>
export declare function deleteOrder(id: number): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  orderNumber: string
  status: import('@prisma/generated/client').$Enums.OrderStatus
  currency: string
  subtotal: Prisma.Decimal
  taxTotal: Prisma.Decimal
  shippingTotal: Prisma.Decimal
  discountTotal: Prisma.Decimal
  grandTotal: Prisma.Decimal
  note: string | null
  shippingAddressId: number | null
  paymentStatus: string
  fulfillmentStatus: string
  ipAddress: string | null
  userAgent: string | null
  cancelledAt: Date | null
  syncedAt: Date | null
}>
export declare function listOrders(params?: Prisma.OrderFindManyArgs): Promise<
  {
    id: number
    createdAt: Date
    updatedAt: Date
    userId: number | null
    orderNumber: string
    status: import('@prisma/generated/client').$Enums.OrderStatus
    currency: string
    subtotal: Prisma.Decimal
    taxTotal: Prisma.Decimal
    shippingTotal: Prisma.Decimal
    discountTotal: Prisma.Decimal
    grandTotal: Prisma.Decimal
    note: string | null
    shippingAddressId: number | null
    paymentStatus: string
    fulfillmentStatus: string
    ipAddress: string | null
    userAgent: string | null
    cancelledAt: Date | null
    syncedAt: Date | null
  }[]
>
//# sourceMappingURL=index.d.ts.map
