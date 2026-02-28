# CoinPulse

CoinPulse is a cryptocurrency trend tracking dashboard that periodically collects CoinGecko price snapshots, computes derived metrics (moving average, volatility, percent change), & serves both a UI dashboard & API endpoints.

## Architecture

CoinPulse is intentionally split into separate processes:

- **Web/API (Express)**: serves REST endpoints for the UI and exposes monitoring endpoints.
- **Collector worker**: periodically fetches price data from CoinGecko, stores raw snapshots in MongoDB, and enqueues an analysis job.
- **Analyzer worker**: consumes queue jobs, computes derived metrics from recent snapshots, and stores results in MongoDB.
- **MongoDB (Atlas or local)**: persistence for raw snapshots and computed metrics.
- **Redis + BullMQ**: event collaboration (producer/consumer queue).

## Repo layout

- `client/` — React UI (Vite)
- `server/` — Express API + workers (TypeScript)
  - `src/collector/` — data collector process
  - `src/analyzer/` — data analyzer process
  - `src/queue/` — BullMQ queue + Redis connection
  - `src/models/` — MongoDB models
  - `src/monitoring/` — `/health` + `/metrics` (Prometheus format)

## Requirements

- Node.js 18+ (recommended)
- MongoDB (Atlas recommended)
- Redis (local Docker is fine)

## Environment variables

Create `server/.env` (or copy `server/.env.example` and fill it):

```bash
# Required
MONGO_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
REDIS_URL="redis://localhost:6379"

# Collector defaults (recommended)
COLLECT_COIN_ID="bitcoin"
COLLECT_VS_CURRENCY="usd"

# Analyzer defaults (recommended)
ANALYZE_POINTS="12"
```

## Notes

- `ANALYZE_POINTS` is the configured analysis window 
- If you have fewer than `ANALYZE_POINTS` snapshots, the analyzer still computes metrics using the available samples and stores `sampleCount` accordingly.

## Local development

You will run **Redis**, **API**, **analyzer**, and optionally the **collector**. The client runs separately in dev.

### 1) Start Redis

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```
### 2) Start the API
```bash
cd server
npm install
npm run dev
```

API runs on `http://localhost:3001` (or whichever port your app prints)

### 3) Start the analyzer worker
```bash
cd server
npm run analyze:dev
```
This process consumes BullMQ jobs from Redis and writes computed metrics into MongoDB.

### 4) Run the collector
Run it manually while developing
```bash
cd server
npm run collect:dev
```
This fetches a price snapshot from CoinGecko, stores it in MongoDB, and enqueues an analysis job.

### 5) Start the client
```bash
cd client
npm install
npm run dev
```
Open the Vite URL printed in the terminal. Use the form to load metrics and timeseries.

### API endpoints
**Reporting endpoints**

`GET /api/coins/:coinId/metrics?vsCurrency=usd&points=12`
Returns the most recently computed metrics document for `coinId/vsCurrency` and the configured window size (`points` should match `ANALYZE_POINTS`).
`GET /api/coins/:coinId/timeseries?vsCurrency=usd&limit=50`
Returns recent raw snapshots as a simple time series.

**Monitoring endpoints**
`GET /health`
Basic health check endpoint.
`GET /metrics`
Prometheus-format metrics (request counts, latency histogram).

### Quick verification (local)
- **1.** Start Redis, API, analyzer (Terminals A/B/C).
- **2.** Run collector a few times (Terminal D) with pauses (e.g., every 1–2 minutes) to build history.
- **3.** Verify endpoints:
```bash
curl -s http://localhost:3001/health
curl -s "http://localhost:3001/api/coins/bitcoin/timeseries?vsCurrency=usd&limit=5" | head
curl -s "http://localhost:3001/api/coins/bitcoin/metrics?vsCurrency=usd&points=12" | head
curl -s http://localhost:3001/metrics | head
```
If the coin metrics endpoint returns “Metrics not found”, it usually means:
- analyzer hasn’t run yet, or
- you requested a `points=` window that doesn’t match `ANALYZE_POINTS`.

### Testing
**Server tests**
```bash
cd server
npm test
```

Includes:
- unit tests for analysis logic (pure functions)
- unit tests mocking CoinGecko fetch
- HTTP-level tests for monitoring and echo endpoints

**Client build**
```bash
cd client
npm run build
```

### Production deployment
In production you should run these as separate services/processes:

- **Web/API (Render Web Service)**: runs `node dist/index.js` and serves the built client from `server/public`
- **Analyzer (GitHub Actions schedule)**: runs `node dist/analyzer/runOnce.js` every 4 hours, offset (`10 */4 * * *`)
- **Collector (GitHub Actions schedule)**: runs `node dist/collector/index.js` every 4 hours (`0 */4 * * *`)
- **Redis**: managed Redis (`REDIS_URL`)
- **MongoDB**: Atlas (`MONGO_URI`)

### CI
GitHub Actions workflow runs:
- server build + tests
- client build
See `.github/workflows/ci.yml`

### Troubleshooting
- **Analyzer fails with** `REDIS_URL is not set`
- Add `REDIS_URL=redis://localhost:6379` to `server/.env`
- **CoinGecko returns 429**
- You’re calling the collector too frequently. Slow down and add delay between runs. In production, the collector is scheduled every 4 hours.
- `/api/coins/:coinId/metrics` **returns “Metrics not found”**
- Ensure the analyzer is running and you requested `points` matching `ANALYZE_POINTS`.

### License
Educational project.
