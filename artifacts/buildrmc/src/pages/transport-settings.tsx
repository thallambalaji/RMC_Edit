import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Settings, ShieldAlert, Fuel } from "lucide-react";

export default function TransportSettings() {
  const { toast } = useToast();
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [allowOverload, setAllowOverload] = useState(false);
  const [defaultFuelLimit, setDefaultFuelLimit] = useState("200");
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transport-settings");
      if (res.ok) {
        const data = await res.json();
        // find setting for plant
        const current = data.find((d: any) => d.plant === plant);
        if (current) {
          setAllowOverload(current.allowOverload);
          setDefaultFuelLimit(String(current.defaultFuelLimit));
        } else {
          setAllowOverload(false);
          setDefaultFuelLimit("200");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [plant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/transport-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant,
          allowOverload,
          defaultFuelLimit: Number(defaultFuelLimit),
        }),
      });

      if (res.ok) {
        toast({
          title: "Settings Saved",
          description: `Transport configurations for ${plant} updated successfully in database.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update configurations.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Setting" }, { label: "Transport Setting" }]}
      title="TRANSPORT SETTING"
      activePath="/transport/settings"
    >
      <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden border-t-4 border-blue-600">
          <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Configure Transport Settings</h3>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">RMC Plant Name</Label>
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="FORTUNE CONCRETE">FORTUNE CONCRETE</option>
                  <option value="NAVAL RMC">NAVAL RMC</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg bg-slate-50/50">
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <Label className="text-xs font-black uppercase text-slate-800">Allow Vehicle Overload</Label>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500">
                    If enabled, transit mixers can load concrete volume slightly exceeding their rated nominal volume capacity.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowOverload}
                  onChange={(e) => setAllowOverload(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4 text-blue-600" />
                  <Label className="text-xs font-black uppercase text-slate-700">Default Fuel Refuel Limit (Litres)</Label>
                </div>
                <Input
                  type="number"
                  value={defaultFuelLimit}
                  onChange={(e) => setDefaultFuelLimit(e.target.value)}
                  placeholder="e.g. 200"
                  className="h-10 text-xs font-semibold border-slate-300"
                  required
                />
                <p className="text-[9px] font-semibold text-slate-400">
                  Sets the default safety fuel capacity cap for standard transit mixers fueling slip validations.
                </p>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  {loading ? "Loading..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
