import "dotenv/config";
import { seedMongo } from "./seed";

async function run() {
  console.log("Manual seed starting...");
  console.log("URI from env:", process.env.MONGODB_URI ? "Present" : "Missing");
  
  try {
    await seedMongo();
    console.log("Manual seed finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Manual seed failed:", err);
    process.exit(1);
  }
}

run();
