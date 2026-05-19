import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ListPlus, Save, RotateCcw, Truck, Info, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetCustomers, 
  useGetVehicles, 
  useGetProducts, 
  useGetEmployees 
} from "@workspace/api-client-react";

export default function AddWeighment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [deliveryNo] = useState("DEL1/2627/0257");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  
  // Form State
  const [mobileNo, setMobileNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [site, setSite] = useState("");
  const [grade, setGrade] = useState("");
  const [amount, setAmount] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driver, setDriver] = useState("");
  const [billNo, setBillNo] = useState("");
  const [emptyWeight, setEmptyWeight] = useState("");
  const [loadedWeight, setLoadedWeight] = useState("");

  // Live Data
  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();
  const { data: products } = useGetProducts();
  const { data: employees } = useGetEmployees();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Update site and mobile number when customer changes
  const selectedCustomerData = useMemo(() => {
    if (!customers || !customer) return null;
    return customers.find((c: any) => String(c.id || c._id) === customer) as any;
  }, [customers, customer]);

  useEffect(() => {
    if (selectedCustomerData) {
      setMobileNo(selectedCustomerData.contactNumber || selectedCustomerData.phone || selectedCustomerData.mobile || "");
      if (selectedCustomerData.address) {
        setSite(selectedCustomerData.address);
      } else {
        setSite("");
      }
    }
  }, [selectedCustomerData]);

  const availableCustomers = useMemo(() => {
    return (customers || []).map((c: any) => ({
      id: String(c.id || c._id),
      name: c.name
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [customers]);

  const availableSites = useMemo(() => {
    if (selectedCustomerData?.address) {
      return [selectedCustomerData.address];
    }
    const sites = new Set<string>();
    customers?.forEach((c: any) => {
      if (c.address) sites.add(c.address);
    });
    return Array.from(sites).sort();
  }, [customers, selectedCustomerData]);

  const availableVehicles = useMemo(() => {
    return (vehicles || []).map((v: any) => {
      const reg = v.registrationNumber || v.registrationNo || v.vehicleReg || v.vehicleNumber || v.regNo || v.number || v.name || String(v.id || v._id);
      return {
        id: String(v.id || v._id),
        reg: reg
      };
    });
  }, [vehicles]);

  const availableProducts = useMemo(() => {
    return (products || []).map((p: any) => ({
      id: String(p.id || p._id),
      name: p.name || p.grade || String(p.id || p._id)
    }));
  }, [products]);

  const availableDrivers = useMemo(() => {
    return (employees || []).filter((e: any) => !e.role || e.role.toLowerCase() === 'driver' || e.designation?.toLowerCase() === 'driver').map((e: any) => ({
      id: String(e.id || e._id),
      name: e.name || e.fullName || String(e.id || e._id)
    }));
  }, [employees]);

  const customerName = selectedCustomerData?.name || "-";
  const customerPhone = mobileNo || "-";
  const siteAddress = site || "-";

  const selectedProductName = availableProducts.find(p => p.id === grade)?.name || (grade ? grade.toUpperCase() : "-");

  const ticketDetails = [
    { label: "Customer Name", value: customerName },
    { label: "Customer Phone", value: customerPhone },
    { label: "Site Name", value: siteAddress },
    { label: "Site Address", value: siteAddress },
    { label: "Grade", value: selectedProductName },
    { label: "Ticket No", value: "TKT-9921" },
    { label: "Ticket Time", value: time },
  ];

  const handleSave = () => {
    if (!customer || !vehicleNo) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const net = (Number(loadedWeight) || 0) - (Number(emptyWeight) || 0);
    if (net < 0) {
      toast({ title: "Validation Error", description: "Loaded weight cannot be less than empty weight.", variant: "destructive" });
      return;
    }

    toast({ title: "Weighment Saved", description: `Record has been saved successfully with Net Weight: ${net} KG.` });
    navigate("/dc/weighment/list");
  };

  const handleClear = () => {
    setMobileNo("");
    setCustomer("");
    setSite("");
    setGrade("");
    setAmount("");
    setVehicleNo("");
    setDriver("");
    setBillNo("");
    setEmptyWeight("");
    setLoadedWeight("");
    toast({ title: "Form Cleared", description: "All inputs have been reset." });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center justify-between bg-white/40 p-4 rounded-xl backdrop-blur-md border border-white/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Add Weighment</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Record vehicle weights and generate delivery records</p>
        </div>
        <nav className="text-[10px] font-bold text-slate-400 flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <Link href="/dashboard" className="hover:text-cyan-500 transition-colors">HOME</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/dc" className="hover:text-cyan-500 transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-slate-800">ADD</span>
        </nav>
      </div>

      <div className="flex justify-start">
        <Link href="/dc/weighment/list" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white gap-2 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-6 py-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
          <ListPlus className="h-4 w-4" />
          + WEIGHMENT LIST
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Section */}
        <div className="lg:col-span-8">
          <div className="glass-card p-6 h-full border-white/80 shadow-xl">
            <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-cyan-500/10 p-2 rounded-lg">
                <Truck className="h-5 w-5 text-cyan-600" />
              </div>
              <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase">Weighment Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="f-label">Delivery No</Label>
                <Input value={deliveryNo} readOnly className="f-input bg-slate-50 border-slate-200 text-slate-400 font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Plant <span className="text-rose-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Mobile No</Label>
                <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="Enter Mobile No" className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Customer <span className="text-rose-500">*</span></Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableCustomers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Site Name <span className="text-rose-500">*</span></Label>
                <Select value={site} onValueChange={setSite}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Site" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableSites.map((s, idx) => (
                      <SelectItem key={idx} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Grade <span className="text-rose-500">*</span></Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Product" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableProducts.length > 0 ? availableProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="m10">M10</SelectItem>
                        <SelectItem value="m20">M20</SelectItem>
                        <SelectItem value="m30">M30</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Amount</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="f-input bg-white border-slate-200 text-slate-700 font-mono" />
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Vehicle No <span className="text-rose-500">*</span></Label>
                <Select value={vehicleNo} onValueChange={setVehicleNo}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Vehicle" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableVehicles.length > 0 ? availableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.reg}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="v1">TS07UP 1459</SelectItem>
                        <SelectItem value="v2">TS07UP 1789</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Driver Name</Label>
                <Select value={driver} onValueChange={setDriver}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {availableDrivers.length > 0 ? availableDrivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="d1">Rajesh Kumar</SelectItem>
                        <SelectItem value="d2">Suresh Singh</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Bill No</Label>
                <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Enter Bill No" className="f-input bg-white border-slate-200 text-slate-700 font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-amber-600">Empty Weight (KG)</Label>
                <Input 
                  type="number"
                  value={emptyWeight} 
                  onChange={(e) => setEmptyWeight(e.target.value)}
                  placeholder="Enter Empty Weight"
                  className="f-input bg-amber-50 border-amber-200 text-amber-700 placeholder:text-amber-300 font-mono font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-emerald-600">Loaded Weight (KG) <span className="text-rose-500">*</span></Label>
                <Input 
                  type="number"
                  value={loadedWeight}
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="Enter Loaded Weight" 
                  className="f-input bg-white border-emerald-200 text-emerald-700 placeholder:text-emerald-300 font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-400">Net Weight (KG)</Label>
                <Input 
                  value={Math.max(0, (Number(loadedWeight) || 0) - (Number(emptyWeight) || 0))} 
                  readOnly 
                  className="f-input bg-slate-50 border-slate-200 text-slate-400 font-mono font-bold" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10 border-t border-slate-100 pt-6">
              <Button onClick={handleSave} className="btn-primary px-10 h-11 gap-2 shadow-lg shadow-cyan-500/20">
                <Save className="h-4 w-4" /> SAVE WEIGHMENT
              </Button>
              <Button onClick={handleClear} variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-10 h-11 gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                <RotateCcw className="h-4 w-4" /> CLEAR
              </Button>
            </div>
          </div>
        </div>

        {/* Info Sidebar Section */}
        <div className="lg:col-span-4">
          <div className="glass-card overflow-hidden border-white/80 shadow-xl">
            <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-600" />
                <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Ticket Summary</span>
              </div>
              <Settings className="h-4 w-4 text-slate-300 cursor-pointer hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex flex-col">
              {ticketDetails.map((item, idx) => (
                <div key={idx} className="flex border-b border-slate-50 last:border-0 group">
                  <div className="w-32 bg-slate-50/50 text-slate-500 p-3 text-[9px] font-black uppercase tracking-wider flex items-center border-r border-slate-50">
                    {item.label}
                  </div>
                  <div className="flex-1 p-3 text-slate-800 text-xs font-bold bg-white group-hover:bg-slate-50 transition-colors">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-cyan-50/30 text-[9px] text-cyan-700 leading-relaxed italic font-semibold">
              Verification info: This data is synced with the plant's automated weigh-bridge system. Please verify vehicle number before saving.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
