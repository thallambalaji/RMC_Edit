import { Router, type IRouter } from "express";
import { connectMongo, PaymentFollowUp } from "@workspace/mongo-db";

const router: IRouter = Router();

// GET /api/payment-follow-ups
router.get("/payment-follow-ups", async (req, res) => {
  try {
    await connectMongo();
    const results = await PaymentFollowUp.find()
      .populate("customerId")
      .sort({ createdAt: -1 });

    res.json(results.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        id: String(r._id),
        customerName: obj.customerId?.name || "Unknown Customer",
        customerPhone: obj.customerId?.phone || "",
        customerEmail: obj.customerId?.email || "",
        customerBalance: obj.customerId?.creditLimit ? `₹ ${obj.customerId.creditLimit.toLocaleString()}` : "₹ 0"
      };
    }));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/payment-follow-ups
router.post("/payment-follow-ups", async (req, res) => {
  try {
    const {
      customerId,
      followupDate,
      followupTime,
      status,
      nextDate,
      nextTime,
      description,
      createdBy
    } = req.body;

    if (!customerId || !followupDate || !followupTime || !status) {
      res.status(400).json({ error: "Required fields are missing" });
      return;
    }

    await connectMongo();

    // Generate followupId sequence: FUP/26-27/1001, etc.
    const count = await PaymentFollowUp.countDocuments();
    const followupId = `FUP/26-27/${1001 + count}`;

    const newFollowUp = new PaymentFollowUp({
      followupId,
      customerId,
      followupDate,
      followupTime,
      status,
      nextDate,
      nextTime,
      description,
      createdBy: createdBy || "Admin"
    });

    await newFollowUp.save();
    res.status(201).json({ ...newFollowUp.toObject(), id: String(newFollowUp._id) });
  } catch (error: any) {
    console.error("Error creating payment follow-up:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/payment-follow-ups/:id
router.delete("/payment-follow-ups/:id", async (req, res) => {
  try {
    await connectMongo();
    await PaymentFollowUp.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
