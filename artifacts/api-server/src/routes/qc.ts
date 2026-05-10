import { Router, type IRouter } from "express";
import { connectMongo, QCTest } from "@workspace/mongo-db";
import {
  CreateQcTestBody,
  UpdateQcTestBody,
  GetQcTestParams,
  UpdateQcTestParams,
  DeleteQcTestParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(t: any) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    ...obj,
    id: String(obj._id),
    slump: obj.slump || 0,
    strength: obj.strength || 0,
  };
}

router.get("/qc-tests", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const tests = await QCTest.find().sort({ createdAt: 1 });
    res.json(tests.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/qc-tests", async (req, res): Promise<void> => {
  const parsed = CreateQcTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const test = new QCTest(parsed.data);
    await test.save();
    res.status(201).json(toApi(test));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/qc-tests/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const test = await QCTest.findById(req.params.id);
    if (!test) {
      res.status(404).json({ error: "QC test not found" });
      return;
    }
    res.json(toApi(test));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.put("/qc-tests/:id", async (req, res): Promise<void> => {
  const parsed = UpdateQcTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const test = await QCTest.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!test) {
      res.status(404).json({ error: "QC test not found" });
      return;
    }
    res.json(toApi(test));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.delete("/qc-tests/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const test = await QCTest.findByIdAndDelete(req.params.id);
    if (!test) {
      res.status(404).json({ error: "QC test not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
