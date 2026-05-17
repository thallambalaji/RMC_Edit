import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Zap, Activity } from "lucide-react";

export default function AddPumpDg() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState("Pump");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !capacity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/pump-dgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          capacity: capacity.trim(),
          status,
        }),
      });

      if (res.ok) {
        toast({
          title: "Asset Registered",
          description: "Pump/DG asset registered successfully.",
        });
        setName("");
        setCapacity("");
        setStatus("active");
      } else {
        toast({
          title: "Error",
          description: "Failed to register Pump/DG.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Pump&DG" }, { label: "Add Pump & DG" }]}
      title="REGISTER NEW PUMP & DG"
      activePath="/transport/pump-dg/new"
    >
      <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden border-t-4 border-blue-600">
          <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Register New Pump & DG Asset</h3>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">Equipment Name / Code *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Schwing Stetter BP350 Concrete Pump"
                  className="h-10 text-xs font-semibold border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Equipment Type</Label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Pump">Concrete Pump</option>
                    <option value="DG">DG Generator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Output Capacity *</Label>
                  <Input
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 35 m³/hr or 125 kVA"
                    className="h-10 text-xs font-semibold border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">Operational Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">Active Operational</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="idle">Idle / Standby</option>
                </select>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="submit"
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Register Asset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
