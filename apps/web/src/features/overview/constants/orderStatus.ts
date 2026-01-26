export const ORDER_STATUS_VALUES = [
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_LABELS = {
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Unknown: 'Unknown'
} as const;

export const ORDER_STATUS_COLORS = {
  Processing: '#8884d8',
  Shipped: '#82ca9d',
  Delivered: '#ffc658',
  Cancelled: '#ff7300',
  Unknown: '#00ff00'
} as const;

export type PieGraphDatum = {
  name: OrderStatusValue;
  value: number;
};
