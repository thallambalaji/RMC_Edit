import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface Master {
  id: number;
  type: string;
  name: string;
  createdAt: string;
}

export const getMastersQueryKey = (type?: string) => ["masters", type];

export const useGetMasters = (type?: string) => {
  return useQuery<Master[]>({
    queryKey: getMastersQueryKey(type),
    queryFn: () => customFetch(`/api/masters${type ? `?type=${type}` : ""}`),
  });
};

export const useCreateMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; name: string }) => 
      customFetch("/api/masters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getMastersQueryKey(variables.type) });
      queryClient.invalidateQueries({ queryKey: getMastersQueryKey() });
    },
  });
};

export const useDeleteMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => 
      customFetch(`/api/masters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters"] });
    },
  });
};
