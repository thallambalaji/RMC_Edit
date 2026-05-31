import mongoose, { Schema, Document } from "mongoose";

export interface IStoreInventory extends Document {
  plant: string;
  inventoryNo: string;
  supplierName: string;
  itemName: string;
  billNo: string;
  amount: number;
  inventoryDate: string;
  inventoryTime: string;
  gatepassNo?: string;
  royaltyNo?: string;
  unit: string;
  deliveryAddress: string;
  vehicleNo: string;
  loadedWeight: number;
  emptyWeight: number;
  netWeight: number;
  supplierWeight: number;
  weightDifference: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreInventorySchema: Schema = new Schema(
  {
    plant: { type: String, required: true },
    inventoryNo: { type: String, required: true, unique: true },
    supplierName: { type: String, required: true },
    itemName: { type: String, required: true },
    billNo: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    inventoryDate: { type: String, required: true },
    inventoryTime: { type: String, required: true },
    gatepassNo: { type: String },
    royaltyNo: { type: String },
    unit: { type: String, required: true, default: "KG" },
    deliveryAddress: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    loadedWeight: { type: Number, required: true, default: 0 },
    emptyWeight: { type: Number, required: true, default: 0 },
    netWeight: { type: Number, required: true, default: 0 },
    supplierWeight: { type: Number, required: true, default: 0 },
    weightDifference: { type: Number, required: true, default: 0 },
    createdBy: { type: String, default: "Super Admin" },
  },
  { timestamps: true }
);

export const StoreInventory = mongoose.models.StoreInventory || mongoose.model<IStoreInventory>("StoreInventory", StoreInventorySchema);
