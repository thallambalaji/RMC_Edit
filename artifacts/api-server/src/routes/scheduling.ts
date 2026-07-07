import { Router, type IRouter } from "express";
import { connectMongo, Schedule, Customer, SalesOrder } from "@workspace/mongo-db";
import {
  CreateScheduleBody,
  UpdateScheduleBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(schedule: any) {
  const obj = schedule.toObject ? schedule.toObject() : schedule;
  return {
    ...obj,
    id: String(obj._id),
    customerId: String(obj.customerId?._id || obj.customerId),
    customerName: obj.customerId?.name || "Unknown",
    salesOrderId: String(obj.salesOrderId?._id || obj.salesOrderId),
    poNumber: obj.salesOrderId?.poNumber || "Unknown",
  };
}

router.get("/schedules", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const schedules = await Schedule.find()
      .populate("customerId")
      .populate("salesOrderId")
      .sort({ fromTime: 1 });
    res.json(schedules.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/schedules", async (req, res): Promise<void> => {
  const parsed = CreateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const schedule = new Schedule(parsed.data);
    await schedule.save();
    const populated = await schedule.populate(["customerId", "salesOrderId"]);
    res.status(201).json(toApi(populated));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/schedules/:id", async (req, res): Promise<void> => {
  const parsed = UpdateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, parsed.data, { new: true })
      .populate(["customerId", "salesOrderId"]);
    if (!schedule) {
      res.status(404).json({ error: "Schedule not found" });
      return;
    }
    res.json(toApi(schedule));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.delete("/schedules/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      res.status(404).json({ error: "Schedule not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
