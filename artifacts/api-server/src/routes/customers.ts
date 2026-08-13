import { Router, type IRouter } from "express";
import { connectMongo, Customer } from "@workspace/mongo-db";
import {
  CreateCustomerBody,
  UpdateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  DeleteCustomerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const customers = await Customer.find().sort({ createdAt: 1 });
    res.json(customers.map(c => ({ ...c.toObject(), id: String(c._id) })));
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Failed to fetch customers from MongoDB:", msg);
    res.status(500).json({ error: "Internal Server Error", detail: msg });
  }
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(i => `${i.path.join('.') || 'field'}: ${i.message}`).join("; ");
    res.status(400).json({ error: "Validation Error", detail: errorDetails });
    return;
  }

  if (parsed.data.contact && !/^\d{10}$/.test(parsed.data.contact)) {
    res.status(400).json({ error: "Validation Error", detail: "Customer Phone must be exactly 10 digits." });
    return;
  }
  if (parsed.data.contactPersonPhone && !/^\d{10}$/.test(parsed.data.contactPersonPhone)) {
    res.status(400).json({ error: "Validation Error", detail: "Contact Person Phone must be exactly 10 digits." });
    return;
  }

  
  try {
    await connectMongo();
    const customer = new Customer(parsed.data);
    await customer.save();
    res.status(201).json({ ...customer.toObject(), id: String(customer._id) });
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Failed to save customer to MongoDB:", msg);
    res.status(500).json({ error: msg, detail: msg });
  }
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ ...customer.toObject(), id: String(customer._id) });
  } catch (error) {
    res.status(400).json({ error: "Invalid Customer ID" });
  }
});

router.put("/customers/:id", async (req, res): Promise<void> => {
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.contact && !/^\d{10}$/.test(parsed.data.contact)) {
    res.status(400).json({ error: "Validation Error", detail: "Customer Phone must be exactly 10 digits." });
    return;
  }
  if (parsed.data.contactPersonPhone && !/^\d{10}$/.test(parsed.data.contactPersonPhone)) {
    res.status(400).json({ error: "Validation Error", detail: "Contact Person Phone must be exactly 10 digits." });
    return;
  }

  
  try {
    await connectMongo();
    const customer = await Customer.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ ...customer.toObject(), id: String(customer._id) });
  } catch (error) {
    res.status(400).json({ error: "Invalid Customer ID" });
  }
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid Customer ID" });
  }
});

export default router;
