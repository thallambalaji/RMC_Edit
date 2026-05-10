import mongoose, { Schema, Document } from "mongoose";

// Sales Order Item
export interface ISalesOrderItem {
  grade: string;
  quantity: number;
  rate: number;
  remainingQty: number;
}

// Sales Order
export interface ISalesOrder extends Document {
  poNumber: string;
  poDate: string;
  validity?: string;
  customerId: string;
  siteAddress?: string;
  taxInclude: boolean;
  gstPercent: number;
  orderType: string;
  salesPerson?: string;
  plant: string;
  items: ISalesOrderItem[];
  status: string;
}

const SalesOrderSchema = new Schema({
  poNumber: { type: String, required: true, unique: true },
  poDate: { type: String, required: true },
  validity: { type: String },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  siteAddress: { type: String },
  taxInclude: { type: Boolean, default: true },
  gstPercent: { type: Number, default: 18 },
  orderType: { type: String, default: "open" },
  salesPerson: { type: String },
  plant: { type: String, default: "All Plant" },
  items: [{
    grade: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    remainingQty: { type: Number }
  }],
  status: { type: String, default: "pending" },
}, { timestamps: true });

export const SalesOrder = mongoose.models.SalesOrder || mongoose.model<ISalesOrder>("SalesOrder", SalesOrderSchema);

// QC Test
export interface IQCTest extends Document {
  testDate: string;
  invoiceId: string;
  grade: string;
  slump: number;
  strength7Days: number;
  strength28Days: number;
  status: string;
}
const QCTestSchema = new Schema({
  testDate: { type: String, required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
  grade: { type: String },
  slump: { type: Number },
  strength7Days: { type: Number },
  strength28Days: { type: Number },
  status: { type: String, default: "completed" },
}, { timestamps: true });
export const QCTest = mongoose.models.QCTest || mongoose.model<IQCTest>("QCTest", QCTestSchema);

// Account & Ledger
export interface IAccount extends Document {
  code: string;
  name: string;
  type: string;
  balance: number;
}
const AccountSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  balance: { type: Number, default: 0 },
}, { timestamps: true });
export const Account = mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema);

// Product / Store
export interface IProduct extends Document {
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  minQty: number;
}
const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String },
  unit: { type: String },
  stockQty: { type: Number, default: 0 },
  minQty: { type: Number, default: 0 },
}, { timestamps: true });
export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

// HRM (Employee, Attendance)
export interface IEmployee extends Document {
  empCode: string;
  name: string;
  designation: string;
  salary: number;
}
const EmployeeSchema = new Schema({
  empCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  designation: { type: String },
  salary: { type: Number },
}, { timestamps: true });
export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);

// Scheduling
export interface ISchedule extends Document {
  customerId: string;
  salesOrderId: string;
  plant: string;
  pump1: string;
  pump2?: string;
  fromTime: string;
  toTime?: string;
  isStrict: boolean;
  status: string;
}

const ScheduleSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  salesOrderId: { type: Schema.Types.ObjectId, ref: "SalesOrder", required: true },
  plant: { type: String, required: true },
  pump1: { type: String, required: true },
  pump2: { type: String },
  fromTime: { type: String, required: true },
  toTime: { type: String },
  isStrict: { type: Boolean, default: false },
  status: { type: String, default: "scheduled" },
}, { timestamps: true });

export const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);
