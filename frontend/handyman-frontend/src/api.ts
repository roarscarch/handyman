import type { OrderDto } from './types'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }

  return (await res.json()) as T
}

export async function listOrders(): Promise<OrderDto[]> {
  return await http<OrderDto[]>('/api/orders')
}

export async function createOrder(input: { title: string; price: number }): Promise<OrderDto> {
  return await http<OrderDto>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function moveToInProgress(orderId: string): Promise<OrderDto> {
  return await http<OrderDto>(`/api/orders/${orderId}/in-progress`, { method: 'POST' })
}


