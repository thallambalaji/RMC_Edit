import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string; // Will store Customer ObjectId
  totalAmount: number;
  status: string;
  dueDate?: string;
  plant?: string;
  loadedPlant?: string;
  kmReading?: number;
  block?: string;
  site?: string;
  invoiceTime?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleNo?: string;
  pumpType?: string;
  grade?: string;
  loadedGrade?: string;
  loadedQuantity?: number;
  quantity?: number;
  netAmount?: number;
  netPrice?: number;
  pumpCharge?: number;
  transportCharge?: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  remark?: string;
  isBillReceived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
    dueDate: { type: String },
    plant: { type: String },
    loadedPlant: { type: String },
    kmReading: { type: Number },
    block: { type: String },
    site: { type: String },
    invoiceTime: { type: String },
    driverName: { type: String },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    vehicleNo: { type: String },
    pumpType: { type: String },
    grade: { type: String },
    loadedGrade: { type: String },
    loadedQuantity: { type: Number },
    quantity: { type: Number },
    netAmount: { type: Number },
    netPrice: { type: Number },
    pumpCharge: { type: Number },
    transportCharge: { type: Number },
    cgstRate: { type: Number },
    sgstRate: { type: Number },
    igstRate: { type: Number },
    remark: { type: String },
    isBillReceived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ invoiceDate: -1 });

export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
