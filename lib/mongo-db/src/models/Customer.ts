import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  legalName?: string;
  email?: string;
  contact: string;
  address?: string;
  gstNumber?: string;
  state?: string;
  businessGroup?: string;
  marketingPerson?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance?: number;
  contactPersonName?: string;
  contactPersonPhone?: string;
  sourceType?: string;
  designation?: string;
  plant?: string;
  siteName?: string;
  siteAddress?: string;
  creditTerms?: string;
  panNo?: string;
  location?: string;
  pinCode?: string;
  businessType?: string;
  isTcsEnabled?: boolean;
  isTdsEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    legalName: { type: String },
    email: { type: String },
    contact: { type: String, required: true },
    address: { type: String },
    gstNumber: { type: String },
    state: { type: String },
    businessGroup: { type: String },
    marketingPerson: { type: String },
    creditLimit: { type: Number },
    creditDays: { type: Number },
    openingBalance: { type: Number },
    contactPersonName: { type: String },
    contactPersonPhone: { type: String },
    sourceType: { type: String },
    designation: { type: String },
    plant: { type: String },
    siteName: { type: String },
    siteAddress: { type: String },
    creditTerms: { type: String },
    panNo: { type: String },
    location: { type: String },
    pinCode: { type: String },
    businessType: { type: String },
    isTcsEnabled: { type: Boolean },
    isTdsEnabled: { type: Boolean },
  },
  { timestamps: true }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
