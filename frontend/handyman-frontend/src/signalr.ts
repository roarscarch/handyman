import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import type { OrderDto } from './types'

export function createOrdersConnection(onOrderUpdated: (order: OrderDto) => void) {
  const connection = new HubConnectionBuilder()
    .withUrl('/hubs/orders')
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()

  connection.on('OrderUpdated', (order: OrderDto) => {
    onOrderUpdated(order)
  })

  return connection
}


