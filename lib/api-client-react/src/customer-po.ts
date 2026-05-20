import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerItem {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  gst?: string;
  pan?: string;
  createdAt?: string;
}

export interface SalesOrderItem {
  grade: string;
  quantity: number;
  rate: number;
  remainingQty?: number;
}

export interface SalesOrderRecord {
  id: string;
  poNumber: string;
  poDate: string;
  validity?: string;
  customerId: string;
  customerName?: string;
  siteAddress?: string;
  taxInclude?: boolean;
  gstPercent?: number;
  orderType?: string;
  salesPerson?: string;
  plant?: string;
  items?: SalesOrderItem[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface ScheduleRecord {
  id: string;
  customerId: string;
  customerName?: string;
  salesOrderId: string;
  poNumber?: string;
  plant: string;
  pump1: string;
  pump2?: string;
  fromTime: string;
  toTime?: string;
  isStrict: boolean;
  status: string;
  createdAt?: string;
}

export interface CreateScheduleData {
  customerId: string;
  salesOrderId: string;
  plant: string;
  pump1: string;
  pump2?: string;
  fromTime: string;
  toTime?: string;
  isStrict: boolean;
  status?: string;
}

export interface CreateSalesOrderData {
  poNumber: string;
  poDate: string;
  validity?: string;
  customerId: string;
  siteAddress?: string;
  taxInclude?: boolean;
  gstPercent?: number;
  orderType?: string;
  salesPerson?: string;
  plant?: string;
  items: SalesOrderItem[];
  totalAmount: number;
  status: string;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export const getSchedulesQueryKey = () => ["/api/schedules"];

export function useGetSchedules() {
  return useQuery<ScheduleRecord[], ErrorType<unknown>>({
    queryKey: getSchedulesQueryKey(),
    queryFn: () => customFetch<ScheduleRecord[]>("/api/schedules"),
  });
}

export function useCreateSchedule(options?: {
  mutation?: {
    onSuccess?: (data: ScheduleRecord) => void;
    onError?: (err: any) => void;
  };
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleData) =>
      customFetch<ScheduleRecord>("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getSchedulesQueryKey() });
      options?.mutation?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.mutation?.onError?.(err);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/schedules/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSchedulesQueryKey() });
    },
  });
}

export function useUpdateSchedule(options?: {
  mutation?: {
    onSuccess?: (data: ScheduleRecord) => void;
    onError?: (err: any) => void;
  };
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      customFetch<ScheduleRecord>(`/api/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getSchedulesQueryKey() });
      options?.mutation?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.mutation?.onError?.(err);
    },
  });
}

// ─── Quotations ───────────────────────────────────────────────────────────────

export interface QuotationRecord {
  id: string;
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
  items: {
    grade: string;
    quantity: number;
    rate: number;
    recipeCode?: string;
    cementType?: string;
  }[];
  createdBy?: string;
  createdAt?: string;
}

export const getQuotationsQueryKey = () => ["/api/quotations"];

export function useGetQuotations() {
  return useQuery<QuotationRecord[], ErrorType<unknown>>({
    queryKey: getQuotationsQueryKey(),
    queryFn: () => customFetch<QuotationRecord[]>("/api/quotations"),
  });
}

export function useCreateQuotation(options?: {
  mutation?: {
    onSuccess?: (data: QuotationRecord) => void;
    onError?: (err: any) => void;
  };
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      customFetch<QuotationRecord>("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getQuotationsQueryKey() });
      options?.mutation?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.mutation?.onError?.(err);
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customFetch(`/api/quotations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQuotationsQueryKey() });
    },
  });
}

