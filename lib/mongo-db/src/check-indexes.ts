import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectMongo, Recipe } from "./index";

async function check() {
  try {
    await connectMongo();
    const indexes = await Recipe.collection.getIndexes();
    console.log("Recipe Indexes:", JSON.stringify(indexes, null, 2));
  } catch (err) {
    console.error("Check failed:", err);
  }
  process.exit(0);
}

check();
