import { Router, type IRouter } from "express";
import { connectMongo, SalesOrder, Customer } from "@workspace/mongo-db";
import {
  CreateSalesOrderBody,
  UpdateSalesOrderBody,
  GetSalesOrderParams,
  UpdateSalesOrderParams,
  DeleteSalesOrderParams,
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
    items: obj.items || [],
  };
}

router.get("/sales-orders", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const orders = await SalesOrder.find().populate("customerId").sort({ createdAt: -1 });
    res.json(orders.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/sales-orders", async (req, res): Promise<void> => {
  const parsed = CreateSalesOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const order = new SalesOrder(parsed.data);
    await order.save();
    const populated = await order.populate("customerId");
    res.status(201).json(toApi(populated));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/sales-orders/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const order = await SalesOrder.findById(req.params.id).populate("customerId");
    if (!order) {
      res.status(404).json({ error: "Sales order not found" });
      return;
    }
    res.json(toApi(order));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.put("/sales-orders/:id", async (req, res): Promise<void> => {
  const parsed = UpdateSalesOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).populate("customerId");
    if (!order) {
      res.status(404).json({ error: "Sales order not found" });
      return;
    }
    res.json(toApi(order));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.delete("/sales-orders/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const order = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Sales order not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
