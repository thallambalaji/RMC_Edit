import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Document {
  registrationNo: string;
  model: string;
  capacity: number;
  status: string;
  driverName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    registrationNo: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, default: "available" },
    driverName: { type: String },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);

export interface ITrip extends Document {
  tripDate: string;
  vehicleId: string;
  destination: string;
  loadQty: number;
  status: string;
  driverName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema = new Schema(
  {
    tripDate: { type: String, required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    destination: { type: String, required: true },
    loadQty: { type: Number, required: true },
    status: { type: String, default: "scheduled" },
    driverName: { type: String },
  },
  { timestamps: true }
);

export const Trip = mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);
