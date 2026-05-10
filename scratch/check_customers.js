import { connectMongo, Customer } from "./lib/mongo-db/src/index.js";
import dotenv from "dotenv";
dotenv.config();

async function check() {
  await connectMongo();
  const customers = await Customer.find();
  console.log("Customers count:", customers.length);
  customers.forEach(c => console.log("- ", c.name, c._id));
  process.exit(0);
}

check();
