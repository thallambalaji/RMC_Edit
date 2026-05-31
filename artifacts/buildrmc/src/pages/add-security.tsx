import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Link, useLocation } from "wouter";
import { Calendar, Clock, Truck, User } from "lucide-react";

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
  driverName?: string;
}

export default function AddSecurityCheck() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [plant, setPlant] = useState("");
  const [plants, setPlants] = useState<any[]>([]);
  const [gatePassing, setGatePassing] = useState("Entry");
  const [gateNo, setGateNo] = useState("1");
  const [typeOfMovement, setTypeOfMovement] = useState("Sales");
  
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState(getLocalTimeString());
  const [loading, setLoading] = useState(false);

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

    const fetchPlants = async () => {
      try {
        const res = await fetch("/api/masters?type=plant");
        if (res.ok) {
          const data = await res.json();
          setPlants(data);
          if (data.length > 0) {
            setPlant(data[0].name);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlants();
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

    if (!plant || !gatePassing || !gateNo || !typeOfMovement || !date || !time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields marked with an asterisk (*).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/security-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant,
          gatePassing,
          gateNo,
          typeOfMovement,
          date,
          time,
          vehicleNo: vehicleNo || "N/A",
          driverName: driverName.trim() || "N/A",
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Security check record saved successfully.",
        });
        setLocation("/transport/security/list");
      } else {
        toast({
          title: "Error",
          description: "Failed to store security check record.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Internal server communication error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Security" }, { label: "Add Security Check" }]}
      title="ADD SECURITY CHECK"
      activePath="/transport/security/new"
    >
      <div className="w-full py-4 px-4 bg-white min-h-[calc(100vh-140px)] flex flex-col space-y-4 rounded-lg">
        
        {/* Navigation Toolbar */}
        <div className="flex select-none">
          <Link href="/transport/security/list">
            <Button
              type="button"
              className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-9 px-4 rounded border-none shadow-sm active:scale-95 transition-all"
            >
              Security Check List List
            </Button>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="border border-slate-200/60 shadow-xs bg-white rounded-md overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Plant Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">
                      Plant <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      value={plant}
                      onChange={(e) => setPlant(e.target.value)}
                      className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5] transition-all"
                    >
                      <option value="">Choose Plant</option>
                      {plants.map((p) => (
                        <option key={p._id || p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gate No Input */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">
                      Gate No <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={gateNo}
                      onChange={(e) => setGateNo(e.target.value)}
                      placeholder="e.g. 1"
                      className="h-10 text-xs font-bold border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                      required
                    />
                  </div>

                  {/* Vehicle No Selector */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">Select Vehicle</Label>
                    <div className="relative flex items-center">
                      <select
                        value={vehicleNo}
                        onChange={(e) => handleVehicleChange(e.target.value)}
                        className="w-full h-10 rounded border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5] transition-all"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id || v._id} value={v.registrationNo}>
                            {v.registrationNo}
                          </option>
                        ))}
                      </select>
                      <Truck className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Driver Name Input */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">Driver Name</Label>
                    <div className="relative flex items-center">
                      <Input
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Suresh Kumar"
                        className="pl-9 h-10 text-xs font-semibold border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                      />
                      <User className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Gate Passing Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">
                      Gate Passing <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      value={gatePassing}
                      onChange={(e) => setGatePassing(e.target.value)}
                      className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5] transition-all"
                    >
                      <option value="Entry">Entry</option>
                      <option value="Exit">Exit</option>
                    </select>
                  </div>

                  {/* Type Of Movement Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">
                      Type Of Movement <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      value={typeOfMovement}
                      onChange={(e) => setTypeOfMovement(e.target.value)}
                      className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5] transition-all"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Job Work">Job Work</option>
                      <option value="Branch Transfer">Branch Transfer</option>
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">
                      Date <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-10 text-xs font-semibold border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded w-full pr-10"
                        required
                      />
                      <Calendar className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Time Input */}
                  <div className="space-y-1">
                    <Label className="text-xs font-black text-slate-700">
                      Time <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        type="text"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="HH:MM:SS"
                        className="h-10 text-xs font-semibold border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded w-full pr-10"
                        required
                      />
                      <Clock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Form submit button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                >
                  {loading ? "Saving..." : "Save Security Check"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </TransportLayout>
  );
}
