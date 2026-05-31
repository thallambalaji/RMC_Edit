import { Router, type IRouter } from "express";
import mongoose, { Schema } from "mongoose";
import { connectMongo, QCTest, MixDesign, CubeEntry, BatchEntry, MoistureSetting, CubeMaster, BatchItemMatching, Recipe } from "@workspace/mongo-db";
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

// --- Mix Design Routes ---

router.get("/mix-designs", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const designs = await MixDesign.find().sort({ createdAt: -1 });
    res.json(designs.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/mix-designs", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const design = new MixDesign(req.body);
    await design.save();
    res.status(201).json(toApi(design));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Bad Request" });
  }
});

router.put("/mix-designs/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const design = await MixDesign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!design) {
      res.status(404).json({ error: "Mix design not found" });
      return;
    }
    res.json(toApi(design));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID or request body" });
  }
});

router.delete("/mix-designs/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const design = await MixDesign.findByIdAndDelete(req.params.id);
    if (!design) {
      res.status(404).json({ error: "Mix design not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});
// --- Recipe Routes ---

router.get("/recipes", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(recipes.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/recipes", async (req, res): Promise<void> => {
  console.log("RECEIVING RECIPE DATA:", JSON.stringify(req.body, null, 2));
  try {
    await connectMongo();
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(toApi(recipe));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Bad Request" });
  }
});

router.put("/recipes/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.json(toApi(recipe));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID or request body" });
  }
});

router.delete("/recipes/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Lookup recipe by customer + siteName + grade (for batch sheet auto-fill)
router.get("/recipes/lookup", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const { customer, siteName, grade } = req.query as Record<string, string>;
    if (!grade) {
      res.status(400).json({ error: "grade is required" });
      return;
    }
    // Build query — grade is always required; customer & siteName are optional filters
    const query: Record<string, string | RegExp> = { grade };
    if (customer) query.customer = new RegExp(customer, "i");
    if (siteName) query.siteName = new RegExp(siteName, "i");
    const recipe = await Recipe.findOne(query).sort({ createdAt: -1 });
    if (!recipe) {
      res.status(404).json({ error: "No recipe found for the given parameters" });
      return;
    }
    res.json(toApi(recipe));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Cube Entry Routes ---

router.get("/cube-entries", async (_req, res): Promise<void> => {
  console.log("📥 GET /api/cube-entries called");
  try {
    await connectMongo();
    const entries = await CubeEntry.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${entries.length} cube entries`);
    res.json(entries.map(toApi));
  } catch (error) {
    console.error("❌ ERROR in GET /api/cube-entries:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/cube-entries", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const entry = new CubeEntry(req.body);
    await entry.save();
    res.status(201).json(toApi(entry));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Bad Request" });
  }
});

router.delete("/cube-entries/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const entry = await CubeEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// --- Batch Entry Routes ---

router.get("/batch-entries", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const entries = await BatchEntry.find().sort({ createdAt: -1 });
    res.json(entries.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/batch-entries/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const entry = await BatchEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Batch entry not found" });
      return;
    }
    res.json(toApi(entry));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.post("/batch-entries", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const entry = new BatchEntry(req.body);
    await entry.save();
    res.status(201).json(toApi(entry));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Bad Request" });
  }
});

router.delete("/batch-entries/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const entry = await BatchEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Batch entry not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.post("/batch-entries/clear-duplicates", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    // Group by batchNo, find duplicates
    const duplicates = await BatchEntry.aggregate([
      {
        $group: {
          _id: "$batchNo",
          uniqueIds: { $addToSet: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    let deletedCount = 0;
    for (const group of duplicates) {
      // Keep the first one, delete the rest
      const [keepId, ...deleteIds] = group.uniqueIds;
      const result = await BatchEntry.deleteMany({ _id: { $in: deleteIds } });
      deletedCount += result.deletedCount;
    }

    res.json({ message: `Cleared ${deletedCount} duplicate entries successfully.`, deletedCount });
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// --- Moisture Setting Routes ---
router.get("/moisture-settings", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const settings = await MoistureSetting.find();
    res.json(settings.map(toApi));
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.get("/moisture-settings/:plant", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const setting = await MoistureSetting.findOne({ plant: req.params.plant });
    if (!setting) {
      res.json({ plant: req.params.plant, moisture20mm: 0, moisture10mm: 0, moistureMSand: 0, moistureRSand: 0 });
      return;
    }
    res.json(toApi(setting));
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.post("/moisture-settings", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const { plant, moisture20mm, moisture10mm, moistureMSand, moistureRSand } = req.body;
    const setting = await MoistureSetting.findOneAndUpdate(
      { plant },
      { moisture20mm, moisture10mm, moistureMSand, moistureRSand },
      { new: true, upsert: true }
    );
    res.json(toApi(setting));
  } catch (error: any) {
    res.status(400).json({ error: "Bad Request", details: error.message });
  }
});

// --- Cube Master Routes ---
router.get("/cube-masters", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const masters = await CubeMaster.find().sort({ createdAt: -1 });
    res.json(masters.map(toApi));
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.post("/cube-masters", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const master = new CubeMaster(req.body);
    await master.save();
    res.status(201).json(toApi(master));
  } catch (error: any) {
    res.status(400).json({ error: "Bad Request", details: error.message });
  }
});

router.put("/cube-masters/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const master = await CubeMaster.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!master) {
      res.status(404).json({ error: "Cube master not found" });
      return;
    }
    res.json(toApi(master));
  } catch (error: any) {
    res.status(400).json({ error: "Bad Request", details: error.message });
  }
});

router.delete("/cube-masters/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const master = await CubeMaster.findByIdAndDelete(req.params.id);
    if (!master) {
      res.status(404).json({ error: "Cube master not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error: any) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// --- Batch Item Matching Routes ---
router.get("/batch-item-matchings", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const matchings = await BatchItemMatching.find().sort({ createdAt: -1 });
    res.json(matchings.map(toApi));
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.post("/batch-item-matchings", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const matching = new BatchItemMatching(req.body);
    await matching.save();
    res.status(201).json(toApi(matching));
  } catch (error: any) {
    res.status(400).json({ error: "Bad Request", details: error.message });
  }
});

router.delete("/batch-item-matchings/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const matching = await BatchItemMatching.findByIdAndDelete(req.params.id);
    if (!matching) {
      res.status(404).json({ error: "Batch item matching not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error: any) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
