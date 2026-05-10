import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrder extends Document {
  poNumber: string;
  poDate: string;
  customerId: string;
  totalQuantity: number;
  remainingQuantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema: Schema = new Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    poDate: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    totalQuantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
