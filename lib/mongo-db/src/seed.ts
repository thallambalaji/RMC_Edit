import { connectMongo, Customer, Vehicle, User, Master } from "./index";

const mockCustomers = [
  { name: "CLOUDSWOOD CONSTRUCTIONS PRIVATE LIMITED", contact: "9876543210", email: "info@cloudswood.com", address: "UPSIDE AVENUES, Site 4", gstNumber: "36AAAAA0000A1Z5", marketingPerson: "Fortune Concrete" },
  { name: "RADHEY CONSTRUCTIONS INDIA PRIVATE LIMITED", contact: "9123456789", email: "contact@radhey.in", address: "Raaga, Hyderabad", gstNumber: "36BBBBB1111B2Z6", marketingPerson: "Fortune Concrete" },
  { name: "SREE CHAITANYA CONSTRUCTIONS", contact: "9000012345", email: "sree@chaitanya.com", address: "VELIMELA, Site A", gstNumber: "36CCCCC2222C3Z7", marketingPerson: "Fortune Concrete" },
];

const mockVehicles = [
  { registrationNo: "TS07UP 1459", model: "Schwing Stetter 6m3", capacity: 6, status: "available" },
  { registrationNo: "TS07UP 1789", model: "Schwing Stetter 7m3", capacity: 7, status: "available" },
  { registrationNo: "TS07UP 1679", model: "Ashok Leyland 6m3", capacity: 6, status: "in-transit" },
];

const mockMasters = [
  { type: "locality", name: "UPSIDE AVENUES" },
  { type: "locality", name: "Raaga" },
  { type: "locality", name: "VELIMELA" },
  { type: "material", name: "M10" },
  { type: "material", name: "M20" },
  { type: "material", name: "M25" },
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

    console.log("MongoDB Seeding complete.");
  } catch (err) {
    console.error("MongoDB seeding failed:", err);
  }
}
