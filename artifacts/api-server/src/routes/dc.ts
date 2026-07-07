import { Router, type IRouter } from "express";
import { connectMongo, DeliveryChallan, Invoice, Vehicle } from "@workspace/mongo-db";
import { Types } from "mongoose";
import {
  CreateDeliveryChallanBody,
  UpdateDeliveryChallanBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(dc: any) {
  try {
    const obj = dc.toObject ? dc.toObject() : dc;
    return {
      ...obj,
      id: String(obj._id || obj.id || ""),
      invoiceId: obj.invoiceId ? String(obj.invoiceId?._id || obj.invoiceId) : null,
      invoiceNumber: obj.invoiceId?.invoiceNumber || "N/A",
      vehicleId: obj.vehicleId ? String(obj.vehicleId?._id || obj.vehicleId) : null,
      vehicleReg: obj.vehicleId?.registrationNo || "Unknown",
      customerId: obj.customerId ? String(obj.customerId?._id || obj.customerId) : null,
      siteId: obj.siteId ? String(obj.siteId?._id || obj.siteId) : null,
    };
  } catch (e) {
    return dc;
  }
}

router.get("/delivery-challans", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const dcs = await DeliveryChallan.find()
      .populate("invoiceId")
      .populate("vehicleId")
      .populate("customerId")
      .sort({ createdAt: -1 });
    res.json(dcs.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/delivery-challans", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryChallanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const rawData = parsed.data;
    
    // Normalize IDs
    const data: any = { ...rawData };
    
    if (rawData.customerid && Types.ObjectId.isValid(String(rawData.customerid))) {
      data.customerId = new Types.ObjectId(String(rawData.customerid));
    } else if (!data.customerId) {
       res.status(400).json({ error: "Valid Customer ID is required" });
       return;
    }
    delete data.customerid;

    if (rawData.vehicleid && Types.ObjectId.isValid(String(rawData.vehicleid))) {
      data.vehicleId = new Types.ObjectId(String(rawData.vehicleid));
    } else if (!data.vehicleId) {
      res.status(400).json({ error: "Valid Vehicle ID is required" });
      return;
    }
    delete data.vehicleid;

    if (rawData.invoiceid && Types.ObjectId.isValid(String(rawData.invoiceid))) {
      data.invoiceId = new Types.ObjectId(String(rawData.invoiceid));
    }
    delete data.invoiceid;

    if (rawData.siteId && Types.ObjectId.isValid(String(rawData.siteId))) {
      data.siteId = new Types.ObjectId(String(rawData.siteId));
    }

    const dc = new DeliveryChallan(data);
    await dc.save();
    const populated = await dc.populate(["invoiceId", "vehicleId", "customerId"]);
    res.status(201).json(toApi(populated));
  } catch (error: any) {
    console.error("Failed to save DC:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

router.get("/delivery-challans/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const dc = await DeliveryChallan.findById(req.params.id)
      .populate("invoiceId")
      .populate("vehicleId")
      .populate("customerId");
    if (!dc) {
      res.status(404).json({ error: "Delivery challan not found" });
      return;
    }
    res.json(toApi(dc));
  } catch (error) {
    res.status(400).json({ error: "Invalid DC ID" });
  }
});

router.put("/delivery-challans/:id", async (req, res): Promise<void> => {
  const parsed = UpdateDeliveryChallanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const dc = await DeliveryChallan.findByIdAndUpdate(req.params.id, parsed.data, { new: true })
      .populate("invoiceId")
      .populate("vehicleId")
      .populate("customerId");
    if (!dc) {
      res.status(404).json({ error: "Delivery challan not found" });
      return;
    }
    res.json(toApi(dc));
  } catch (error) {
    res.status(400).json({ error: "Invalid DC ID" });
  }
});

router.delete("/delivery-challans/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const dc = await DeliveryChallan.findByIdAndDelete(req.params.id);
    if (!dc) {
      res.status(404).json({ error: "Delivery challan not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid DC ID" });
  }
});

export default router;
