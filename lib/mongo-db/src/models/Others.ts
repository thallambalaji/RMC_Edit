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

// Mix Design
export interface IMixDesign extends Document {
  recipeCode: string;
  recipeName: string;
  grade: string;
  aggr1: string;
  aggr2: string;
  aggr3: string;
  aggr4: string;
  cem1: string;
  cem2: string;
  cem3: string;
  water: string;
  admix1: string;
  admix2: string;
}

const MixDesignSchema = new Schema({
  recipeCode: { type: String, required: true, unique: true },
  recipeName: { type: String, required: true },
  grade: { type: String, required: true },
  aggr1: { type: String },
  aggr2: { type: String },
  aggr3: { type: String },
  aggr4: { type: String },
  cem1: { type: String },
  cem2: { type: String },
  cem3: { type: String },
  water: { type: String },
  admix1: { type: String },
  admix2: { type: String },
}, { timestamps: true });

export const MixDesign = mongoose.models.MixDesign || mongoose.model<IMixDesign>("MixDesign", MixDesignSchema);

// Recipe
export interface IRecipeIngredient {
  sl: number;
  type: string;
  product: string;
  qty: string;
}

export interface IRecipe extends Document {
  customer: string;
  siteName: string;
  grade: string;
  recipeCode: string;
  plant: string;
  cementName: string;
  slump: string;
  ingredients: IRecipeIngredient[];
  totalDensity: number;
}

const RecipeSchema = new Schema({
  customer: { type: String, required: true },
  siteName: { type: String, required: true },
  grade: { type: String, required: true },
  recipeCode: { type: String, required: true },
  plant: { type: String, default: "FORTUNE CONCRETE" },
  cementName: { type: String },
  slump: { type: String, default: "100+/-20" },
  ingredients: { type: [Schema.Types.Mixed], default: [] },
  totalDensity: { type: Number }
}, { timestamps: true, strict: false });

export const Recipe = mongoose.models.FinalRecipe || mongoose.model<IRecipe>("FinalRecipe", RecipeSchema);

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

// Cube Entry (For Add Cube Test)
export interface ICubeResult {
  cubeId: string;
  testingDays: string; // 7 or 28
  supplyDate: string;
  cube1Mass: string;
  cube1Load: string;
  cube2Mass: string;
  cube2Load: string;
  cube3Mass: string;
  cube3Load: string;
}

export interface ICubeEntry extends Document {
  testNo: string;
  plant: string;
  noOfCasting: number;
  customerName: string;
  siteName: string;
  grade: string;
  cubeDimension: string;
  description?: string;
  results: ICubeResult[];
}

const CubeEntrySchema = new Schema({
  testNo: { type: String, required: true, unique: true },
  plant: { type: String, required: true, default: "FORTUNE CONCRETE" },
  noOfCasting: { type: Number, required: true },
  customerName: { type: String, required: true },
  siteName: { type: String, required: true },
  grade: { type: String, required: true },
  cubeDimension: { type: String, required: true, default: "150 X 150 X 150" },
  description: { type: String },
  results: [{
    cubeId: String,
    testingDays: String,
    supplyDate: String,
    cube1Mass: String,
    cube1Load: String,
    cube2Mass: String,
    cube2Load: String,
    cube3Mass: String,
    cube3Load: String,
  }]
}, { timestamps: true });

export const CubeEntry = mongoose.models.CubeEntry || mongoose.model<ICubeEntry>("CubeEntry", CubeEntrySchema);

// Batch Entry (For Batching List)
export interface IBatchEntry extends Document {
  batchNo: string;
  date: string;
  customerName: string;
  siteName: string;
  grade: string;
  quantity: number;
  batchedQty: number;
  vehicleNo: string;
  plant: string;
}

const BatchEntrySchema = new Schema({
  batchNo: { type: String, required: true },
  date: { type: String, required: true },
  customerName: { type: String, required: true },
  siteName: { type: String, required: true },
  grade: { type: String, required: true },
  quantity: { type: Number, required: true },
  batchedQty: { type: Number, required: true },
  vehicleNo: { type: String, required: true },
  plant: { type: String, default: "FORTUNE CONCRETE" },
}, { timestamps: true });

export const BatchEntry = mongoose.models.BatchEntry || mongoose.model<IBatchEntry>("BatchEntry", BatchEntrySchema);

// Moisture Setting Interface
export interface IMoistureSetting extends Document {
  plant: string;
  moisture20mm: number;
  moisture10mm: number;
  moistureMSand: number;
  moistureRSand: number;
}
const MoistureSettingSchema = new Schema({
  plant: { type: String, required: true, unique: true },
  moisture20mm: { type: Number, default: 0 },
  moisture10mm: { type: Number, default: 0 },
  moistureMSand: { type: Number, default: 0 },
  moistureRSand: { type: Number, default: 0 },
}, { timestamps: true });
export const MoistureSetting = mongoose.models.MoistureSetting || mongoose.model<IMoistureSetting>("MoistureSetting", MoistureSettingSchema);

// Cube Master Interface
export interface ICubeMaster extends Document {
  length: number;
  breadth: number;
  height: number;
  density: number;
  compStrength: number;
}
const CubeMasterSchema = new Schema({
  length: { type: Number, required: true },
  breadth: { type: Number, required: true },
  height: { type: Number, required: true },
  density: { type: Number, required: true },
  compStrength: { type: Number, required: true },
}, { timestamps: true });
export const CubeMaster = mongoose.models.CubeMaster || mongoose.model<ICubeMaster>("CubeMaster", CubeMasterSchema);

// Batch Item Matching Interface
export interface IBatchItemMatching extends Document {
  plant: string;
  storeItem: string;
  batchItemName: string;
}
const BatchItemMatchingSchema = new Schema({
  plant: { type: String, required: true },
  storeItem: { type: String, required: true },
  batchItemName: { type: String, required: true },
}, { timestamps: true });
export const BatchItemMatching = mongoose.models.BatchItemMatching || mongoose.model<IBatchItemMatching>("BatchItemMatching", BatchItemMatchingSchema);


