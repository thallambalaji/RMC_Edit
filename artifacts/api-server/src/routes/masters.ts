import { Router } from "express";
import { connectMongo, Master } from "@workspace/mongo-db";

const router = Router();

// GET /api/masters?type=...
router.get("/masters", async (req, res) => {
  try {
    const { type } = req.query;
    console.log(`📥 GET /api/masters?type=${type}`);
    await connectMongo();
    const filter = type ? { type: String(type) } : {};
    const results = await Master.find(filter).sort({ name: 1 });
    console.log(`✅ Found ${results.length} masters`);
    res.json(results.map(r => ({ ...r.toObject(), id: String(r._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/masters
router.post("/masters", async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) { res.status(400).json({ error: "Type and Name required" }); return; }
    
    await connectMongo();
    const newMaster = new Master({ type, name });
    await newMaster.save();
    res.status(201).json({ ...newMaster.toObject(), id: String(newMaster._id) });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/masters/:id
router.delete("/masters/:id", async (req, res) => {
  try {
    await connectMongo();
    await Master.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
