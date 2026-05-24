import { connectMongo, Customer, Vehicle, User, Master, MixDesign, Recipe, BatchEntry, MoistureSetting, CubeMaster, BatchItemMatching } from "./index";

const mockCustomers = [
  { name: "CLOUDSWOOD CONSTRUCTIONS PRIVATE LIMITED", contact: "9876543210", email: "info@cloudswood.com", address: "UPSIDE AVENUES, Site 4", gstNumber: "36AAAAA0000A1Z5", marketingPerson: "Fortune Concrete" },
  { name: "RADHEY CONSTRUCTIONS INDIA PRIVATE LIMITED", contact: "9123456789", email: "contact@radhey.in", address: "Raaga, Hyderabad", gstNumber: "36BBBBB1111B2Z6", marketingPerson: "Fortune Concrete" },
  { name: "SREE CHAITANYA CONSTRUCTIONS", contact: "9000012345", email: "sree@chaitanya.com", address: "VELIMELA, Site A", gstNumber: "36CCCCC2222C3Z7", marketingPerson: "Fortune Concrete" },
];

// No mock vehicles — vehicles must be added via the Transport > Add Vehicle form
const mockVehicles: any[] = [];

const mockMasters = [
  { type: "locality", name: "UPSIDE AVENUES" },
  { type: "locality", name: "Raaga" },
  { type: "locality", name: "VELIMELA" },
  { type: "material", name: "M25" },
  { type: "plant", name: "FORTUNE CONCRETE" },
  { type: "plant", name: "NAVAL RMC" },
];

