import { Router, type IRouter } from "express";
import { connectMongo, PurchaseOrder, Customer } from "@workspace/mongo-db";
import {
  CreatePurchaseOrderBody,
  UpdatePurchaseOrderBody,
  GetPurchaseOrderParams,
  UpdatePurchaseOrderParams,
  DeletePurchaseOrderParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(order: any) {
  const obj = order.toObject ? order.toObject() : order;
  return {
    ...obj,
    id: String(obj._id),
    customerId: String(obj.customerId?._id || obj.customerId),
    customerName: obj.customerId?.name || "Unknown",
    totalAmount: obj.totalAmount || 0,
    orderDate: obj.poDate, // Map poDate to orderDate for frontend compatibility
  };
}

router.get("/purchase-orders", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const orders = await PurchaseOrder.find().populate("customerId").sort({ createdAt: -1 });
    res.json(orders.map(toApi));
  } catch (error) {
    console.error("Failed to fetch purchase orders from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/purchase-orders", async (req, res): Promise<void> => {
  const parsed = CreatePurchaseOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const order = new PurchaseOrder({
      ...parsed.data,
      poDate: (parsed.data as any).orderDate || new Date().toISOString(), // Handle potential field name mismatch
    });
    await order.save();
    const populated = await order.populate("customerId");
    res.status(201).json(toApi(populated));
  } catch (error) {
    console.error("Failed to save purchase order to MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/purchase-orders/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const order = await PurchaseOrder.findById(req.params.id).populate("customerId");
    if (!order) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }
    res.json(toApi(order));
  } catch (error) {
    res.status(400).json({ error: "Invalid Order ID" });
  }
});

router.put("/purchase-orders/:id", async (req, res): Promise<void> => {
  const parsed = UpdatePurchaseOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).populate("customerId");
    if (!order) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }
    res.json(toApi(order));
  } catch (error) {
    res.status(400).json({ error: "Invalid Order ID" });
  }
});

router.delete("/purchase-orders/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid Order ID" });
  }
});

export default router;
