import { Router, type IRouter } from "express";
import { connectMongo, Vehicle, Trip } from "@workspace/mongo-db";
import {
  CreateVehicleBody,
  UpdateVehicleBody,
  GetVehicleParams,
  UpdateVehicleParams,
  DeleteVehicleParams,
  CreateTripBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vehicles", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const vehicles = await Vehicle.find().sort({ createdAt: 1 });
    res.json(vehicles.map(v => ({ ...v.toObject(), id: String(v._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/vehicles", async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const vehicle = new Vehicle({
      ...parsed.data,
      vehicleType: req.body.vehicleType || "Own",
      vehicleCategory: req.body.vehicleCategory || "KM Basis",
      transporter: req.body.transporter || "N/A",
    });
    await vehicle.save();
    res.status(201).json({ ...vehicle.toObject(), id: String(vehicle._id) });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/vehicles/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.json({ ...vehicle.toObject(), id: String(vehicle._id) });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.put("/vehicles/:id", async (req, res): Promise<void> => {
  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const updateData = {
      ...parsed.data,
      vehicleType: req.body.vehicleType,
      vehicleCategory: req.body.vehicleCategory,
      transporter: req.body.transporter,
    };
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.json({ ...vehicle.toObject(), id: String(vehicle._id) });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.delete("/vehicles/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.get("/trips", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const trips = await Trip.find().populate("vehicleId").sort({ createdAt: -1 });
    res.json(trips.map(t => {
      const obj: any = t.toObject();
      return {
        ...obj,
        id: String(obj._id),
        vehicleId: String(obj.vehicleId?._id || obj.vehicleId),
        vehicleReg: obj.vehicleId?.registrationNo || "Unknown"
      };
    }));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const trip = new Trip(parsed.data);
    await trip.save();
    const populated = await trip.populate("vehicleId");
    const obj: any = populated.toObject();
    res.status(201).json({
      ...obj,
      id: String(obj._id),
      vehicleId: String(obj.vehicleId?._id || obj.vehicleId),
      vehicleReg: obj.vehicleId?.registrationNo || "Unknown"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==========================================
// DYNAMIC TRANSPORT SUB-MODULE SCHEMAS & CRUD
// ==========================================
import mongoose from "mongoose";

// 1. Driver Schema
const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNo: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, default: "active" }
}, { timestamps: true });
const Driver = mongoose.models.Driver || mongoose.model("Driver", DriverSchema);

// 2. Pump & DG Schema
const PumpDGSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // "Pump" | "DG"
  capacity: { type: String, required: true },
  status: { type: String, default: "active" }
}, { timestamps: true });
const PumpDG = mongoose.models.PumpDG || mongoose.model("PumpDG", PumpDGSchema);

// 3. Diesel Consumption Schema
const DieselConsumptionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  litres: { type: Number, required: true },
  amount: { type: Number, required: true },
  pumpOperator: { type: String, required: true }
}, { timestamps: true });
const DieselConsumption = mongoose.models.DieselConsumption || mongoose.model("DieselConsumption", DieselConsumptionSchema);

// 4. Security Check Schema
const SecurityCheckSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  driverName: { type: String, required: true },
  gatePassNo: { type: String, required: true },
  checkType: { type: String, required: true }, // "In" | "Out"
  status: { type: String, default: "verified" }
}, { timestamps: true });
const SecurityCheck = mongoose.models.SecurityCheck || mongoose.model("SecurityCheck", SecurityCheckSchema);

// 5. Transport Settings Schema
const TransportSettingSchema = new mongoose.Schema({
  plant: { type: String, required: true, unique: true },
  allowOverload: { type: Boolean, default: false },
  defaultFuelLimit: { type: Number, default: 200 }
}, { timestamps: true });
const TransportSetting = mongoose.models.TransportSetting || mongoose.model("TransportSetting", TransportSettingSchema);


// ---- Drivers Endpoints ----
router.get("/drivers", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const data = await Driver.find().sort({ createdAt: -1 });
    res.json(data.map(d => ({ ...d.toObject(), id: String(d._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/drivers", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const driver = new Driver(req.body);
    await driver.save();
    res.status(201).json({ ...driver.toObject(), id: String(driver._id) });
  } catch (error) {
    res.status(400).json({ error: "Failed to add driver" });
  }
});

router.delete("/drivers/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    await Driver.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});


// ---- Pump & DG Endpoints ----
router.get("/pump-dgs", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const data = await PumpDG.find().sort({ createdAt: -1 });
    res.json(data.map(p => ({ ...p.toObject(), id: String(p._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/pump-dgs", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const item = new PumpDG(req.body);
    await item.save();
    res.status(201).json({ ...item.toObject(), id: String(item._id) });
  } catch (error) {
    res.status(400).json({ error: "Failed to create Pump/DG entry" });
  }
});

router.delete("/pump-dgs/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    await PumpDG.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});


// ---- Diesel Consumption Endpoints ----
router.get("/diesel-consumptions", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const data = await DieselConsumption.find().sort({ createdAt: -1 });
    res.json(data.map(d => ({ ...d.toObject(), id: String(d._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/diesel-consumptions", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const item = new DieselConsumption(req.body);
    await item.save();
    res.status(201).json({ ...item.toObject(), id: String(item._id) });
  } catch (error) {
    res.status(400).json({ error: "Failed to record fuel entry" });
  }
});

router.delete("/diesel-consumptions/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    await DieselConsumption.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});


// ---- Security Check Endpoints ----
router.get("/security-checks", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const data = await SecurityCheck.find().sort({ createdAt: -1 });
    res.json(data.map(s => ({ ...s.toObject(), id: String(s._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/security-checks", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const item = new SecurityCheck(req.body);
    await item.save();
    res.status(201).json({ ...item.toObject(), id: String(item._id) });
  } catch (error) {
    res.status(400).json({ error: "Failed to save security record" });
  }
});

router.delete("/security-checks/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    await SecurityCheck.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});


// ---- Transport Settings Endpoints ----
router.get("/transport-settings", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const data = await TransportSetting.find().sort({ createdAt: 1 });
    res.json(data.map(s => ({ ...s.toObject(), id: String(s._id) })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/transport-settings", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const { plant, allowOverload, defaultFuelLimit } = req.body;
    const item = await TransportSetting.findOneAndUpdate(
      { plant },
      { allowOverload, defaultFuelLimit },
      { new: true, upsert: true }
    );
    res.json({ ...item.toObject(), id: String(item._id) });
  } catch (error) {
    res.status(400).json({ error: "Failed to update settings" });
  }
});

export default router;
