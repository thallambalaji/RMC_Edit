import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Link, useLocation, useRoute } from "wouter";

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
}

interface EngineRow {
  engineType: string;
  calculationType: string;
  opening: string;
  closing: string;
}

export default function AddDiesel() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [plants, setPlants] = useState<any[]>([]);

  // Get edit route parameters
  const [match, params] = useRoute("/transport/diesel/edit/:id");
  const logId = match ? params.id : null;

  // Form State
  const [plant, setPlant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [litres, setLitres] = useState("");
  const [takenFrom, setTakenFrom] = useState("From Plant Stock");
  const [dieselRate, setDieselRate] = useState("");

  // Engines list state
  const [engineRows, setEngineRows] = useState<EngineRow[]>([
    { engineType: "Main Engine", calculationType: "km", opening: "", closing: "" }
  ]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
          if (data.length > 0 && !logId) setVehicleNo(data[0].registrationNo);
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
          if (data.length > 0 && !logId) setPlant(data[0].name);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlants();
  }, [logId]);

  useEffect(() => {
    if (logId) {
      const fetchLog = async () => {
        try {
          const res = await fetch(`/api/diesel-consumptions/${logId}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setPlant(data.plant || "");
            setDate(data.date || "");
            setVehicleNo(data.vehicleNo || "");
            setDriverName(data.driverName || "");
            setLitres(data.litres ? String(data.litres) : "");
            setTakenFrom(data.takenFrom || "From Plant Stock");
            setDieselRate(data.dieselRate ? String(data.dieselRate) : "");
            if (data.engines && data.engines.length > 0) {
              setEngineRows(
                data.engines.map((eng: any) => ({
                  engineType: eng.engineType || "Main Engine",
                  calculationType: eng.calculationType || "km",
                  opening: eng.opening !== undefined ? String(eng.opening) : "",
                  closing: eng.closing !== undefined ? String(eng.closing) : "",
                }))
              );
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchLog();
    }
  }, [logId]);

  const addEngineRow = () => {
    setEngineRows([
      ...engineRows,
      { engineType: "Main Engine", calculationType: "km", opening: "", closing: "" }
    ]);
  };

  const removeEngineRow = (index: number) => {
    if (engineRows.length <= 1) return;
    const updated = [...engineRows];
    updated.splice(index, 1);
    setEngineRows(updated);
  };

  const updateEngineRow = (index: number, field: keyof EngineRow, value: string) => {
    const updated = [...engineRows];
    updated[index] = { ...updated[index], [field]: value };
    setEngineRows(updated);
  };

  const handleClear = () => {
    if (logId) {
      // Re-trigger fetch
      setLocation(window.location.pathname);
      return;
    }
    setPlant(plants.length > 0 ? plants[0].name : "");
    setDate(new Date().toISOString().split("T")[0]);
    setVehicleNo(vehicles.length > 0 ? vehicles[0].registrationNo : "");
    setDriverName("");
    setLitres("");
    setTakenFrom("From Plant Stock");
    setDieselRate("");
    setEngineRows([
      { engineType: "Main Engine", calculationType: "km", opening: "", closing: "" }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !vehicleNo || !litres) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Date, Vehicle, Quantity).",
        variant: "destructive",
      });
      return;
    }

    const calculatedAmount = Number(litres) * (Number(dieselRate) || 0);

    const payload = {
      plant,
      date,
      vehicleNo,
      driverName: driverName.trim(),
      litres: Number(litres),
      takenFrom,
      dieselRate: Number(dieselRate) || 0,
      amount: calculatedAmount,
      pumpOperator: driverName.trim(),
      engines: engineRows.map(row => ({
        engineType: row.engineType,
        calculationType: row.calculationType,
        opening: Number(row.opening) || 0,
        closing: Number(row.closing) || 0
      }))
    };

    try {
      const url = logId ? `/api/diesel-consumptions/${logId}` : "/api/diesel-consumptions";
      const method = logId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: logId ? "Fuel Log Updated" : "Fuel Logged",
          description: logId
            ? "Diesel consumption successfully updated in database."
            : "Diesel consumption successfully recorded in database.",
        });
        setLocation("/transport/diesel/list");
      } else {
        toast({
          title: "Error",
          description: "Failed to record fuel log.",
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
      breadcrumbs={[
        { label: "Diesel Consumption", href: "/transport/diesel/list" },
        { label: logId ? "Edit Consumption" : "Log Consumption" }
      ]}
      title={logId ? "EDIT DIESEL CONSUMPTION" : "LOG DIESEL CONSUMPTION"}
      activePath="/transport/diesel/list"
    >
      <div className="w-full py-6 px-4 bg-white min-h-[calc(100vh-140px)] flex flex-col rounded-lg border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Details Section */}
          <div className="p-6 bg-slate-50/30 border border-slate-100 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Plant *</Label>
                  <select
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5]"
                  >
                    <option value="">Choose Plant</option>
                    {plants.map((p: any) => (
                      <option key={p._id || p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Vehicle *</Label>
                  <select
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5]"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id || v._id} value={v.registrationNo}>
                        {v.registrationNo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Consumption Date *</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Driver Name</Label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Enter Driver Name"
                    className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                  />
                </div>
              </div>

              {/* Column 3 Banner Badges */}
              <div className="flex flex-col gap-3 justify-start pt-5">
                <div className="bg-[#00c0a5] text-white font-bold text-center py-2 px-4 rounded text-xs select-none">
                  Available diesel : 3,840 Liters
                </div>
                <Link href="/transport/vehicle/list">
                  <Button
                    type="button"
                    className="w-full bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-center py-2 px-4 rounded text-xs transition-all border-none"
                  >
                    View Vehicle Details
                  </Button>
                </Link>
              </div>
            </div>

            {/* Row 3 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={litres}
                  onChange={(e) => setLitres(e.target.value)}
                  placeholder="Enter Quantity"
                  className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Taken From *</Label>
                <select
                  value={takenFrom}
                  onChange={(e) => setTakenFrom(e.target.value)}
                  className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5]"
                >
                  <option value="From Plant Stock">From Plant Stock</option>
                  <option value="Petrol Bunk">Petrol Bunk</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Diesel Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={dieselRate}
                  onChange={(e) => setDieselRate(e.target.value)}
                  placeholder="Enter Diesel Rate"
                  className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                />
              </div>
            </div>
          </div>

          {/* Engine Readings Table Section */}
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-[#00c0a5] hover:bg-[#00c0a5]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold uppercase text-white py-2.5 px-4 w-20">S/L No</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-white px-3">Engine Type</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-white px-3">Calculation Type</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-white px-3">Opening</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-white px-3">Closing</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-white px-4 text-center w-16">
                    <Button
                      type="button"
                      onClick={addEngineRow}
                      className="h-6 w-6 p-0 bg-white hover:bg-slate-50 text-[#00c0a5] border-none font-bold rounded flex items-center justify-center"
                    >
                      +
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineRows.map((row, idx) => (
                  <TableRow key={idx} className="border-b border-slate-100">
                    <TableCell className="text-xs font-bold py-3 px-4 text-slate-600">{idx + 1}</TableCell>
                    <TableCell className="px-3">
                      <select
                        value={row.engineType}
                        onChange={(e) => updateEngineRow(idx, "engineType", e.target.value)}
                        className="w-full h-9 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5]"
                      >
                        <option value="Main Engine">Main Engine</option>
                        <option value="Back Engine">Back Engine</option>
                        <option value="Other Engine">Other Engine</option>
                      </select>
                    </TableCell>
                    <TableCell className="px-3">
                      <select
                        value={row.calculationType}
                        onChange={(e) => updateEngineRow(idx, "calculationType", e.target.value)}
                        className="w-full h-9 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5]"
                      >
                        <option value="km">km</option>
                        <option value="hr">hr</option>
                      </select>
                    </TableCell>
                    <TableCell className="px-3">
                      <Input
                        value={row.opening}
                        onChange={(e) => updateEngineRow(idx, "opening", e.target.value)}
                        placeholder="0"
                        className="h-9 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                      />
                    </TableCell>
                    <TableCell className="px-3">
                      <Input
                        value={row.closing}
                        onChange={(e) => updateEngineRow(idx, "closing", e.target.value)}
                        placeholder="0"
                        className="h-9 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                      />
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      {engineRows.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeEngineRow(idx)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 text-rose-500 hover:bg-rose-50 p-0 border-none"
                        >
                          ✕
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-9 px-4 rounded transition-all active:scale-95 border-none shadow-sm"
            >
              {logId ? "Update Diesel Consumption" : "Save Diesel Consumption"}
            </Button>
            <Button
              type="button"
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-9 px-4 rounded transition-all active:scale-95 border-none shadow-sm"
            >
              {logId ? "Reset" : "Clear"}
            </Button>
          </div>
        </form>
      </div>
    </TransportLayout>
  );
}
