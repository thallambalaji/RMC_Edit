import { Router, type IRouter } from "express";
import { connectMongo, Invoice, Customer } from "@workspace/mongo-db";
import { Types } from "mongoose";

const router: IRouter = Router();

function toApi(invoice: any) {
  try {
    const obj = invoice.toObject ? invoice.toObject() : invoice;
    return {
      ...obj,
      id: String(obj._id || obj.id || ""),
      customerId: obj.customerId ? String(obj.customerId?._id || obj.customerId) : null,
      customerName: obj.customerId?.name || "Unknown",
    };
  } catch (e) {
    return invoice;
  }
}

router.get("/invoices", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const invoices = await Invoice.find().populate("customerId").sort({ createdAt: -1 });
    res.json(invoices.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/invoices", async (req, res): Promise<void> => {
  try {
    console.log("URGENT: Received Save Request:", JSON.stringify(req.body, null, 2));
    await connectMongo();
    
    // Support both direct body and wrapped data
    const rawData = req.body.data || req.body;
    const customerIdStr = rawData.customerid || rawData.customerId;

    if (!customerIdStr || !Types.ObjectId.isValid(String(customerIdStr))) {
      res.status(400).json({ error: "Invalid or missing Customer ID", received: customerIdStr });
      return;
    }

    const data: any = {
      ...rawData,
      customerId: new Types.ObjectId(String(customerIdStr)),
    };

    delete data.customerid;
    if (data.vehicleid) {
      if (Types.ObjectId.isValid(String(data.vehicleid))) {
        data.vehicleId = new Types.ObjectId(String(data.vehicleid));
      }
      delete data.vehicleid;
    }

    const invoice = new Invoice(data);
    await invoice.save();
    const populated = await invoice.populate("customerId");
    res.status(201).json(toApi(populated));
  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    res.status(500).json({ 
      error: error.message || "Internal Server Error",
      name: error.name,
      stack: error.stack
    });
  }
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const invoice = await Invoice.findById(req.params.id).populate("customerId");
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json(toApi(invoice));
  } catch (error) {
    res.status(400).json({ error: "Invalid Invoice ID" });
  }
});

export default router;
