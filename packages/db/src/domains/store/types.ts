export type ApiProduct = {
  product_id: number
  name: string
  description?: string
  price?: number
  unit?: string
  image?: string
  discount?: number
  availability?: boolean
  brand?: string
  category?: string
  rating?: number
  reviews?: ApiProductReview[]
}

export type ApiProductReview = {
  user_id: number
  rating: number
  comment?: string
}

export type ApiOrder = {
  order_id: number
  user_id?: number
  items: { product_id: number; quantity: number }[]
  total_price?: number
  status?: string
}
