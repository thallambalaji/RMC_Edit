import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Truck, ArrowLeft } from "lucide-react";

export default function AddVehicle() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/transport/vehicle/edit/:id");
  const vehicleId = match ? params.id : null;

  // Form State
  const [registrationNo, setRegistrationNo] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("Own");
  const [vehicleCategory, setVehicleCategory] = useState("KM Basis");
  const [transporter, setTransporter] = useState("N/A");
  const [loading, setLoading] = useState(false);

  // Expiry / Document State
  const [insuranceExp, setInsuranceExp] = useState("");
  const [rcExp, setRcExp] = useState("");
  const [taxExp, setTaxExp] = useState("");
  const [pollutionExp, setPollutionExp] = useState("");
  const [fitnessExp, setFitnessExp] = useState("");
  const [documentRequired, setDocumentRequired] = useState("");

  useEffect(() => {
    if (vehicleId) {
      const fetchVehicle = async () => {
        try {
          const res = await fetch(`/api/vehicles/${vehicleId}`);
          if (res.ok) {
            const data = await res.json();
            setRegistrationNo(data.registrationNo);
            setModel(data.model);
            setVehicleType(data.vehicleType || "Own");
            setVehicleCategory(data.vehicleCategory || "KM Basis");
            setTransporter(data.transporter || "N/A");
            setInsuranceExp(data.insuranceExp ? data.insuranceExp.slice(0, 10) : "");
            setRcExp(data.rcExp ? data.rcExp.slice(0, 10) : "");
            setTaxExp(data.taxExp ? data.taxExp.slice(0, 10) : "");
            setPollutionExp(data.pollutionExp ? data.pollutionExp.slice(0, 10) : "");
            setFitnessExp(data.fitnessExp ? data.fitnessExp.slice(0, 10) : "");
            setDocumentRequired(data.documentRequired || "");
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchVehicle();
    }
  }, [vehicleId]);

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNo || !model) {
      toast({
        title: "Validation Error",
        description: "Vehicle Registration No and Name are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        registrationNo: registrationNo.toUpperCase().trim(),
        model: model.trim(),
        capacity: 6,
        status: "available",
        vehicleType,
        vehicleCategory,
        transporter,
        insuranceExp: insuranceExp || null,
        rcExp: rcExp || null,
        taxExp: taxExp || null,
        pollutionExp: pollutionExp || null,
        fitnessExp: fitnessExp || null,
        documentRequired: documentRequired.trim(),
      };

      const url = vehicleId ? `/api/vehicles/${vehicleId}` : "/api/vehicles";
      const method = vehicleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: vehicleId ? "Vehicle Updated" : "Vehicle Registered",
          description: `Vehicle ${registrationNo} saved successfully.`,
        });
        setLocation("/transport/vehicle/list");
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error || "Failed to save vehicle.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setLocation("/transport/vehicle/list");
  };

  const inputCls = "h-10 text-xs font-semibold border-slate-300";
  const labelCls = "text-xs font-black uppercase text-slate-700";
  const selectCls = "w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#ea580c]";

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Vehicles", href: "/transport/vehicle/list" }, { label: vehicleId ? "Edit Vehicle" : "Add Vehicle" }]}
      title={vehicleId ? "EDIT VEHICLE" : "REGISTER NEW VEHICLE"}
      activePath={vehicleId ? `/transport/vehicle/edit/${vehicleId}` : "/transport/vehicle/new"}
    >
      <div className="max-w-3xl mx-auto w-full py-8 px-4">
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden border-t-4 border-[#ea580c]">
          <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-800" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {vehicleId ? "Update Vehicle Record" : "Register New Vehicle"}
              </h3>
            </div>
            <Button variant="outline" size="sm" onClick={handleBack}
              className="h-8 text-xs font-bold text-slate-600 border-slate-300 hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to List
            </Button>
          </div>

          <CardContent className="p-6">
            <form onSubmit={handleSaveVehicle} className="space-y-4">

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Vehicle No <span className="text-rose-500">*</span></Label>
                  <Input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="Enter Vehicle No" className={`${inputCls} uppercase`} required />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Vehicle Name *</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)}
                    placeholder="Enter vehicle name" className={inputCls} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Vehicle Type</Label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectCls}>
                    <option value="Own">Own</option>
                    <option value="Rental">Rental</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Vehicle Category *</Label>
                  <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)} className={selectCls}>
                    <option value="KM Basis">KM Basis</option>
                    <option value="Trip Basis">Trip Basis</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Transporter *</Label>
                <select value={transporter} onChange={(e) => setTransporter(e.target.value)} className={selectCls}>
                  <option value="Choose Transporter">Choose Transporter</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              {/* Expiry Dates Section */}
              <div className="pt-2 border-t border-dashed border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Document Expiry Dates</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Insurance Exp.</Label>
                    <Input type="date" value={insuranceExp} onChange={(e) => setInsuranceExp(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>RC Exp.</Label>
                    <Input type="date" value={rcExp} onChange={(e) => setRcExp(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Tax Exp.</Label>
                    <Input type="date" value={taxExp} onChange={(e) => setTaxExp(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Pollution Exp.</Label>
                    <Input type="date" value={pollutionExp} onChange={(e) => setPollutionExp(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Fitness Exp.</Label>
                    <Input type="date" value={fitnessExp} onChange={(e) => setFitnessExp(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Document Required</Label>
                    <Input value={documentRequired} onChange={(e) => setDocumentRequired(e.target.value)}
                      placeholder="e.g. RC Book, Insurance" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2">
                <Button type="submit" disabled={loading}
                  className="bg-[#ea580c] hover:bg-[#00a991] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all">
                  {loading ? "Saving..." : (vehicleId ? "Update Vehicle" : "Save Vehicle")}
                </Button>
                <Button type="button" onClick={handleBack}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all border border-slate-300">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
