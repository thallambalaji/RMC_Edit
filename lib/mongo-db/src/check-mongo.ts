import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in the environment or .env file.");
  process.exit(1);
}

async function checkConnection() {
  console.log("Connecting to MongoDB Atlas...");
  
  try {
    await mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
    
    const db = mongoose.connection.db;
    const collections = await db!.listCollections().toArray();
    
    console.log(`📡 Found ${collections.length} collections:`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    await mongoose.disconnect();
    console.log("🔌 Disconnected safely.");
  } catch (err: any) {
    console.error("❌ CONNECTION FAILED!");
    console.error(`Error details: ${err.message}`);
    process.exit(1);
  }
}

checkConnection();
