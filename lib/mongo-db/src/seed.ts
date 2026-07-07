import { connectMongo, Customer, Vehicle, User, Master, BatchEntry, MoistureSetting, CubeMaster, BatchItemMatching } from "./index";

const mockCustomers: any[] = [];
const mockVehicles: any[] = [];
const mockMasters: any[] = [];
const mockBatchEntries: any[] = [];
const mockCubeMasters: any[] = [];
const mockBatchItemMatchings: any[] = [];
const mockMoistureSettings: any[] = [];

export async function seedMongo() {
  try {
    await connectMongo();
    console.log("Starting MongoDB seeding...");

    // 1. Seed Customers if empty
    const custCount = await Customer.countDocuments();
    if (custCount === 0) {
      await Customer.insertMany(mockCustomers);
      console.log("✅ Seeded Customers");
    }

    // 2. Seed Vehicles if empty
    const vehCount = await Vehicle.countDocuments();
    if (vehCount === 0) {
      await Vehicle.insertMany(mockVehicles);
      console.log("✅ Seeded Vehicles");
    }

    // 3. Seed Masters if empty
    const masterCount = await Master.countDocuments();
    if (masterCount === 0) {
      await Master.insertMany(mockMasters);
      console.log("✅ Seeded Masters");
    } else {
      for (const m of mockMasters) {
        if (m.type === "plant") {
          const exists = await Master.findOne({ type: "plant", name: m.name });
          if (!exists) {
            await Master.create(m);
            console.log(`✅ Added plant: ${m.name}`);
          }
        }
      }
    }

    // 4. Ensure Admin User exists
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      await User.create({
        username: "admin",
        passwordHash: "admin123",
        role: "admin"
      });
      console.log("✅ Seeded Admin User");
    }

    // 5. Mix Designs — not seeded, users add their own.

    // 6. Recipes — not seeded, users add their own.

    // 7. Seed Batch Entries if empty
    const batchCount = await BatchEntry.countDocuments();
    if (batchCount === 0) {
      await BatchEntry.insertMany(mockBatchEntries);
      console.log("✅ Seeded Batch Entries");
    }

    // 8. Seed Cube Masters if empty
    const cubeMasterCount = await CubeMaster.countDocuments();
    if (cubeMasterCount === 0) {
      await CubeMaster.insertMany(mockCubeMasters);
      console.log("✅ Seeded Cube Masters");
    }

    // 9. Seed Batch Item Matchings if empty
    const matchingCount = await BatchItemMatching.countDocuments();
    if (matchingCount === 0) {
      await BatchItemMatching.insertMany(mockBatchItemMatchings);
      console.log("✅ Seeded Batch Item Matchings");
    }

    // 10. Seed Moisture Settings if empty
    const moistureCount = await MoistureSetting.countDocuments();
    if (moistureCount === 0) {
      await MoistureSetting.insertMany(mockMoistureSettings);
      console.log("✅ Seeded Moisture Settings");
    }

    console.log("MongoDB Seeding complete.");
  } catch (err) {
    console.error("MongoDB seeding failed:", err);
  }
}

