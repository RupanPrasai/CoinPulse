## Data Collection

1. Set MONGO_URI in server/.env
2. Install dependencies
3. Run:

npm run collect:dev

This fetches price data from CoinGecko and stores it in MongoDB.

## Setup

1. Create a MongoDB Atlas cluster (or use local MongoDB)
2. Create a database user
3. Add your IP to Network Access
4. Copy the connection string into server/.env as:

MONGO_URI=...

5. Install dependencies:

npm install (inside server)

6. Run the collector:

npm run collect:dev
