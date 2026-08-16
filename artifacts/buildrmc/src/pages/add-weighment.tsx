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
import { ChevronRight, ListPlus, Save, RotateCcw, Truck, Info, Settings, Scale, Zap, Radio, CheckCircle2, Play, RefreshCw, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetCustomers, 
  useGetVehicles, 
  useGetProducts, 
  useGetEmployees,
  useGetMasters
} from "@workspace/api-client-react";
import { useScale } from "@/context/scale-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AddWeighment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [deliveryNo] = useState(() => "DEL/" + Math.floor(100000 + Math.random() * 900000));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [plant, setPlant] = useState("");
  const ticketNo = useMemo(() => "TKT-" + Math.floor(1000 + Math.random() * 9000), []);
  
  // Weighment Settings Modal Popup State
  const [showWeighmentSettings, setShowWeighmentSettings] = useState(false);

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

  // Vehicle ticket lookup state — auto-populate weights from /dc/weighment/tickets
  const [vehicleTicketsData, setVehicleTicketsData] = useState<{
    tickets: any[];
    activeTicket: any;
    latestEmpty: any;
    latestLoaded: any;
    emptyWeight: number;
    loadedWeight: number;
    netWeight: number;
    isLoading: boolean;
  }>({
    tickets: [],
    activeTicket: null,
    latestEmpty: null,
    latestLoaded: null,
    emptyWeight: 0,
    loadedWeight: 0,
    netWeight: 0,
    isLoading: false,
  });

  // Fetch and continuously poll tickets for vehicle whenever vehicleNo changes
  useEffect(() => {
    if (!vehicleNo || vehicleNo.trim() === "" || vehicleNo === "_empty") {
      setVehicleTicketsData({
        tickets: [],
        activeTicket: null,
        latestEmpty: null,
        latestLoaded: null,
        emptyWeight: 0,
        loadedWeight: 0,
        netWeight: 0,
        isLoading: false,
      });
      return;
    }

    let isMounted = true;
    let hasShownToast = false;

    const lookupVehicleTickets = async () => {
      try {
        const res = await fetch(`/api/weighment-tickets/by-vehicle/${encodeURIComponent(vehicleNo.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        setVehicleTicketsData({
          tickets: data.tickets || [],
          activeTicket: data.activeTicket || null,
          latestEmpty: data.latestEmpty,
          latestLoaded: data.latestLoaded,
          emptyWeight: data.emptyWeight || 0,
          loadedWeight: data.loadedWeight || 0,
          netWeight: data.netWeight || 0,
          isLoading: false,
        });

        if (data.latestEmpty && data.emptyWeight > 0) {
          setEmptyWeight((data.emptyWeight / 1000).toFixed(3));
        }

        if (data.latestLoaded && data.loadedWeight > 0) {
          setLoadedWeight((data.loadedWeight / 1000).toFixed(3));
        }

        if (!hasShownToast && data.activeTicket) {
          hasShownToast = true;
          toast({
            title: `🎫 Active Ticket Loaded: ${vehicleNo}`,
            description: `${data.activeTicket.ticketNo} (${data.activeTicket.weightType}: ${(data.activeTicket.weight/1000).toFixed(3)} T)`,
          });
        }
      } catch (err) {
        console.error("Failed to fetch tickets for vehicle:", err);
      }
    };

    lookupVehicleTickets();
    const pollInterval = setInterval(lookupVehicleTickets, 2000);

    return () => { 
      isMounted = false; 
      clearInterval(pollInterval);
    };
  }, [vehicleNo]);


  // Global Scale & COM Port State (persists across page transitions)
  const {
    liveScaleWeight,
    isScaleConnected,
    isSimulating,
    isStable,
    scaleMode,
    connectionType,
    baudRateSetting,
    dataBitsSetting,
    paritySetting,
    stopBitsSetting,
    rawSerialText,
    setBaudRateSetting,
    setDataBitsSetting,
    setParitySetting,
    setStopBitsSetting,
    setConnectionType,
    handleToggleConnection,
    handleSimulateOrCapture,
  } = useScale();

  // Smart Live-Streaming: Auto-capture the second/missing weight from physical scale indicator
  useEffect(() => {
    if (!isScaleConnected) return;

    const liveTons = (liveScaleWeight / 1000).toFixed(3);

    // Scenario A: Ticket has Empty Weight -> Auto-stream live scale into Loaded Weight
    if (vehicleTicketsData.latestEmpty && !vehicleTicketsData.latestLoaded) {
      setLoadedWeight(liveTons);
    }
    // Scenario B: Ticket has Loaded Weight -> Auto-stream live scale into Empty Weight
    else if (vehicleTicketsData.latestLoaded && !vehicleTicketsData.latestEmpty) {
      setEmptyWeight(liveTons);
    }
    // Scenario C: Vehicle selected but no tickets -> Default live scale into Loaded Weight
    else if (!vehicleTicketsData.latestEmpty && !vehicleTicketsData.latestLoaded && vehicleNo) {
      setLoadedWeight(liveTons);
    }
  }, [liveScaleWeight, isScaleConnected, vehicleTicketsData.latestEmpty, vehicleTicketsData.latestLoaded, vehicleNo]);

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
      toast({ title: "Validation Error", description: "Please choose customer and enter/select vehicle number.", variant: "destructive" });
      return;
    }
    const emptyNum = Number(emptyWeight) || 0;
    const loadedNum = Number(loadedWeight) || 0;
    const netNum = loadedNum - emptyNum;

    if (netNum <= 0) {
      toast({ title: "Validation Error", description: "Loaded weight must be greater than empty weight to calculate Net Weight.", variant: "destructive" });
      return;
    }

    const matchedVehicle: any = (vehicles || []).find((v: any) => {
      const reg = v.registrationNumber || v.registrationNo || v.vehicleReg || v.vehicleNumber || v.regNo || v.number || v.name;
      return reg?.toLowerCase() === vehicleNo.toLowerCase();
    });
    const vehicleId = matchedVehicle ? (matchedVehicle._id || matchedVehicle.id) : ((vehicles?.[0] as any)?._id || vehicles?.[0]?.id);
    const customerId = customer || ((customers?.[0] as any)?._id || customers?.[0]?.id);
    const selectedSite = site || selectedCustomerData?.address || "Main Site";

    const payload = {
      dcNumber: deliveryNo,
      dcDate: date || new Date().toISOString().split("T")[0],
      dcTime: time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      plant: plant || "FORTUNE CONCRETE",
      customerid: customerId,
      siteName: selectedSite,
      vehicleid: vehicleId,
      driverName: driver || "Authorized Driver",
      grade: selectedProductName || grade || "M25",
      quantity: Number(netNum.toFixed(3)),
      netAmount: Number(amount) || 0,
      tareWeight: Math.round(emptyNum * 1000),
      loadedQuantity: Math.round(loadedNum * 1000),
      netWeight: Math.round(netNum * 1000),
      ticketNo: vehicleTicketsData.latestLoaded?.ticketNo || vehicleTicketsData.latestEmpty?.ticketNo || ticketNo,
      status: "completed"
    };

    try {
      // Step 1: Auto-save WeighmentTickets so they appear in /dc/weighment/tickets
      const tktBase = `TKT1/2627/${Math.floor(1000 + Math.random() * 9000)}`;
      const ticketSaves: Promise<any>[] = [];

      if (emptyNum > 0 && !vehicleTicketsData.latestEmpty) {
        ticketSaves.push(
          fetch("/api/weighment-tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticketNo: `${tktBase}-E`,
              plant: plant || "FORTUNE CONCRETE",
              vehicleNo,
              weightType: "Empty Weight",
              weight: Math.round(emptyNum * 1000),
              createdBy: "Super Admin"
            })
          }).catch(e => console.warn("Empty ticket auto-save:", e))
        );
      }

      if (loadedNum > 0 && !vehicleTicketsData.latestLoaded) {
        ticketSaves.push(
          fetch("/api/weighment-tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticketNo: `${tktBase}-L`,
              plant: plant || "FORTUNE CONCRETE",
              vehicleNo,
              weightType: "Loaded Weight",
              weight: Math.round(loadedNum * 1000),
              createdBy: "Super Admin"
            })
          }).catch(e => console.warn("Loaded ticket auto-save:", e))
        );
      }

      if (ticketSaves.length > 0) await Promise.allSettled(ticketSaves);

      // Step 2: Save the Delivery Challan record
      const response = await fetch("/api/delivery-challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save delivery challan");
      }

      // Step 3: Automatically CLOSE the active open ticket for this vehicle
      await fetch(`/api/weighment-tickets/close-by-vehicle/${encodeURIComponent(vehicleNo.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryNo })
      }).catch(e => console.warn("Ticket close notice:", e));

      toast({ 
        title: "✅ Weighment Saved & Ticket Closed", 
        description: `Delivery Challan ${deliveryNo} recorded. Active ticket for vehicle ${vehicleNo} is now CLOSED.` 
      });
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
    toast({ title: "Form Cleared", description: "All inputs have been reset." });
  };

  const handleSimulateTruckScale = async (type: "empty" | "loaded") => {
    await handleSimulateOrCapture(type, (_weightKg, tonsVal) => {
      if (type === "empty") {
        setEmptyWeight(tonsVal);
      } else {
        setLoadedWeight(tonsVal);
      }
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

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dc/weighment/list" className="bg-[#ea580c] hover:bg-[#d97706] text-white gap-2 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-5 py-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
          <ListPlus className="h-4 w-4" />
          + WEIGHMENT LIST
        </Link>

        <Button
          type="button"
          onClick={() => setShowWeighmentSettings(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-5 py-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95 border border-slate-700"
        >
          <Settings className="h-4 w-4 text-orange-400" />
          <span>WEIGHMENT SETTINGS</span>
          <span className={`ml-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isScaleConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
            {isScaleConnected ? '🔌 CONNECTED' : '🔴 OFFLINE'}
          </span>
        </Button>

        {/* Live scale readout shortcut badge */}
        <div 
          onClick={() => setShowWeighmentSettings(true)}
          className="ml-auto flex items-center gap-2 bg-white/80 hover:bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:border-orange-300 group"
          title="Click to open Weighment Settings & Scale Readout"
        >
          <Scale className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Scale:</span>
          <span className="font-mono text-sm font-extrabold text-emerald-600">
            {(liveScaleWeight / 1000).toFixed(3)} <span className="text-slate-400 font-normal text-xs">Tons</span>
            <span className="text-[10px] text-slate-400 font-normal ml-1">({liveScaleWeight} KG)</span>
          </span>
          {isStable && <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">● STABLE</span>}
        </div>
      </div>

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
                <div className="flex gap-1">
                  <Input
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="Enter or select Vehicle No"
                    className="f-input bg-white border-slate-200 text-slate-700 font-semibold flex-1 uppercase font-mono"
                  />
                  <Select value={vehicleNo} onValueChange={setVehicleNo}>
                    <SelectTrigger className="bg-white border-slate-200 text-slate-700 font-semibold h-10 w-10 shrink-0 px-1">
                      <span className="text-[10px]">▼</span>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700 max-h-[250px]">
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
                  placeholder="Auto-fills on Vehicle select (or enter)"
                  className="f-input bg-amber-50/40 border-amber-200 text-amber-800 placeholder:text-amber-300 font-mono font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-emerald-600">Loaded Weight (Tons) <span className="text-rose-500">*</span></Label>
                <Input 
                  type="number"
                  value={loadedWeight} 
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="Auto-fills on Vehicle select (or enter)" 
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

      {/* Weighment Settings Modal Popup */}
      <Dialog open={showWeighmentSettings} onOpenChange={setShowWeighmentSettings}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border-slate-800 text-white p-6 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Scale className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Weighbridge Digital Indicator & Hardware Settings</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isScaleConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                    {isScaleConnected ? `CONNECTED (${scaleMode === 'SIMULATOR' ? '⚡ SIMULATOR' : '🔌 COM PORT'})` : '🔴 SCALE DISCONNECTED'}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Live RS-232 / USB scale readout, baud rate, framing bits, and automatic weight capture
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Settings Row */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">COM Port & Serial Configuration</span>
                <Button 
                  type="button" 
                  onClick={handleToggleConnection}
                  variant="outline" 
                  className={`text-[10px] font-bold h-8 px-4 gap-1.5 ${isScaleConnected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                >
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  {isScaleConnected ? 'Disconnect Scale' : (connectionType === 'COM_PORT' ? 'Connect COM Port' : 'Connect Utility')}
                </Button>
              </div>

              <div className="flex items-center gap-3 flex-wrap pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Mode</label>
                  <Select value={connectionType} onValueChange={(val) => { setConnectionType(val as any); handleDisconnectAll(); }}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-bold h-8 w-36">
                      <SelectValue placeholder="Connection Mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                      <SelectItem value="COM_PORT">🔌 Direct COM Port</SelectItem>
                      <SelectItem value="LOCAL_UTILITY">⚡ Local Utility (7171)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {connectionType === "COM_PORT" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Data Bits</label>
                      <Select value={String(dataBitsSetting)} onValueChange={(val) => setDataBitsSetting(Number(val))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-8 w-24">
                          <SelectValue placeholder="Data Bits" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectItem value="5">5 Bits</SelectItem>
                          <SelectItem value="6">6 Bits</SelectItem>
                          <SelectItem value="7">7 Bits</SelectItem>
                          <SelectItem value="8">8 Bits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Parity</label>
                      <Select value={paritySetting} onValueChange={(val) => setParitySetting(val)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-8 w-28">
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
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Stop Bits</label>
                      <Select value={String(stopBitsSetting)} onValueChange={(val) => setStopBitsSetting(Number(val))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-8 w-28">
                          <SelectValue placeholder="Stop Bits" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectItem value="1">1 Stop</SelectItem>
                          <SelectItem value="1.5">1.5 Stop</SelectItem>
                          <SelectItem value="2">2 Stop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Baud Rate</label>
                      <Select value={String(baudRateSetting)} onValueChange={(val) => setBaudRateSetting(Number(val))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] font-mono font-bold h-8 w-32">
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

                  </>
                )}
              </div>
            </div>

            {/* Digital LED Screen Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 bg-black/80 rounded-xl p-5 border border-slate-800 flex items-center justify-between shadow-inner">
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span>SCALE WEIGHT</span>
                    {isStable && <span className="text-emerald-400 text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-sans">● STABLE</span>}
                    {isSimulating && <span className="text-amber-400 text-[9px] animate-bounce">MEASURING...</span>}
                  </div>
                  <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_14px_rgba(52,211,153,0.5)] mt-1.5">
                    {(liveScaleWeight / 1000).toFixed(3)} <span className="text-xl text-slate-400 font-normal">Tons</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    = {liveScaleWeight} <span className="text-[10px]">KG</span>
                  </div>
                  {isScaleConnected && scaleMode === "HARDWARE_COM" && (
                    <div className="text-[10px] font-mono text-slate-400 mt-2.5 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[320px]">
                      <span className="text-emerald-400 shrink-0">RAW STREAM:</span>
                      <span className="text-slate-300 truncate">{rawSerialText || "Waiting for data..."}</span>
                    </div>
                  )}
                </div>
                <div className="text-right self-start">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Status</div>
                  <div className="text-xs font-mono font-bold text-orange-400 mt-0.5">
                    {isSimulating ? "SENSING..." : isStable ? "LOCKED" : "READY"}
                  </div>
                </div>
              </div>

              {/* Action Buttons inside modal */}
              <div className="md:col-span-5 flex flex-col gap-2.5">
                <Button
                  type="button"
                  disabled={!isScaleConnected || isSimulating}
                  onClick={() => {
                    handleSimulateTruckScale("loaded");
                    setShowWeighmentSettings(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider h-11 shadow-md shadow-emerald-900/30 gap-2 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSimulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  CAPTURE GROSS (LOADED) & APPLY
                </Button>

                <Button
                  type="button"
                  disabled={!isScaleConnected || isSimulating}
                  onClick={() => {
                    handleSimulateTruckScale("empty");
                    setShowWeighmentSettings(false);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider h-11 shadow-md shadow-amber-900/30 gap-2 w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSimulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  CAPTURE TARE (EMPTY) & APPLY
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button
                type="button"
                onClick={() => setShowWeighmentSettings(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-6 h-9"
              >
                Close Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

