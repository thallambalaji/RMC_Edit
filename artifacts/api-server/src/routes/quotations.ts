import { Router, type IRouter } from "express";
import { connectMongo, Quotation } from "@workspace/mongo-db";
import { CreateQuotationBody } from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(quot: any) {
  const obj = quot.toObject ? quot.toObject() : quot;
  return {
    ...obj,
    id: String(obj._id),
    items: obj.items || [],
    notes: obj.notes || [],
  };
}

router.get("/quotations", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/quotations", async (req, res): Promise<void> => {
  const parsed = CreateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();

    // Ensure uniqueness of quotationNo
    const existing = await Quotation.findOne({ quotationNo: parsed.data.quotationNo });
    if (existing) {
      res.status(400).json({ error: "Quotation number already exists!" });
      return;
    }

    const quotation = new Quotation(parsed.data);
    await quotation.save();
    res.status(201).json(toApi(quotation));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

router.delete("/quotations/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      res.status(404).json({ error: "Quotation not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
