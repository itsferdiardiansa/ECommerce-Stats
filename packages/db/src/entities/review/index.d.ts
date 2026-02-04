import { Prisma } from '../../../prisma/generated'
export declare function createReview(
  data: Prisma.ProductReviewCreateInput
): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  syncedAt: Date | null
  productId: number
  title: string | null
  rating: number
  comment: string | null
  images: Prisma.JsonValue | null
  isVerifiedPurchase: boolean
  isPublished: boolean
  likeCount: number
}>
export declare function getReviewById(id: number): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  syncedAt: Date | null
  productId: number
  title: string | null
  rating: number
  comment: string | null
  images: Prisma.JsonValue | null
  isVerifiedPurchase: boolean
  isPublished: boolean
  likeCount: number
} | null>
export declare function updateReview(
  id: number,
  data: Prisma.ProductReviewUpdateInput
): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  syncedAt: Date | null
  productId: number
  title: string | null
  rating: number
  comment: string | null
  images: Prisma.JsonValue | null
  isVerifiedPurchase: boolean
  isPublished: boolean
  likeCount: number
}>
export declare function deleteReview(id: number): Promise<{
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number | null
  syncedAt: Date | null
  productId: number
  title: string | null
  rating: number
  comment: string | null
  images: Prisma.JsonValue | null
  isVerifiedPurchase: boolean
  isPublished: boolean
  likeCount: number
}>
export declare function listReviews(
  params?: Prisma.ProductReviewFindManyArgs
): Promise<
  {
    id: number
    createdAt: Date
    updatedAt: Date
    userId: number | null
    syncedAt: Date | null
    productId: number
    title: string | null
    rating: number
    comment: string | null
    images: Prisma.JsonValue | null
    isVerifiedPurchase: boolean
    isPublished: boolean
    likeCount: number
  }[]
>
//# sourceMappingURL=index.d.ts.map
