import "./dotenv-config";
import app from "./app";
import { logger } from "./lib/logger";
import { seedMongo } from "@workspace/mongo-db";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn(`Invalid PORT value: "${rawPort}", defaulting to 5000`);
}
const finalPort = Number.isNaN(port) || port <= 0 ? 5000 : port;

app.listen(finalPort, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  // Seed MongoDB on startup
  try {
    await seedMongo();
  } catch (seedErr) {
    logger.error({ err: seedErr }, "Failed to seed MongoDB");
  }

  logger.info({ port: finalPort }, "Server listening");
});
