import mongoose, { Schema, Document } from "mongoose";

export interface IStoreInventoryHistory extends Document {
  inventoryNo: string;
  modifiedTime: Date;
  modificationType: string; // "create" | "update" | "delete"
  modifiedBy: string;
  comment: string;
  oldData: any;
  newData: any;
  createdAt: Date;
  updatedAt: Date;
}

const StoreInventoryHistorySchema: Schema = new Schema(
  {
    inventoryNo: { type: String, required: true },
    modifiedTime: { type: Date, default: Date.now },
    modificationType: { type: String, required: true, enum: ["create", "update", "delete"] },
    modifiedBy: { type: String, default: "Super Admin" },
    comment: { type: String, default: "Inventory Updated" },
    oldData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const StoreInventoryHistory = mongoose.models.StoreInventoryHistory || mongoose.model<IStoreInventoryHistory>("StoreInventoryHistory", StoreInventoryHistorySchema);
