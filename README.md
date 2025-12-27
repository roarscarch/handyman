## Handyman Marketplace – Orders & Payment Webhook

Small demo app:

- **Backend**: .NET 8 Minimal API + EF Core (SQLite) + SignalR
- **Frontend**: React (Vite) + Material UI, auto-updates via SignalR

No authentication is required **except** the payment webhook (API key header).

## Architecture and design decisions

- **Order lifecycle**: `New` → `InProgress` → `Paid`
  - UI can move `New` → `InProgress`
  - Webhook can mark `New` or `InProgress` as `Paid` (idempotent if already `Paid`)
- **State propagation**: backend broadcasts `OrderUpdated` over SignalR; UI listens and updates the list without polling.
- **Persistence**: SQLite file stored in `/data/app.db` inside the API container and mounted as a Docker volume.
- **Networking**: frontend container (nginx) reverse-proxies `/api/*` and `/hubs/*` to the backend, so the browser uses a single origin (no CORS configuration needed).

## Environment variables

- **WEBHOOK_API_KEY**: API key expected in header `X-Webhook-Key` for the payment webhook.

## Run with Docker Compose


- Start **Docker**
- Run **docker compose up** command


### Exposed ports

- **Frontend**: `http://localhost:3000` (nginx serving the React build)
- **Backend**: `http://localhost:8080` (Swagger + API, useful for debugging)
  - Swagger: `http://localhost:8080/swagger`

## Webhook testing (curl)

1) Create an order in the UI (`http://localhost:3000`) and copy its `id` from the browser network response, **or** via Swagger.

2) Call the webhook:

```bash
curl -X POST http://localhost:8080/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: dev-webhook-key" \
  -d '{ "orderId": "PUT-ORDER-ID-HERE" }'
```

You should see the order status become **Paid** in the UI automatically.


