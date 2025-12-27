import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { OrderDto, OrderStatus } from './types'
import { createOrder, listOrders, moveToInProgress } from './api'
import { createOrdersConnection } from './signalr'

function statusColor(status: OrderStatus): 'default' | 'info' | 'success' {
  switch (status) {
    case 'New':
      return 'default'
    case 'InProgress':
      return 'info'
    case 'Paid':
      return 'success'
  }
}

export default function App() {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('100')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await listOrders()
        if (!cancelled) setOrders(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load orders')
      }
    }

    void load()

    const connection = createOrdersConnection((updated) => {
      setOrders((prev) => {
        const next = [...prev]
        const idx = next.findIndex((x) => x.id === updated.id)
        if (idx >= 0) next[idx] = updated
        else next.unshift(updated)
        return next
      })
    })

    void connection.start().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'SignalR connection failed')
    })

    return () => {
      cancelled = true
      void connection.stop()
    }
  }, [])

  async function onCreate() {
    setBusy(true)
    try {
      const p = Number(price)
      await createOrder({ title, price: p })
      setTitle('')
      setPrice('100')
      // OrderUpdated event will arrive via SignalR, but do a fallback refresh in case.
      const list = await listOrders()
      setOrders(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create order')
    } finally {
      setBusy(false)
    }
  }

  async function onMoveToInProgress(orderId: string) {
    setBusy(true)
    try {
      await moveToInProgress(orderId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update order')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Handyman Marketplace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders are created internally. Payments are confirmed via webhook.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Create Order</Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                disabled={busy}
              />
              <TextField
                label="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                disabled={busy}
                sx={{ width: { xs: '100%', sm: 200 } }}
              />
              <Button
                variant="contained"
                onClick={() => void onCreate()}
                disabled={busy || title.trim().length === 0 || Number(price) <= 0}
                sx={{ minWidth: 160 }}
              >
                Create
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Orders</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {orders.length}
              </Typography>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.title}</TableCell>
                      <TableCell align="right">{o.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={o.status} color={statusColor(o.status)} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={busy || o.status !== 'New'}
                            onClick={() => void onMoveToInProgress(o.id)}
                          >
                            Move to InProgress
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          No orders yet. Create one above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Paper>
      </Stack>

      <Snackbar open={error !== null} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}
