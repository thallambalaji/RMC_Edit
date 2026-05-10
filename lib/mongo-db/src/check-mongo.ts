import mongoose from "mongoose";

// We'll pass the URI directly in the script for this one-time check
const MONGODB_URI = "mongodb://production:production@ac-mkvp9uf-shard-00-00.0nj2bt6.mongodb.net:27017,ac-mkvp9uf-shard-00-01.0nj2bt6.mongodb.net:27017,ac-mkvp9uf-shard-00-02.0nj2bt6.mongodb.net:27017/?tls=true&authSource=admin&retryWrites=true&w=majority&tlsInsecure=true";

async function checkConnection() {
  console.log("Connecting to MongoDB Atlas...");
  
  try {
    await mongoose.connect(MONGODB_URI, {
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
