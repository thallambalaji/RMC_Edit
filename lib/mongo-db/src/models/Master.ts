import mongoose, { Schema, Document } from "mongoose";

export interface IMaster extends Document {
  type: string; // 'source' | 'locality' | 'material'
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const MasterSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const Master = mongoose.models.Master || mongoose.model<IMaster>("Master", MasterSchema);
