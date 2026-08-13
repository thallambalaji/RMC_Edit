import { Router, type IRouter } from "express";
import { connectMongo, StoreInventory, StoreInventoryHistory } from "@workspace/mongo-db";
import { z } from "zod";

const router: IRouter = Router();

// Zod schema for validation
const createStoreInventorySchema = z.object({
  plant: z.string(),
  inventoryNo: z.string(),
  supplierName: z.string(),
  itemName: z.string(),
  billNo: z.string(),
  amount: z.string().or(z.number()),
  inventoryDate: z.string(),
  inventoryTime: z.string(),
  gatepassNo: z.string().optional().nullable(),
  royaltyNo: z.string().optional().nullable(),
  unit: z.string(),
  deliveryAddress: z.string(),
  vehicleNo: z.string(),
  loadedWeight: z.string().or(z.number()),
  emptyWeight: z.string().or(z.number()),
  netWeight: z.string().or(z.number()),
  supplierWeight: z.string().or(z.number()),
  weightDifference: z.string().or(z.number()),
  createdBy: z.string().optional(),
});

// GET all receipts
router.get("/store-inventories", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const receipts = await StoreInventory.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    console.error("Failed to fetch store inventory receipts from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all modification history logs
router.get("/store-inventories-history", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const history = await StoreInventoryHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error("Failed to fetch store inventory history from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET receipt by ID
router.get("/store-inventories/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const receipt = await StoreInventory.findById(req.params.id);
    if (!receipt) {
      res.status(404).json({ error: "Receipt not found" });
      return;
    }
    res.json(receipt);
  } catch (error) {
    console.error("Failed to fetch store inventory receipt by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST create receipt and log modification
router.post("/store-inventories", async (req, res): Promise<void> => {
  try {
    const parsed = createStoreInventorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await connectMongo();
    const receipt = new StoreInventory({
      ...parsed.data,
      amount: Number(parsed.data.amount),
      loadedWeight: Number(parsed.data.loadedWeight),
      emptyWeight: Number(parsed.data.emptyWeight),
      netWeight: Number(parsed.data.netWeight),
      supplierWeight: Number(parsed.data.supplierWeight),
      weightDifference: Number(parsed.data.weightDifference),
      createdBy: parsed.data.createdBy || "Super Admin",
    });

    await receipt.save();
    console.log("✅ Store Inventory receipt saved successfully:", receipt._id);

    // Audit Log
    const historyLog = new StoreInventoryHistory({
      inventoryNo: receipt.inventoryNo,
      modificationType: "create",
      comment: "Inventory Created",
      oldData: null,
      newData: receipt.toObject(),
      modifiedBy: receipt.createdBy || "Super Admin",
    });
    await historyLog.save();

    res.status(201).json(receipt);
  } catch (error: any) {
    console.error("❌ Failed to save store inventory receipt to MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// PUT update receipt and log modification
router.put("/store-inventories/:id", async (req, res): Promise<void> => {
  try {
    const parsed = createStoreInventorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await connectMongo();
    
    // Fetch old receipt first for comparison
    const oldReceipt = await StoreInventory.findById(req.params.id);
    if (!oldReceipt) {
      res.status(404).json({ error: "Store inventory receipt not found" });
      return;
    }

    const oldDataObj = oldReceipt.toObject();

    const result = await StoreInventory.findByIdAndUpdate(
      req.params.id,
      {
        ...parsed.data,
        amount: Number(parsed.data.amount),
        loadedWeight: Number(parsed.data.loadedWeight),
        emptyWeight: Number(parsed.data.emptyWeight),
        netWeight: Number(parsed.data.netWeight),
        supplierWeight: Number(parsed.data.supplierWeight),
        weightDifference: Number(parsed.data.weightDifference),
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ error: "Store inventory receipt not found" });
      return;
    }

    console.log("✅ Store Inventory receipt updated successfully:", result._id);

    // Audit Log
    const historyLog = new StoreInventoryHistory({
      inventoryNo: result.inventoryNo,
      modificationType: "update",
      comment: "Inventory Updated",
      oldData: oldDataObj,
      newData: result.toObject(),
      modifiedBy: parsed.data.createdBy || "Super Admin",
    });
    await historyLog.save();

    res.json(result);
  } catch (error: any) {
    console.error("❌ Failed to update store inventory receipt in MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// DELETE receipt and log modification
router.delete("/store-inventories/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();

    const oldReceipt = await StoreInventory.findById(req.params.id);
    if (!oldReceipt) {
      res.status(404).json({ error: "Store inventory receipt not found" });
      return;
    }

    const oldDataObj = oldReceipt.toObject();

    await StoreInventory.findByIdAndDelete(req.params.id);
    console.log("🗑️ Store Inventory receipt deleted successfully:", req.params.id);

    // Audit Log
    const historyLog = new StoreInventoryHistory({
      inventoryNo: oldDataObj.inventoryNo,
      modificationType: "delete",
      comment: "Inventory Deleted",
      oldData: oldDataObj,
      newData: null,
      modifiedBy: "Super Admin",
    });
    await historyLog.save();

    res.json({ message: "Store inventory receipt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete store inventory receipt from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