const mockMixDesigns = [
  { recipeCode: "M20 SCREED", recipeName: "M20 SCR", grade: "M-20", aggr1: "20MM : 100", aggr2: "10MM : 972", aggr3: "R SAND : 0", aggr4: "M SAND : 823", cem1: "CEM1 : 288", cem2: "GGBS : 52", cem3: "CEM3 : 0", water: "WATER : 160", admix1: "ADD-1 : 2", admix2: "Admix2 : 0" },
  { recipeCode: "M35 SWASTHI", recipeName: "M35", grade: "M-35", aggr1: "20MM : 670", aggr2: "10MM : 420", aggr3: "R SAND : 0", aggr4: "CRF : 740", cem1: "CEM1 : 340", cem2: "FLAYASH : 60", cem3: "CEM3 : 0", water: "WATER : 170", admix1: "ADD-1 : 2.6", admix2: "Admix2 : 0" },
  { recipeCode: "M30 FC A1", recipeName: "M30 FC", grade: "M-30", aggr1: "20MM : 620", aggr2: "10MM : 400", aggr3: "R SAND : 0", aggr4: "M SAND : 760", cem1: "CEM1 : 370", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 160", admix1: "ADD-1 : 1", admix2: "Admix2 : 0" },
  { recipeCode: "M20 FC & VDF & WPC", recipeName: "M20FC", grade: "M-20", aggr1: "20MM : 635", aggr2: "10MM : 438", aggr3: "R SAND : 0", aggr4: "SAND : 848", cem1: "CEM1 : 320", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 165", admix1: "ADMIX1 : 2.2", admix2: "Admix2 : 0" },
  { recipeCode: "M25FC SCREED", recipeName: "M25FC SCREED", grade: "M-25", aggr1: "20MM : 0", aggr2: "10MM : 999", aggr3: "R SAND : 0", aggr4: "SAND : 880", cem1: "CEM1 : 340", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 170", admix1: "AD1 : 2.5", admix2: "Admix2 : 0" },
  { recipeCode: "M30 KEYSTONE", recipeName: "M30", grade: "M-30", aggr1: "20MM : 630", aggr2: "12MM : 410", aggr3: "R SAND : 405", aggr4: "SAND : 405", cem1: "CEM1 : 320", cem2: "CEM2 : 80", cem3: "CEM3 : 0", water: "WATER : 150", admix1: "AD1 : 2.8", admix2: "Admix2 : 0" },
  { recipeCode: "M25 SCC VEEDHA", recipeName: "M25 SCC", grade: "M-25", aggr1: "20MM : 0", aggr2: "12MM : 920", aggr3: "R SAND : 0", aggr4: "SAND : 880", cem1: "CEM1 : 280", cem2: "CEM2 : 165", cem3: "CEM3 : 0", water: "WATER : 170", admix1: "ADMIX1 : 2", admix2: "Admix2 : 0" },
  { recipeCode: "M25 FC", recipeName: "M25 FC", grade: "M-25", aggr1: "20MM : 655", aggr2: "12MM : 423", aggr3: "R SAND : 0", aggr4: "M SAND : 812", cem1: "CEM1 : 340", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 168", admix1: "ADMIX1 : 2.8", admix2: "Admix2 : 0" },
  { recipeCode: "M30 PCH RIVER EDGE LLP", recipeName: "M30", grade: "M-30", aggr1: "20MM : 620", aggr2: "12MM : 418", aggr3: "R SAND : 0", aggr4: "M SAND : 774", cem1: "CEM1 : 273", cem2: "GGBS : 117", cem3: "CEM3 : 0", water: "WATER : 183", admix1: "ADMIX1 : 1.38", admix2: "Admix2 : 0" },
  { recipeCode: "M35 SAADCRETE", recipeName: "M35", grade: "M-35", aggr1: "20MM : 632", aggr2: "12MM : 422", aggr3: "M SAND : 749", aggr4: "R SAND : 0", cem1: "CEM1 : 285", cem2: "GGBS : 135", cem3: "CEM3 : 0", water: "WATER : 177", admix1: "ADMIX1 : 1.3", admix2: "Admix2 : 0" },
];

const mockRecipes = [
  { recipeCode: "M20 BHAVYA", customer: "M/S DHESI HOUSE", siteName: "NANDHIGAMA", grade: "M20", plant: "FORTUNE CONCRETE", slump: "100+/-20", totalDensity: 2420, ingredients: [] },
  { recipeCode: "M15 BHAVYA", customer: "M/S DHESI HOUSE", siteName: "NANDHIGAMA", grade: "M15", plant: "FORTUNE CONCRETE", slump: "100+/-20", totalDensity: 2380, ingredients: [] },
  { recipeCode: "M10 CLOUDSWOOD", customer: "CLOUDSWOOD CONSTRUCTIONS PRIVATE LIMITED", siteName: "UPSIDE AVENUES", grade: "M10", plant: "FORTUNE CONCRETE", slump: "100+/-20", totalDensity: 2350, ingredients: [] },
];

const mockBatchEntries = [
  { batchNo: "B20260517001", date: "2026-05-17", customerName: "CLOUDSWOOD CONSTRUCTIONS PRIVATE LIMITED", siteName: "UPSIDE AVENUES, Site 4", grade: "M-20", quantity: 6, batchedQty: 5.85, vehicleNo: "TS07UP 1459", plant: "FORTUNE CONCRETE" },
  { batchNo: "B20260517002", date: "2026-05-17", customerName: "RADHEY CONSTRUCTIONS INDIA PRIVATE LIMITED", siteName: "Raaga, Hyderabad", grade: "M-35", quantity: 7, batchedQty: 6.95, vehicleNo: "TS07UP 1789", plant: "FORTUNE CONCRETE" },
  { batchNo: "B20260517003", date: "2026-05-16", customerName: "SREE CHAITANYA CONSTRUCTIONS", siteName: "VELIMELA, Site A", grade: "M-25", quantity: 6, batchedQty: 6.00, vehicleNo: "TS07UP 1679", plant: "FORTUNE CONCRETE" },
  { batchNo: "B20260517003", date: "2026-05-16", customerName: "SREE CHAITANYA CONSTRUCTIONS", siteName: "VELIMELA, Site A", grade: "M-25", quantity: 6, batchedQty: 6.00, vehicleNo: "TS07UP 1679", plant: "FORTUNE CONCRETE" },
];

const mockCubeMasters = [
  { length: 150, breadth: 150, height: 150, density: 0.003375, compStrength: 22.5 },
];

const mockBatchItemMatchings = [
  { plant: "FORTUNE CONCRETE", storeItem: "Aggregate 20mm", batchItemName: "20MM" },
  { plant: "FORTUNE CONCRETE", storeItem: "Aggregate 10mm", batchItemName: "10MM" },
  { plant: "FORTUNE CONCRETE", storeItem: "River Sand", batchItemName: "R SAND" },
  { plant: "FORTUNE CONCRETE", storeItem: "M-Sand", batchItemName: "M SAND" },
  { plant: "FORTUNE CONCRETE", storeItem: "Cement OPC 53 Grade", batchItemName: "CEM1" },
  { plant: "FORTUNE CONCRETE", storeItem: "Fly Ash", batchItemName: "CEM2" },
];

const mockMoistureSettings = [
  { plant: "FORTUNE CONCRETE", moisture20mm: 1.5, moisture10mm: 2.0, moistureMSand: 4.5, moistureRSand: 0.0 },
  { plant: "NAVAL RMC", moisture20mm: 0.0, moisture10mm: 0.0, moistureMSand: 0.0, moistureRSand: 0.0 },
];

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

    // 5. Seed Mix Designs if empty
    const mixCount = await MixDesign.countDocuments();
    if (mixCount === 0) {
      await MixDesign.insertMany(mockMixDesigns);
      console.log("✅ Seeded Mix Designs");
    }

    // 6. Seed Recipes if empty
    const recipeCount = await Recipe.countDocuments();
    if (recipeCount === 0) {
      await Recipe.insertMany(mockRecipes);
      console.log("✅ Seeded Recipes");
    }

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

