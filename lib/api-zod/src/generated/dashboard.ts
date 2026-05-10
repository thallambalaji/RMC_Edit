import * as zod from "zod";

// 1. Today Accounts Overview
export const PlantAccountsOverviewItem = zod.object({
  plantName: zod.string(),
  todayInvoiceQty: zod.number(),
  todayDcQty: zod.number(),
  todaySalesDoc: zod.number(),
  monthInvoiceQty: zod.number(),
  monthDcQty: zod.number(),
  monthSalesDoc: zod.number(),
});
export type PlantAccountsOverview = zod.infer<typeof PlantAccountsOverviewItem>;

// 2. Invoice Overview
export const InvoiceOverviewItem = zod.object({
  customerName: zod.string(),
  grade: zod.string(),
  quantity: zod.number(),
  noOfInvoice: zod.number(),
  netAmount: zod.number(),
  plantName: zod.string(),
});
export type InvoiceOverview = zod.infer<typeof InvoiceOverviewItem>;

// 3. DC Overview
export const DcOverviewItem = zod.object({
  customerName: zod.string(),
  grade: zod.string(),
  quantity: zod.number(),
  noOfInvoice: zod.number(),
  netAmount: zod.number(),
  plantName: zod.string(),
});
export type DcOverview = zod.infer<typeof DcOverviewItem>;

// 4. Inventory Overview
export const InventoryOverviewItem = zod.object({
  item: zod.string(),
  supplier: zod.string(),
  emptyWeight: zod.number(),
  loadedWeight: zod.number(),
  netWeight: zod.number(),
  plantName: zod.string(),
});
export type InventoryOverview = zod.infer<typeof InventoryOverviewItem>;

// 5. Average Overview
export const AverageOverviewItem = zod.object({
  year: zod.number(),
  month: zod.string(),
  totalQuantity: zod.number(),
  totalLoadedQty: zod.number(),
  averageRate: zod.number(),
  plantName: zod.string(),
});
export type AverageOverview = zod.infer<typeof AverageOverviewItem>;

// 6. Scheduling Overview
export const SchedulingOverviewItem = zod.object({
  customerName: zod.string(),
  site: zod.string(),
  grade: zod.string(),
  quantity: zod.number(),
  startDateTime: zod.string(),
  endDateTime: zod.string(),
  plantName: zod.string(),
});
export type SchedulingOverview = zod.infer<typeof SchedulingOverviewItem>;

// 7. Payment Followup
export const PaymentFollowupItem = zod.object({
  customerName: zod.string(),
  nextFollowupDate: zod.string(),
  followupDescription: zod.string(),
});
export type PaymentFollowup = zod.infer<typeof PaymentFollowupItem>;

// 8. Current Stock
export const CurrentStockItem = zod.object({
  item: zod.string(),
  stock: zod.number(),
});
export type CurrentStock = zod.infer<typeof CurrentStockItem>;

// 9. Dashboard Stats / Counters
export const DashboardStats = zod.object({
  pendingQuotationCount: zod.number(),
  pendingSupplierPoCount: zod.number(),
  pendingSchedulingPoCount: zod.number(),
  cubeTest7DaysPending: zod.number(),
  cubeTest28DaysPending: zod.number(),
  cubeTestPendingForNewCast: zod.number(),
});
export type DashboardStatsType = zod.infer<typeof DashboardStats>;

// Filter schemas
export const DashboardFilterQuery = zod.object({
  plant: zod.string().optional(),
  from: zod.string().optional(),
  to: zod.string().optional(),
  lastMonths: zod.coerce.number().optional(),
});
export type DashboardFilter = zod.infer<typeof DashboardFilterQuery>;
