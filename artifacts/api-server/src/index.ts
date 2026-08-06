import "./dotenv-config";
import app from "./app";
import { logger } from "./lib/logger";
import { seedMongo } from "@workspace/mongo-db";
import { scaleService } from "./lib/scaleService";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn(`Invalid PORT value: "${rawPort}", defaulting to 5000`);
}
const finalPort = Number.isNaN(port) || port <= 0 ? 5000 : port;

app.listen(finalPort, "0.0.0.0", async () => {
  // Seed MongoDB on startup
  try {
    await seedMongo();
  } catch (seedErr) {
    logger.error({ err: seedErr }, "Failed to seed MongoDB");
  }

  // Initialize background scale service
  try {
    scaleService.init();
  } catch (scaleErr) {
    logger.error({ err: scaleErr }, "Failed to initialize scale service");
  }

  logger.info({ port: finalPort }, "Server listening on 0.0.0.0");
});
