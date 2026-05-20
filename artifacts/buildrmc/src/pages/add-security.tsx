import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { ShieldCheck, Calendar, Clock, Truck, User, FileText } from "lucide-react";

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
  driverName?: string;
}

export default function AddSecurityCheck() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [gatePassNo, setGatePassNo] = useState("");
  const [checkType, setCheckType] = useState("In");
  const [status, setStatus] = useState("verified");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
          if (data.length > 0) {
            setVehicleNo(data[0].registrationNo);
            setDriverName(data[0].driverName || "");
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchVehicles();
  }, []);

  const handleVehicleChange = (val: string) => {
    setVehicleNo(val);
    const selected = vehicles.find((v) => v.registrationNo === val);
    if (selected) {
      setDriverName(selected.driverName || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !vehicleNo || !driverName || !gatePassNo) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/security-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          vehicleNo,
          driverName: driverName.trim(),
          gatePassNo: gatePassNo.toUpperCase().trim(),
          checkType,
          status,
        }),
      });

      if (res.ok) {
        toast({
          title: "Gate Log Saved",
          description: `Gate security check log saved successfully.`,
        });
        setGatePassNo("");
      } else {
        toast({
          title: "Error",
          description: "Failed to save gate security log.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Security" }, { label: "Security Check" }]}
      title="GATE SECURITY LOG ENTRY"
      activePath="/transport/security/new"
    >
      <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden border-t-4 border-blue-600">
          <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Record Gate Security Log</h3>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Check Date *</Label>
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
                  <Label className="text-xs font-black uppercase text-slate-700">Check Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="pl-9 h-10 text-xs font-semibold border-slate-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Select Vehicle *</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      value={vehicleNo}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Driver Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Suresh Kumar"
                      className="pl-9 h-10 text-xs font-semibold border-slate-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Gate Pass / Slip Number *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={gatePassNo}
                      onChange={(e) => setGatePassNo(e.target.value)}
                      placeholder="e.g. GP-2026-980"
                      className="pl-9 h-10 text-xs font-semibold border-slate-300 uppercase"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Security Check Type</Label>
                  <select
                    value={checkType}
                    onChange={(e) => setCheckType(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="In">Gate Entry (IN)</option>
                    <option value="Out">Gate Exit (OUT)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">Verification Check status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="verified">Verified & Clear</option>
                  <option value="hold">Hold / Under Inspection</option>
                  <option value="violation">Violation Logged</option>
                </select>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="submit"
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Log gate pass
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
