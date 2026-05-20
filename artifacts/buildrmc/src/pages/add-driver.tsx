import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { User, ShieldAlert, Phone } from "lucide-react";

export default function AddDriver() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licenseNo || !phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          licenseNo: licenseNo.toUpperCase().trim(),
          phone: phone.trim(),
          status,
        }),
      });

      if (res.ok) {
        toast({
          title: "Driver Registered",
          description: "Driver details successfully saved in database.",
        });
        setName("");
        setLicenseNo("");
        setPhone("");
        setStatus("active");
      } else {
        toast({
          title: "Error",
          description: "Failed to register driver.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Driver" }, { label: "Add Driver" }]}
      title="REGISTER NEW DRIVER"
      activePath="/transport/driver/new"
    >
      <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden border-t-4 border-blue-600">
          <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Register New Driver</h3>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">Driver Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Driver Name"
                    className="pl-9 h-10 text-xs font-semibold border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Driving License No *</Label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      placeholder="e.g. DL-1420110005"
                      className="pl-9 h-10 text-xs font-semibold border-slate-300 uppercase"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-700">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="pl-9 h-10 text-xs font-semibold border-slate-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">Duty Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">Active Duty</option>
                  <option value="suspended">Suspended</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="submit"
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Save Driver details
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
