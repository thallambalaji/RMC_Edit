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

// Sales Enquiry
export interface ISalesEnquiryRequirement {
  projectName: string;
  locality: string;
  sourceOfLead: string;
  materialType: string;
  paymentTerms: string;
  estimatedRate?: number;
  constructionStage: string;
  estimatedQty: number;
  unit: string;
  projectAddress: string;
}

export interface ISalesEnquiry extends Document {
  enquiryId: string;
  contactPerson: string;
  mobile: string;
  altNumber?: string;
  email?: string;
  companyName?: string;
  designation: string;
  customerAddress: string;
  requirements: ISalesEnquiryRequirement[];
  createdBy?: string;
  followedBy?: string;
  status?: string;
}

const SalesEnquirySchema = new Schema({
  enquiryId: { type: String, required: true, unique: true },
  contactPerson: { type: String, required: true },
  mobile: { type: String, required: true },
  altNumber: { type: String },
  email: { type: String },
  companyName: { type: String },
  designation: { type: String, required: true },
  customerAddress: { type: String, required: true },
  requirements: [{
    projectName: { type: String, required: true },
    locality: { type: String, required: true },
    sourceOfLead: { type: String, required: true },
    materialType: { type: String, required: true },
    paymentTerms: { type: String, required: true },
    estimatedRate: { type: Number },
    constructionStage: { type: String, required: true },
    estimatedQty: { type: Number, required: true },
    unit: { type: String, required: true },
    projectAddress: { type: String, required: true }
  }],
  createdBy: { type: String, default: "Admin" },
  followedBy: { type: String, default: "Not Assigned" },
  status: { type: String, default: "pending" }
}, { timestamps: true });

export const SalesEnquiry = mongoose.models.SalesEnquiry || mongoose.model<ISalesEnquiry>("SalesEnquiry", SalesEnquirySchema);

// Payment FollowUp
export interface IPaymentFollowUp extends Document {
  followupId: string;
  customerId: mongoose.Types.ObjectId;
  followupDate: string;
  followupTime: string;
  status: string;
  nextDate?: string;
  nextTime?: string;
  description?: string;
  createdBy?: string;
}

const PaymentFollowUpSchema = new Schema({
  followupId: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  followupDate: { type: String, required: true },
  followupTime: { type: String, required: true },
  status: { type: String, required: true },
  nextDate: { type: String },
  nextTime: { type: String },
  description: { type: String },
  createdBy: { type: String, default: "Admin" }
}, { timestamps: true });

export const PaymentFollowUp = mongoose.models.PaymentFollowUp || mongoose.model<IPaymentFollowUp>("PaymentFollowUp", PaymentFollowUpSchema);

// Quotation Item Interface
export interface IQuotationItem {
  grade: string;
  quantity: number;
  rate: number;
  recipeCode?: string;
  cementType?: string;
}

// Quotation Interface
export interface IQuotation extends Document {
  quotationNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerGstin?: string;
  siteAddress: string;
  paymentTerms?: string;
  pumpCharges?: number;
  minPumpQty?: number;
  marketingPerson: string;
  rateIncludeTax: boolean;
  notes?: string[];
  items: IQuotationItem[];
  createdBy?: string;
}

const QuotationSchema = new Schema({
  quotationNo: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  customerGstin: { type: String },
  siteAddress: { type: String, required: true },
  paymentTerms: { type: String },
  pumpCharges: { type: Number },
  minPumpQty: { type: Number },
  marketingPerson: { type: String, required: true },
  rateIncludeTax: { type: Boolean, default: true },
  notes: [{ type: String }],
  items: [{
    grade: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    recipeCode: { type: String },
    cementType: { type: String, default: "OPC" }
  }],
  createdBy: { type: String, default: "Admin" }
}, { timestamps: true });

export const Quotation = mongoose.models.Quotation || mongoose.model<IQuotation>("Quotation", QuotationSchema);
