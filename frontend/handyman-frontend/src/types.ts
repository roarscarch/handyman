export type OrderStatus = 'New' | 'InProgress' | 'Paid'

export type OrderDto = {
  id: string
  title: string
  price: number
  status: OrderStatus
  createdAtUtc: string
  updatedAtUtc: string
}


