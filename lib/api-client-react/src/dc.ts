import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface DeliveryChallanRecord {
  id: string;
  dcNumber: string;
  dcDate: string;
  dcTime?: string;
  plant: string;
  customerId: string;
  customerName?: string;
  siteId?: string;
  siteName?: string;
  vehicleId: string;
  vehicleReg?: string;
  driverName?: string;
  grade: string;
  quantity: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

export const getDCsQueryKey = () => ["/api/delivery-challans"];

export function useGetDCs() {
  return useQuery<DeliveryChallanRecord[]>({
    queryKey: getDCsQueryKey(),
    queryFn: () => customFetch<DeliveryChallanRecord[]>("/api/delivery-challans"),
  });
}

export function useCreateDC(options?: {
  mutation?: {
    onSuccess?: (data: DeliveryChallanRecord) => void;
    onError?: (err: any) => void;
  };
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      customFetch<DeliveryChallanRecord>("/api/delivery-challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getDCsQueryKey() });
      options?.mutation?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.mutation?.onError?.(err);
    },
  });
}
