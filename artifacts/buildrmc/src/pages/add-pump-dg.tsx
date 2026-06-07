import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { useRoute, useLocation } from "wouter";

export default function AddPumpDg() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/transport/pump-dg/edit/:id");
  const assetId = match ? params.id : null;

  const [name, setName] = useState("");
  const [type, setType] = useState("Pump");

  useEffect(() => {
    if (assetId) {
      const fetchAsset = async () => {
        try {
          const res = await fetch(`/api/pump-dgs/${assetId}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setName(data.name || "");
            setType(data.type || "Pump");
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchAsset();
    }
  }, [assetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Pump or DG Name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = assetId ? `/api/pump-dgs/${assetId}` : "/api/pump-dgs";
      const method = assetId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          capacity: "N/A",
          status: "active",
        }),
      });

      if (res.ok) {
        toast({
          title: assetId ? "Asset Updated" : "Asset Registered",
          description: assetId ? "Asset details updated successfully." : "Pump/DG asset registered successfully.",
        });
        setLocation("/transport/pump-dg/list");
      } else {
        toast({
          title: "Error",
          description: "Failed to save asset details.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Pump&DG", href: "/transport/pump-dg/list" }, { label: assetId ? "Edit Pump & DG" : "Add Pump & DG" }]}
      title={assetId ? "EDIT PUMP & DG DETAILS" : "REGISTER NEW PUMP & DG"}
      activePath={assetId ? `/transport/pump-dg/edit/${assetId}` : "/transport/pump-dg/new"}
    >
      <div className="w-full py-8 px-8 bg-white min-h-[calc(100vh-140px)] flex flex-col rounded-lg border shadow-sm justify-center items-center">
        {/* Simplified Form Container */}
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg">
          <h2 className="text-center font-bold text-[#0f766e] text-2xl mb-6 tracking-wide">
            {assetId ? "Edit Pump & DG Details" : "Enter Pump & DG Details"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Equipment Type */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">
                Type :
              </Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
              >
                <option value="Pump">Pump</option>
                <option value="DG">DG</option>
              </select>
            </div>

            {/* Equipment Name */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">
                Pump or DG Name :
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Pump or DG Name.."
                className="h-10 text-xs font-medium border-slate-200 focus:border-[#ea580c] focus:ring-[#ea580c] rounded"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-[#ea580c] hover:bg-[#d97706] text-white font-bold text-xs h-9 px-4 rounded transition-all active:scale-95 border-0 shadow-sm"
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={() => setLocation("/transport/pump-dg/list")}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-slate-200 font-bold text-xs h-9 px-4 rounded transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </TransportLayout>
  );
}
