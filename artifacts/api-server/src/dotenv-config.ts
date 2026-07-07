import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env file in local development - Railway injects env vars directly into process.env
const envPath = path.resolve(__dirname, "..", "..", "..", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ Environment variables loaded from root .env");
} else {
  console.log("ℹ️  No .env file found (expected in production - using platform env vars)");
}

