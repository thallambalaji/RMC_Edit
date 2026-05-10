import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryChallan extends Document {
  dcNumber: string;
  dcDate: string;
  dcTime?: string;
  plant: string;
  customerId: string;
  siteId?: string;
  siteName?: string;
  vehicleId: string;
  driverName?: string;
  grade: string;
  quantity: number;
  netAmount: number;
  cementName?: string;
  cementGrade?: string;
  pumpType?: string;
  slump?: number;
  wcRatio?: number;
  admixture?: string;
  waitingTime?: number;
  loadedPlant?: string;
  loadedQuantity?: number;
  loadedGrade?: string;
  transportCharge?: number;
  pumpCharge?: number;
  status: string;
  destination?: string;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryChallanSchema: Schema = new Schema(
  {
    dcNumber: { type: String, required: true, unique: true },
    dcDate: { type: String, required: true },
    dcTime: { type: String },
    plant: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    siteId: { type: Schema.Types.ObjectId, ref: "Master" },
    siteName: { type: String },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    driverName: { type: String },
    grade: { type: String, required: true },
    quantity: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    cementName: { type: String },
    cementGrade: { type: String },
    pumpType: { type: String },
    slump: { type: Number },
    wcRatio: { type: Number },
    admixture: { type: String },
    waitingTime: { type: Number },
    loadedPlant: { type: String },
    loadedQuantity: { type: Number },
    loadedGrade: { type: String },
    transportCharge: { type: Number },
    pumpCharge: { type: Number },
    status: { type: String, default: "pending" },
    destination: { type: String },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
  },
  { timestamps: true }
);

export const DeliveryChallan = mongoose.models.DeliveryChallan || mongoose.model<IDeliveryChallan>("DeliveryChallan", DeliveryChallanSchema);
