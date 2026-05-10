import mongoose, { Schema, Document } from "mongoose";

export interface IWeighmentTicket extends Document {
  ticketNo: string;
  plant: string;
  vehicleNo: string;
  weightType: string;
  weight: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeighmentTicketSchema: Schema = new Schema(
  {
    ticketNo: { type: String, required: true, unique: true },
    plant: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    weightType: { type: String, required: true },
    weight: { type: Number, required: true },
    createdBy: { type: String, default: "Super Admin" },
  },
  { timestamps: true }
);

export const WeighmentTicket = mongoose.models.WeighmentTicket || mongoose.model<IWeighmentTicket>("WeighmentTicket", WeighmentTicketSchema);
