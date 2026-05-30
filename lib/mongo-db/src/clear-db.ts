import "dotenv/config";
import mongoose from "mongoose";
import { connectMongo } from "./index.js";

async function run() {
  console.log("Connecting to MongoDB...");
  await connectMongo();
  console.log("Connected successfully.");

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    console.log(`Clearing collection: ${key}`);
    await collections[key].deleteMany({});
  }

  // Get or define User model dynamically if not already defined
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "user" }
  }, { timestamps: true }));

  await User.create({
    username: "admin",
    passwordHash: "admin123",
    role: "admin"
  });
  console.log("✅ Re-created Admin User successfully.");

  console.log("Database cleared successfully.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Database clear failed:", err);
  process.exit(1);
});
