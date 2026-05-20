import mongoose from "mongoose";

let cached = (globalThis as any).mongoose;

if (!cached) {
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

async function connectMongo() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set. Add it in Railway → Variables.");
  }
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Connected to MongoDB Atlas");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { connectMongo };

// Models
export * from "./models/WeighmentTicket";
export * from "./models/Customer";
export * from "./models/Invoice";
export * from "./models/User";
export * from "./models/Transport";
export * from "./models/Master";
export * from "./models/PurchaseOrder";
export * from "./models/DeliveryChallan";
export * from "./models/Others";
export * from "./seed";
