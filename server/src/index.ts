import "dotenv/config";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";

async function start() {
  const app = createApp();

  const PORT = Number(process.env.PORT) || 3001;

  await connectDb();

  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
