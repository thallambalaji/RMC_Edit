import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { connectMongo } from "@workspace/mongo-db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// DB connectivity diagnostic endpoint
router.get("/healthz/db", async (_req, res) => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    res.status(500).json({ status: "error", detail: "MONGODB_URI is not set in environment variables" });
    return;
  }
  try {
    await connectMongo();
    res.json({ status: "ok", detail: "MongoDB connected successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", detail: error?.message || String(error) });
  }
});

export default router;

