import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Flame, Calendar, DollarSign, User } from "lucide-react";

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
}

export default function AddDiesel() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [litres, setLitres] = useState("");
  const [amount, setAmount] = useState("");
  const [pumpOperator, setPumpOperator] = useState("");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
          if (data.length > 0) setVehicleNo(data[0].registrationNo);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !vehicleNo || !litres || !amount || !pumpOperator) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/diesel-consumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          vehicleNo,
          litres: Number(litres),
          amount: Number(amount),
          pumpOperator: pumpOperator.trim(),
        }),
      });

      if (res.ok) {
        toast({
          title: "Fuel Entry Logged",
          description: "Diesel consumption successfully recorded in database.",
        });
        setLitres("");
        setAmount("");
        setPumpOperator("");
      } else {
        toast({
          title: "Error",
          description: "Failed to record fuel log.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Diesel Consumption" }, { label: "Log Consumption" }]}
      title="LOG DIESEL CONSUMPTION"
      activePath="/transport/diesel/new"
    >
      <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden border-t-4 border-blue-600">
          <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
            <Flame className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Record Diesel Consumption</h3>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Fueling Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="pl-9 h-10 text-xs font-semibold border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Select Vehicle *</Label>
                  <select
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id || v._id} value={v.registrationNo}>
                        {v.registrationNo}
                      </option>
                    ))}
                    {vehicles.length === 0 && (
                      <option value="">No Vehicles Registered</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Quantity (Litres) *</Label>
                  <div className="relative">
                    <Flame className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={litres}
                      onChange={(e) => setLitres(e.target.value)}
                      placeholder="e.g. 120.5"
                      className="pl-9 h-10 text-xs font-semibold border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Total Amount (₹) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 11500"
                      className="pl-9 h-10 text-xs font-semibold border-slate-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">Pump Operator / Authorized By *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={pumpOperator}
                    onChange={(e) => setPumpOperator(e.target.value)}
                    placeholder="Enter operator name or slip number"
                    className="pl-9 h-10 text-xs font-semibold border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="submit"
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Log fuel slip
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
