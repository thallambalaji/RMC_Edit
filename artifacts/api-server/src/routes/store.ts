import { Router, type IRouter } from "express";
import { connectMongo, Product } from "@workspace/mongo-db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(p: any) {
  const obj = p.toObject ? p.toObject() : p;
  return {
    ...obj,
    id: String(obj._id),
    unitPrice: obj.unitPrice || 0,
    stockQty: obj.stockQty || 0,
    minStockLevel: obj.minStockLevel || 0,
  };
}

router.get("/products", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const products = await Product.find().sort({ createdAt: 1 });
    res.json(products.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const product = new Product(parsed.data);
    await product.save();
    res.status(201).json(toApi(product));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(toApi(product));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const product = await Product.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(toApi(product));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Inventory entries would also be migrated similarly
router.get("/inventory-entries", async (_req, res) => {
  res.json([]);
});

export default router;
