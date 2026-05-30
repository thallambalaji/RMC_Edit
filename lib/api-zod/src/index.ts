export * from "./generated/api";
export * from "./generated/dashboard";

import { z as zod } from "zod";

export const CreateQuotationBody = zod.object({
  quotationNo: zod.string(),
  date: zod.string(),
  customerName: zod.string(),
  customerPhone: zod.string(),
  customerEmail: zod.string().optional().nullable(),
  customerGstin: zod.string().optional().nullable(),
  siteAddress: zod.string(),
  paymentTerms: zod.string().optional().nullable(),
  pumpCharges: zod.number().optional().nullable(),
  minPumpQty: zod.number().optional().nullable(),
  marketingPerson: zod.string(),
  rateIncludeTax: zod.boolean(),
  notes: zod.array(zod.string()).optional(),
  items: zod.array(
    zod.object({
      grade: zod.string(),
      quantity: zod.number(),
      rate: zod.number(),
      recipeCode: zod.string().optional().nullable(),
      cementType: zod.string().optional().nullable(),
    }),
  ),
});



export const CreateScheduleBody = zod.object({
  customerId: zod.string(),
  salesOrderId: zod.string(),
  plant: zod.string(),
  pump1: zod.string(),
  pump2: zod.string().optional(),
  fromTime: zod.string(),
  toTime: zod.string().optional(),
  isStrict: zod.boolean().optional(),
  status: zod.string().optional(),
});

export const UpdateScheduleBody = zod.object({
  customerId: zod.string().optional(),
  salesOrderId: zod.string().optional(),
  plant: zod.string().optional(),
  pump1: zod.string().optional(),
  pump2: zod.string().optional(),
  fromTime: zod.string().optional(),
  toTime: zod.string().optional(),
  isStrict: zod.boolean().optional(),
  status: zod.string().optional(),
});
