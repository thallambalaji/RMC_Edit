import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronRight, ListPlus, Save, RotateCcw, Truck, Info, Settings, Scale, Zap, Radio, CheckCircle2, Play, RefreshCw, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizePhone, isValidPhone } from "@/lib/utils";

import { 
  useGetCustomers, 
  useGetVehicles, 
  useGetProducts, 
  useGetEmployees,
  useGetMasters
} from "@workspace/api-client-react";
import { useScale } from "@/context/ScaleContext";

export default function AddWeighment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [deliveryNo] = useState(() => "DEL/" + Math.floor(100000 + Math.random() * 900000));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [plant, setPlant] = useState("");
  const ticketNo = useMemo(() => "TKT-" + Math.floor(1000 + Math.random() * 9000), []);
  
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

  // Weighbridge Live & Simulator State (Global scale context for persistent COM port connection across navigation)
  const {
    liveScaleWeight,
    setLiveScaleWeight,
    isScaleConnected,
    isSimulating,
    setIsSimulating,
    isStable,
    setIsStable,
    scaleMode,
    connectionType,
    setConnectionType,
    rawSerialText,
    dataBitsSetting,
    setDataBitsSetting,
    paritySetting,
    setParitySetting,
    stopBitsSetting,
    setStopBitsSetting,
    baudRateSetting,
    setBaudRateSetting,
    handleToggleConnection,
    handleDisconnectAll,
    handleSimulateTruckScale: simulateScaleGlobal,
    handleResetScaleMeter
  } = useScale();

  const [isScaleModalOpen, setIsScaleModalOpen] = useState<boolean>(false);

  // Live Data
  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();
  const { data: products } = useGetProducts();
  const { data: employees } = useGetEmployees();
  const { data: plants } = useGetMasters("plant");

  useEffect(() => {
    if (plants && plants.length > 0 && !plant) {
      setPlant(String(plants[0].name || plants[0].id || ""));
    }
  }, [plants, plant]);

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

  const broadcastWeighment = (vehNo: string, loaded: string, empty: string) => {
    try {
      const data = {
        vehicleNo: vehNo,
        loadedWeight: loaded,
        emptyWeight: empty,
        loadedWeightKg: loaded ? Math.round(Number(loaded) * 1000) : 0,
        emptyWeightKg: empty ? Math.round(Number(empty) * 1000) : 0,
        timestamp: Date.now()
      };
      localStorage.setItem("rmc_latest_weighment", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("rmc_weighment_update", { detail: data }));
    } catch (e) {
      console.warn("Error broadcasting weighment:", e);
    }
  };

  useEffect(() => {
    if (loadedWeight || emptyWeight) {
      broadcastWeighment(vehicleNo, loadedWeight, emptyWeight);
    }
  }, [loadedWeight, emptyWeight, vehicleNo]);

  // Auto-capture weight when scale reading stabilizes (hands-free)
  const lastCapturedWeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (liveScaleWeight < 200) {
      lastCapturedWeightRef.current = null;
      return;
    }

    if (isStable && liveScaleWeight >= 500) {
      const tonsVal = (liveScaleWeight / 1000).toFixed(3);
      if (lastCapturedWeightRef.current === liveScaleWeight) return;

      if (!loadedWeight) {
        setLoadedWeight(tonsVal);
        lastCapturedWeightRef.current = liveScaleWeight;
        toast({
          title: "⚡ Loaded Weight Auto-Captured",
          description: `Automatically recorded Loaded Weight: ${tonsVal} Tons`,
        });
      } else if (loadedWeight && !emptyWeight) {
        if (Number(tonsVal) <= Number(loadedWeight)) {
          setEmptyWeight(tonsVal);
          lastCapturedWeightRef.current = liveScaleWeight;
          toast({
            title: "⚡ Empty Weight Auto-Captured",
            description: `Automatically recorded Empty Weight: ${tonsVal} Tons`,
          });
        }
      }
    }
  }, [liveScaleWeight, isStable, loadedWeight, emptyWeight]);

  // Automated background scale engine (runs 100% hands-free without pressing any buttons)
  useEffect(() => {
    if (scaleMode !== "SIMULATOR" || !isScaleConnected) return;

    let cleanupFn: (() => void) | undefined;

    // Phase 1: Auto-generate & capture Loaded Weight (Gross)
    if (!loadedWeight && !isSimulating) {
      setIsSimulating(true);
      setIsStable(false);
      const targetWeight = 34500 + Math.floor(Math.random() * 600) - 300;
      let stepCount = 0;
      const totalSteps = 12;

      const interval = setInterval(() => {
        stepCount++;
        const jitter = Math.floor((Math.random() - 0.5) * (totalSteps - stepCount) * 400);
        setLiveScaleWeight(Math.max(0, targetWeight + jitter));

        if (stepCount >= totalSteps) {
          clearInterval(interval);
          setLiveScaleWeight(targetWeight);
          setIsSimulating(false);
          setIsStable(true);
          const tonsVal = (targetWeight / 1000).toFixed(3);
          setLoadedWeight(tonsVal);
          toast({
            title: "⚡ Loaded Weight Auto-Captured",
            description: `Automatically recorded Loaded Weight: ${tonsVal} Tons`,
          });
        }
      }, 100);

      cleanupFn = () => clearInterval(interval);
    }
    // Phase 2: Auto-generate & capture Empty Weight (Tare) after Loaded Weight is captured
    else if (loadedWeight && !emptyWeight && !isSimulating) {
      const timer = setTimeout(() => {
        setIsSimulating(true);
        setIsStable(false);
        const targetWeight = 12800 + Math.floor(Math.random() * 400) - 200;
        let stepCount = 0;
        const totalSteps = 12;

        const interval = setInterval(() => {
          stepCount++;
          const jitter = Math.floor((Math.random() - 0.5) * (totalSteps - stepCount) * 300);
          setLiveScaleWeight(Math.max(0, targetWeight + jitter));

          if (stepCount >= totalSteps) {
            clearInterval(interval);
            setLiveScaleWeight(targetWeight);
            setIsSimulating(false);
            setIsStable(true);
            const tonsVal = (targetWeight / 1000).toFixed(3);
            setEmptyWeight(tonsVal);
            toast({
              title: "⚡ Empty Weight Auto-Captured",
              description: `Automatically recorded Empty Weight: ${tonsVal} Tons`,
            });
          }
        }, 100);
      }, 1500);

      cleanupFn = () => clearTimeout(timer);
    }

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [scaleMode, loadedWeight, emptyWeight, isSimulating]);

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
    { label: "Ticket No", value: ticketNo },
    { label: "Ticket Time", value: time },
  ];

  const handleSave = async () => {
    if (!customer || !vehicleNo) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (mobileNo && !isValidPhone(mobileNo, false)) {
      toast({ title: "Validation Error", description: "Mobile number must be exactly 10 digits.", variant: "destructive" });
      return;
    }
    const net = (Number(loadedWeight) || 0) - (Number(emptyWeight) || 0);
    if (net < 0) {
      toast({ title: "Validation Error", description: "Loaded weight cannot be less than empty weight.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/weighment-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNo,
          plant: plant || "Plant 1",
          vehicleNo,
          weightType: "Net Weight",
          weight: net,
          createdBy: "Super Admin"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save weighment ticket to database");
      }

      toast({ title: "Weighment Saved", description: `Record saved to MongoDB with Net Weight: ${net.toFixed(3)} Tons.` });
      handleResetScaleMeter();
      navigate("/dc/weighment/list");
    } catch (err: any) {
      toast({ title: "Error Saving", description: err.message || "Could not save to database", variant: "destructive" });
    }
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
    handleResetScaleMeter();
    toast({ title: "Form Cleared", description: "All inputs and scale meter have been reset." });
  };

  const handleSimulateTruckScale = (type: "empty" | "loaded") => {
    simulateScaleGlobal(type, (t, tonsVal) => {
      if (t === "loaded") setLoadedWeight(tonsVal);
      else setEmptyWeight(tonsVal);
    });
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
          <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">HOME</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/dc" className="hover:text-[#ea580c] transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-slate-800">ADD</span>
        </nav>
      </div>

      <div className="flex items-center justify-start gap-3 flex-wrap">
        <Link href="/dc/weighment/list" className="bg-[#ea580c] hover:bg-[#d97706] text-white gap-2 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-6 py-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
          <ListPlus className="h-4 w-4" />
          + WEIGHMENT LIST
        </Link>

        <Button
          type="button"
          onClick={() => setIsScaleModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-slate-100 gap-2.5 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-5 py-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95 border border-slate-700"
        >
          <Scale className="h-4 w-4 text-orange-400" />
          <span>WEIGHBRIDGE SCALE SETTINGS</span>
          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${isScaleConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
            <span className={`h-2 w-2 rounded-full ${isScaleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {isScaleConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </Button>
      </div>

      {/* Weighbridge Digital Indicator Popup Dialog */}
      <Dialog open={isScaleModalOpen} onOpenChange={setIsScaleModalOpen}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-white border-slate-800 shadow-2xl p-6 rounded-2xl">
          <DialogHeader className="border-b border-slate-800 pb-3 mb-2">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Scale className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black tracking-wider uppercase text-slate-100 flex items-center gap-2">
                    Digital Weighbridge Indicator
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isScaleConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      {isScaleConnected ? `CONNECTED (${scaleMode === 'SIMULATOR' ? '⚡ SIMULATOR' : '🔌 COM PORT'})` : '🔴 SCALE DISCONNECTED'}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-slate-400">
                    Live RS-232 / USB scale readout & automatic weight capture settings
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Connection settings bar */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Data Bits Dropdown */}
                <Select value={String(dataBitsSetting)} onValueChange={(val) => setDataBitsSetting(Number(val))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-9 w-24">
                    <SelectValue placeholder="Data Bits" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="5">5 Bits</SelectItem>
                    <SelectItem value="6">6 Bits</SelectItem>
                    <SelectItem value="7">7 Bits</SelectItem>
                    <SelectItem value="8">8 Bits</SelectItem>
                  </SelectContent>
                </Select>

                {/* Parity Dropdown */}
                <Select value={paritySetting} onValueChange={(val) => setParitySetting(val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-9 w-24">
                    <SelectValue placeholder="Parity" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="none">No Parity</SelectItem>
                    <SelectItem value="even">Even</SelectItem>
                    <SelectItem value="odd">Odd</SelectItem>
                    <SelectItem value="mark">Mark</SelectItem>
                    <SelectItem value="space">Space</SelectItem>
                  </SelectContent>
                </Select>

                {/* Stop Bits Dropdown */}
                <Select value={String(stopBitsSetting)} onValueChange={(val) => setStopBitsSetting(Number(val))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-9 w-24">
                    <SelectValue placeholder="Stop Bits" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="1">1 Stop</SelectItem>
                    <SelectItem value="1.5">1.5 Stop</SelectItem>
                    <SelectItem value="2">2 Stop</SelectItem>
                  </SelectContent>
                </Select>

                {/* Baud Rate Dropdown */}
                <Select value={String(baudRateSetting)} onValueChange={(val) => setBaudRateSetting(Number(val))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-9 w-28">
                    <SelectValue placeholder="Baud Rate" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="1200">1200 Baud</SelectItem>
                    <SelectItem value="2400">2400 Baud</SelectItem>
                    <SelectItem value="4800">4800 Baud</SelectItem>
                    <SelectItem value="9600">9600 Baud</SelectItem>
                    <SelectItem value="19200">19200 Baud</SelectItem>
                    <SelectItem value="115200">115200 Baud</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="button" 
                onClick={handleToggleConnection}
                variant="outline" 
                className={`text-[10px] font-bold h-9 px-4 gap-1.5 shrink-0 ${isScaleConnected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                {isScaleConnected ? 'Disconnect' : 'Connect WebSerial'}
              </Button>
            </div>

            {/* LED Screen & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 bg-black/90 rounded-xl p-5 border border-slate-800 flex items-center justify-between shadow-inner">
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span>SCALE WEIGHT</span>
                    {isStable && <span className="text-emerald-400 text-[9px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 font-sans">● STABLE</span>}
                    {isSimulating && <span className="text-amber-400 text-[9px] animate-bounce">MEASURING...</span>}
                  </div>
                  <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] mt-2">
                    {(liveScaleWeight / 1000).toFixed(3)} <span className="text-lg text-slate-400 font-normal">Tons</span>
                  </div>
                  {isScaleConnected && scaleMode === "HARDWARE_COM" && (
                    <div className="text-[10px] font-mono text-slate-400 mt-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px]">
                      <span className="text-emerald-400 shrink-0">RAW STREAM:</span>
                      <span className="text-slate-300 truncate">{rawSerialText || "Waiting for data..."}</span>
                    </div>
                  )}
                </div>
                <div className="text-right self-start">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Status</div>
                  <div className="text-xs font-mono font-bold text-orange-400">
                    {isSimulating ? "SENSING..." : isStable ? "LOCKED" : "READY"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-5 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={!isScaleConnected || isSimulating}
                  onClick={() => handleSimulateTruckScale("loaded")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider h-10 shadow-md shadow-emerald-900/30 gap-2 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSimulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  {isScaleConnected && scaleMode === "HARDWARE_COM" ? "CAPTURE GROSS WEIGHT FROM SCALE" : "SIMULATE LOADED TRUCK (GROSS)"}
                </Button>

                <Button
                  type="button"
                  disabled={!isScaleConnected || isSimulating}
                  onClick={() => handleSimulateTruckScale("empty")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider h-10 shadow-md shadow-amber-900/30 gap-2 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSimulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  {isScaleConnected && scaleMode === "HARDWARE_COM" ? "CAPTURE TARE WEIGHT FROM SCALE" : "SIMULATE EMPTY TRUCK (TARE)"}
                </Button>

                <Button
                  type="button"
                  onClick={handleResetScaleMeter}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider h-9 shadow-md gap-1.5 w-full justify-center"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  ZERO / RESET SCALE METER
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Section */}
        <div className="lg:col-span-8">
          <div className="glass-card p-6 h-full border-white/80 shadow-xl">

            <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-[#ea580c]/10 p-2 rounded-lg">
                <Truck className="h-5 w-5 text-[#ea580c]" />
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
                    <SelectValue placeholder="Choose Plant" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {plants && plants.length > 0 ? (
                      plants.map((p: any) => (
                        <SelectItem key={p.id || p._id} value={p.name || p.id}>{p.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No plants configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Mobile No</Label>
                <Input value={mobileNo} onChange={(e) => setMobileNo(sanitizePhone(e.target.value))} placeholder="Enter 10-digit Mobile No" maxLength={10} className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
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
                <div className="flex gap-1">
                  <Input
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="Grade"
                    className="f-input bg-white border-slate-200 text-slate-700 font-semibold flex-1"
                  />
                  <Select value={availableProducts.some(p => p.id === grade || p.name === grade) ? (availableProducts.find(p => p.name === grade)?.id || grade) : ""} onValueChange={setGrade}>
                    <SelectTrigger className="bg-white border-slate-200 text-slate-700 font-semibold h-10 w-10 shrink-0 px-1">
                      <span className="text-[10px]">▼</span>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id || p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    {availableVehicles.length > 0 ? (
                      availableVehicles.map(v => (
                        <SelectItem key={v.id} value={v.reg}>{v.reg}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No vehicles registered</SelectItem>
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
                    {availableDrivers.length > 0 ? (
                      availableDrivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No drivers registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Bill No</Label>
                <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Enter Bill No" className="f-input bg-white border-slate-200 text-slate-700 font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-amber-600">Empty Weight (Tons)</Label>
                <Input 
                  type="number"
                  value={emptyWeight} 
                  onChange={(e) => setEmptyWeight(e.target.value)}
                  placeholder="Enter Empty Weight in Tons"
                  className="f-input bg-amber-50 border-amber-200 text-amber-700 placeholder:text-amber-300 font-mono font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-emerald-600">Loaded Weight (Tons) <span className="text-rose-500">*</span></Label>
                <Input 
                  type="number"
                  value={loadedWeight}
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="Enter Loaded Weight in Tons" 
                  className="f-input bg-white border-emerald-200 text-emerald-700 placeholder:text-emerald-300 font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-400">Net Weight (Tons)</Label>
                <Input 
                  value={Math.max(0, (Number(loadedWeight) || 0) - (Number(emptyWeight) || 0)).toFixed(3)} 
                  readOnly 
                  className="f-input bg-slate-50 border-slate-200 text-slate-400 font-mono font-bold" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10 border-t border-slate-100 pt-6">
              <Button onClick={handleSave} className="btn-primary px-10 h-11 gap-2 shadow-lg shadow-orange-500/20">
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
                <Info className="h-4 w-4 text-[#ea580c]" />
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
            <div className="p-4 bg-orange-50/40/30 text-[9px] text-[#ea580c] leading-relaxed italic font-semibold">
              Verification info: This data is synced with the plant's automated weigh-bridge system. Please verify vehicle number before saving.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
