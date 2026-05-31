import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { useRoute, useLocation } from "wouter";
import { Plus } from "lucide-react";

export default function AddDriver() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/transport/driver/edit/:id");
  const driverId = match ? params.id : null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseValidity, setLicenseValidity] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (driverId) {
      const fetchDriver = async () => {
        try {
          const res = await fetch(`/api/drivers/${driverId}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            setName(data.name || "");
            setPhone(data.phone || "");
            setLicenseNo(data.licenseNo || "");
            setLicenseValidity(data.licenseValidity || "");
            setStatus(data.status || "active");
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchDriver();
    }
  }, [driverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Driver Name is required.",
        variant: "destructive",
      });
      return;
    }
    if (!phone) {
      toast({
        title: "Validation Error",
        description: "Driver Phone is required.",
        variant: "destructive",
      });
      return;
    }
    if (!licenseNo) {
      toast({
        title: "Validation Error",
        description: "Licence No is required.",
        variant: "destructive",
      });
      return;
    }
    if (!licenseValidity) {
      toast({
        title: "Validation Error",
        description: "Licence Validity is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = driverId ? `/api/drivers/${driverId}` : "/api/drivers";
      const method = driverId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          licenseNo: licenseNo.toUpperCase().trim(),
          licenseValidity: licenseValidity,
          status,
        }),
      });

      if (res.ok) {
        toast({
          title: driverId ? "Driver Updated" : "Driver Registered",
          description: "Driver details successfully saved in database.",
        });
        setLocation("/transport/driver/list");
      } else {
        toast({
          title: "Error",
          description: "Failed to save driver details.",
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

  const handleCancel = () => {
    setLocation("/transport/driver/list");
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Driver", href: "/transport/driver/list" }, { label: driverId ? "Edit Driver" : "New Drivers" }]}
      title={driverId ? "EDIT DRIVER DETAILS" : "REGISTER NEW DRIVER"}
      activePath={driverId ? `/transport/driver/edit/${driverId}` : "/transport/driver/new"}
    >
      <div className="w-full py-4 px-8 bg-white min-h-[calc(100vh-140px)] flex flex-col rounded-lg border shadow-sm">
        {/* Top bar with Driver List button */}
        <div className="mb-4 flex justify-start">
          <Button
            onClick={() => setLocation("/transport/driver/list")}
            className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-extrabold text-xs h-9 px-4 rounded transition-all flex items-center gap-1 shadow-sm active:scale-95 border-0"
          >
            <Plus className="h-4 w-4" /> Driver List
          </Button>
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-start pt-1">
          <h2 className="text-center font-bold text-[#00c0a5] text-xl mb-4 uppercase tracking-wide">
            {driverId ? "Edit Driver Information" : "Add Driver Information"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Driver Name */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">
                Driver Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Driver Name.."
                className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                required
              />
            </div>

            {/* Driver Phone */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">
                Driver Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Driver Phone."
                className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                required
              />
            </div>

            {/* Licence No */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">
                Licence No <span className="text-red-500">*</span>
              </Label>
              <Input
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="Enter Licence No"
                className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded uppercase"
                required
              />
            </div>

            {/* Licence Validity */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-gray-700">
                Licence Validity <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={licenseValidity}
                onChange={(e) => setLicenseValidity(e.target.value)}
                className="h-10 text-xs font-medium border-slate-200 focus:border-[#00c0a5] focus:ring-[#00c0a5] rounded"
                required
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-extrabold text-xs h-9 px-6 rounded transition-all shadow-sm active:scale-95 uppercase border-0"
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-700 font-extrabold text-xs h-9 px-6 rounded transition-all shadow-sm active:scale-95 uppercase border-0"
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
