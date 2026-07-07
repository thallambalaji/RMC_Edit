import { StoreLayout } from "@/components/store-layout";

export default function AssetsMaster() {
  return (
    <StoreLayout title="Asset's Master" breadcrumbs={[{ label: "Asset's Master" }]} showFilterButton={false}> 
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Asset's Master</h3>
        <p className="mt-2 text-sm text-slate-600">
          Manage assets and master data used for store inventory tracking.
        </p>
      </div>
    </StoreLayout>
  );
}
