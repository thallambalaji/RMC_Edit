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
    const vehicle = new Vehicle(parsed.data);
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
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
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

export default router;
