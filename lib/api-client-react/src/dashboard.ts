import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseQueryResult, QueryKey } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";

import type { 
  PlantAccountsOverview,
  InvoiceOverview,
  DcOverview,
  InventoryOverview,
  AverageOverview,
  SchedulingOverview,
  PaymentFollowup,
  CurrentStock,
  DashboardStatsType,
  DashboardFilter
} from "@workspace/api-zod";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

const buildQueryString = (params?: DashboardFilter) => {
  const query = new URLSearchParams();
  if (params?.plant) query.append("plant", params.plant);
  if (params?.from) query.append("from", params.from);
  if (params?.to) query.append("to", params.to);
  if (params?.lastMonths) query.append("lastMonths", params.lastMonths.toString());
  const qString = query.toString();
  return qString ? `?${qString}` : "";
};

// 1. Accounts Overview
export const getDashboardAccountsOverview = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<PlantAccountsOverview[]>(`/api/dashboard/accounts-overview${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardAccountsOverview(params?: DashboardFilter, options?: any) {
  return useQuery<PlantAccountsOverview[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/accounts-overview", params], queryFn: () => getDashboardAccountsOverview(params), ...options });
}

// 2. Invoice Overview
export const getDashboardInvoiceOverview = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<InvoiceOverview[]>(`/api/dashboard/invoice-overview${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardInvoiceOverview(params?: DashboardFilter, options?: any) {
  return useQuery<InvoiceOverview[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/invoice-overview", params], queryFn: () => getDashboardInvoiceOverview(params), ...options });
}

// 3. DC Overview
export const getDashboardDcOverview = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<DcOverview[]>(`/api/dashboard/dc-overview${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardDcOverview(params?: DashboardFilter, options?: any) {
  return useQuery<DcOverview[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/dc-overview", params], queryFn: () => getDashboardDcOverview(params), ...options });
}

// 4. Inventory Overview
export const getDashboardInventoryOverview = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<InventoryOverview[]>(`/api/dashboard/inventory-overview${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardInventoryOverview(params?: DashboardFilter, options?: any) {
  return useQuery<InventoryOverview[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/inventory-overview", params], queryFn: () => getDashboardInventoryOverview(params), ...options });
}

// 5. Average Overview
export const getDashboardAverageOverview = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<AverageOverview[]>(`/api/dashboard/average-overview${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardAverageOverview(params?: DashboardFilter, options?: any) {
  return useQuery<AverageOverview[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/average-overview", params], queryFn: () => getDashboardAverageOverview(params), ...options });
}

// 6. Scheduling Overview
export const getDashboardSchedulingOverview = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<SchedulingOverview[]>(`/api/dashboard/scheduling-overview${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardSchedulingOverview(params?: DashboardFilter, options?: any) {
  return useQuery<SchedulingOverview[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/scheduling-overview", params], queryFn: () => getDashboardSchedulingOverview(params), ...options });
}

// 7. Payment Followup
export const getDashboardPaymentFollowup = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<PaymentFollowup[]>(`/api/dashboard/payment-followup${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardPaymentFollowup(params?: DashboardFilter, options?: any) {
  return useQuery<PaymentFollowup[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/payment-followup", params], queryFn: () => getDashboardPaymentFollowup(params), ...options });
}

// 8. Current Stock
export const getDashboardCurrentStock = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<CurrentStock[]>(`/api/dashboard/current-stock${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardCurrentStock(params?: DashboardFilter, options?: any) {
  return useQuery<CurrentStock[], ErrorType<unknown>>({ queryKey: ["/api/dashboard/current-stock", params], queryFn: () => getDashboardCurrentStock(params), ...options });
}

// 9. Stats
export const getDashboardStats = async (params?: DashboardFilter, options?: RequestInit) => 
  customFetch<DashboardStatsType>(`/api/dashboard/stats${buildQueryString(params)}`, { ...options, method: "GET" });

export function useDashboardStats(params?: DashboardFilter, options?: any) {
  return useQuery<DashboardStatsType, ErrorType<unknown>>({ queryKey: ["/api/dashboard/stats", params], queryFn: () => getDashboardStats(params), ...options });
}

// 10. Notifications
export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  href: string;
}

export const getNotifications = async (options?: RequestInit) => 
  customFetch<NotificationItem[]>(`/api/notifications`, { ...options, method: "GET" });

export function useNotifications(options?: any) {
  return useQuery<NotificationItem[], ErrorType<unknown>>({ 
    queryKey: ["/api/notifications"], 
    queryFn: () => getNotifications(),
    refetchInterval: 10000, // Poll every 10s for real-time notifications
    ...options 
  });
}

