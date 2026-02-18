import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/echo", (req, res) => {
  res.json({
    received: req.body ?? null,
    serverTime: new Date().toISOString(),
  });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));

