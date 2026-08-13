import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChevronRight, Save, Loader2, Archive, Calendar, Clock,
  ArrowRight, ShieldAlert, FileText, CheckCircle2, RotateCcw, Undo,
  Scale, Settings, Radio, Zap, Play, RefreshCw, ListPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useGetVehicles, useGetMasters } from "@workspace/api-client-react";
import { StoreLayout } from "@/components/store-layout";
import { useScale } from "@/context/scale-context";

export default function AddInventory() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Weighment Settings Modal Popup State
  const [showWeighmentSettings, setShowWeighmentSettings] = useState(false);

  // Global Scale Connection State (persists across all pages)
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
    handleConnectHardwareCOM,
    handleConnectLocalUtility,
    handleDisconnectAll,
    handleToggleConnection,
    handleSimulateOrCapture,
  } = useScale();

  
  // Form States
  const [plant, setPlant] = useState("");
  const [inventoryNo, setInventoryNo] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [itemName, setItemName] = useState("");
  const [billNo, setBillNo] = useState("");
  const [amount, setAmount] = useState("");
  
  const [inventoryDate, setInventoryDate] = useState("");
  const [inventoryTime, setInventoryTime] = useState("");
  const [gatepassNo, setGatepassNo] = useState("");
  const [royaltyNo, setRoyaltyNo] = useState("");
  const [unit, setUnit] = useState("KG");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  
  const [vehicleNo, setVehicleNo] = useState("");
  const [loadedWeight, setLoadedWeight] = useState("");
  const [emptyWeight, setEmptyWeight] = useState("");
  const [supplierWeight, setSupplierWeight] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // Fetch Vehicles
  const { data: vehicles } = useGetVehicles();
  const availableVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles
      .map((v: any) => v.registrationNo || v.registrationNumber || v.vehicleNumber || v.regNo)
      .filter(Boolean);
  }, [vehicles]);

  const { data: plants } = useGetMasters("plant");
  const { data: suppliers } = useGetMasters("supplier");
  const { data: items } = useGetMasters("item");

  useEffect(() => {
    if (plants && plants.length > 0 && !plant) {
      setPlant(String(plants[0].name || plants[0].id || ""));
    }
  }, [plants, plant]);

  // Vehicle ticket lookup state — auto-populate weights from /store/inventory/ticket and /dc/weighment/tickets
  const [vehicleTicketsData, setVehicleTicketsData] = useState<{
    tickets: any[];
    latestEmpty: any;
    latestLoaded: any;
    emptyWeight: number;
    loadedWeight: number;
    netWeight: number;
    isLoading: boolean;
  }>({
    tickets: [],
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
        // Query store inventory tickets first, fallback to weighment tickets
        let res = await fetch(`/api/inventory-tickets/by-vehicle/${encodeURIComponent(vehicleNo.trim())}`);
        let data = res.ok ? await res.json() : null;
        
        if (!data || (!data.latestEmpty && !data.latestLoaded)) {
          const dcRes = await fetch(`/api/weighment-tickets/by-vehicle/${encodeURIComponent(vehicleNo.trim())}`);
          if (dcRes.ok) {
            const dcData = await dcRes.json();
            if (dcData && (dcData.latestEmpty || dcData.latestLoaded)) {
              data = dcData;
            }
          }
        }

        if (!data || !isMounted) return;

        setVehicleTicketsData({
          tickets: data.tickets || [],
          latestEmpty: data.latestEmpty,
          latestLoaded: data.latestLoaded,
          emptyWeight: data.emptyWeight || 0,
          loadedWeight: data.loadedWeight || 0,
          netWeight: data.netWeight || 0,
          isLoading: false,
        });

        const isTon = unit === "TON";
        if (data.latestEmpty && data.emptyWeight > 0) {
          setEmptyWeight(isTon ? (data.emptyWeight / 1000).toFixed(3) : String(data.emptyWeight));
        }

        if (data.latestLoaded && data.loadedWeight > 0) {
          setLoadedWeight(isTon ? (data.loadedWeight / 1000).toFixed(3) : String(data.loadedWeight));
        }

        if (!hasShownToast && (data.latestEmpty || data.latestLoaded)) {
          hasShownToast = true;
          toast({
            title: `✨ Weights Auto-Loaded: ${vehicleNo}`,
            description: `${data.latestEmpty ? `Empty: ${data.emptyWeight} KG ` : ""}${data.latestLoaded ? `Loaded: ${data.loadedWeight} KG` : ""}`,
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
  }, [vehicleNo, unit]);

  const [editingId, setEditingId] = useState<string | null>(null);


  // Set default Date, Time & Inventory No, or load receipt for editing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      setEditingId(editId);
      fetchReceiptToEdit(editId);
    } else {
      generateInventoryNo();
      const today = new Date();
      setInventoryDate(today.toISOString().split("T")[0]);
      setInventoryTime(today.toTimeString().split(" ")[0]);
    }
  }, []);

  const fetchReceiptToEdit = async (id: string) => {
    try {
      const data: any = await customFetch(`/api/store-inventories/${id}`);
      if (data) {
        setPlant(data.plant);
        setInventoryNo(data.inventoryNo);
        setSupplierName(data.supplierName);
        setItemName(data.itemName);
        setBillNo(data.billNo);
        setAmount(String(data.amount));
        setInventoryDate(data.inventoryDate);
        setInventoryTime(data.inventoryTime);
        setGatepassNo(data.gatepassNo || "");
        setRoyaltyNo(data.royaltyNo || "");
        setUnit(data.unit || "KG");
        setDeliveryAddress(data.deliveryAddress || "");
        setVehicleNo(data.vehicleNo);
        setLoadedWeight(String(data.loadedWeight));
        setEmptyWeight(String(data.emptyWeight));
        setSupplierWeight(String(data.supplierWeight));
      }
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "Failed to load receipt details for editing.", 
        variant: "destructive" 
      });
    }
  };

  const generateInventoryNo = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setInventoryNo(`IN1/2027/${String(randomNum).padStart(4, "0")}`);
  };

  // Calculations
  const netWeight = useMemo(() => {
    const loaded = Number(loadedWeight) || 0;
    const empty = Number(emptyWeight) || 0;
    return Math.max(0, loaded - empty);
  }, [loadedWeight, emptyWeight]);

  const weightDifference = useMemo(() => {
    const supplier = Number(supplierWeight) || 0;
    return netWeight - supplier;
  }, [netWeight, supplierWeight]);

  // Clear Form
  const handleClear = () => {
    setPlant("");
    generateInventoryNo();
    setSupplierName("");
    setItemName("");
    setBillNo("");
    setAmount("");
    setGatepassNo("");
    setRoyaltyNo("");
    setUnit("KG");
    setDeliveryAddress("");
    setVehicleNo("");
    setLoadedWeight("");
    setEmptyWeight("");
    setSupplierWeight("");
    
    const today = new Date();
    setInventoryDate(today.toISOString().split("T")[0]);
    setInventoryTime(today.toTimeString().split(" ")[0]);
    
    toast({ title: "Form Cleared", description: "All inputs have been reset." });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plant || !inventoryNo || !supplierName || !itemName || !billNo || !amount || !inventoryDate || !inventoryTime || !unit || !deliveryAddress || !vehicleNo || !loadedWeight || !emptyWeight || !supplierWeight) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all the required fields (marked with *).", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        plant,
        inventoryNo,
        supplierName,
        itemName,
        billNo,
        amount: Number(amount),
        inventoryDate,
        inventoryTime,
        gatepassNo: gatepassNo || "",
        royaltyNo: royaltyNo || "",
        unit,
        deliveryAddress,
        vehicleNo,
        loadedWeight: Number(loadedWeight),
        emptyWeight: Number(emptyWeight),
        netWeight,
        supplierWeight: Number(supplierWeight),
        weightDifference,
      };

      const url = editingId ? `/api/store-inventories/${editingId}` : "/api/store-inventories";
      const method = editingId ? "PUT" : "POST";

      await customFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast({ 
        title: "Success! 🎉", 
        description: `Store inventory receipt ${inventoryNo} successfully ${editingId ? "updated" : "saved"} in the database.` 
      });
      
      navigate("/store/inventory/list");
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "Failed to Save Inventory Receipt. Please check connection and try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StoreLayout
      title={editingId ? "Edit Inventory Receipt" : "Add Inventory"}
      breadcrumbs={[{ label: editingId ? "Edit Inventory" : "Add Inventory" }]}
    >
      <div className="space-y-4 animate-in fade-in duration-500">
        {/* Action Bar with Weighment Settings Button & Live Scale Chip */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/store/inventory/list" className="bg-[#ea580c] hover:bg-[#d97706] text-white gap-2 inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest h-10 px-5 py-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
            <ListPlus className="h-4 w-4" />
            + INVENTORY LIST
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

        {/* Main Grid Card */}
        <div className="bg-white p-6 rounded-xl border shadow-md">

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* COLUMN 1 */}
            <div className="space-y-4">
              
              {/* Plant Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Plant *</Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]">
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

              {/* Inventory No (ReadOnly) */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Inventory No *</Label>
                <Input 
                  value={inventoryNo} 
                  readOnly 
                  className="h-10 text-sm font-semibold bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-mono shadow-inner" 
                />
              </div>

              {/* Supplier Name Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier Name *</Label>
                <Select value={supplierName} onValueChange={setSupplierName}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]">
                    <SelectValue placeholder="Choose Supplier" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {suppliers && suppliers.length > 0 ? (
                      suppliers.map((s: any) => (
                        <SelectItem key={s.id || s._id} value={s.name}>{s.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No suppliers registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Name Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Item Name *</Label>
                <Select value={itemName} onValueChange={setItemName}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]">
                    <SelectValue placeholder="Choose Inventory Item" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    {items && items.length > 0 ? (
                      items.map((i: any) => (
                        <SelectItem key={i.id || i._id} value={i.name}>{i.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>No items configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Bill No */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bill No *</Label>
                <Input 
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  placeholder="Enter Bill No" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Amount *</Label>
                <Input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm font-mono"
                />
              </div>

            </div>

            {/* COLUMN 2 */}
            <div className="space-y-4">
              
              {/* Inventory Date */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Inventory Date *</Label>
                <div className="relative">
                  <Input 
                    type="date"
                    value={inventoryDate}
                    onChange={(e) => setInventoryDate(e.target.value)}
                    className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm pr-10"
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Inventory Time */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Inventory Time *</Label>
                <div className="relative">
                  <Input 
                    type="text"
                    value={inventoryTime}
                    onChange={(e) => setInventoryTime(e.target.value)}
                    placeholder="HH:MM:SS"
                    className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm pr-10 font-mono"
                  />
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Gate Pass No */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Gate pass No :</Label>
                <Input 
                  value={gatepassNo}
                  onChange={(e) => setGatepassNo(e.target.value)}
                  placeholder="Enter Gate pass No" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm"
                />
              </div>

              {/* Royalty No */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Royalty No</Label>
                <Input 
                  value={royaltyNo}
                  onChange={(e) => setRoyaltyNo(e.target.value)}
                  placeholder="Enter Royalty No" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm"
                />
              </div>

              {/* Unit Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="TON">TON</SelectItem>
                    <SelectItem value="BAGS">BAGS</SelectItem>
                    <SelectItem value="LTR">LTR</SelectItem>
                    <SelectItem value="NOS">NOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Delivery Address *</Label>
                <textarea 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 p-2.5 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c]"
                />
              </div>

            </div>

            {/* COLUMN 3: Weighment & Vehicle Details */}
            <div className="space-y-4">
              
              {/* Vehicle No with Dual Input + Dropdown + Ticket Sync Badge */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Vehicle No *</Label>
                  {vehicleTicketsData.tickets.length > 0 && (
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ {vehicleTicketsData.tickets.length} TICKET(S) SYNCED
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Input 
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="Enter or select Vehicle No"
                    className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 uppercase font-mono shadow-sm flex-1"
                  />
                  <Select value={vehicleNo} onValueChange={setVehicleNo}>
                    <SelectTrigger className="h-10 w-10 shrink-0 px-1 bg-white border-slate-200 text-slate-700 shadow-sm">
                      <span className="text-[10px]">▼</span>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700 max-h-[200px]">
                      {availableVehicles.map((v: string, idx: number) => (
                        <SelectItem key={idx} value={v}>{v}</SelectItem>
                      ))}
                      {availableVehicles.length === 0 && (
                        <SelectItem value="LOADING" disabled>No vehicles registered...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {vehicleTicketsData.tickets.length > 0 && (
                  <div className="text-[9px] text-emerald-700 bg-emerald-50/90 px-2 py-1 rounded border border-emerald-200 flex items-center justify-between font-semibold">
                    <span>
                      {vehicleTicketsData.latestEmpty && `Tare: ${vehicleTicketsData.emptyWeight} KG `}
                      {vehicleTicketsData.latestLoaded && `| Gross: ${vehicleTicketsData.loadedWeight} KG`}
                      {vehicleTicketsData.netWeight > 0 && ` | Net: ${vehicleTicketsData.netWeight} KG`}
                    </span>
                    <span className="font-bold text-emerald-800 uppercase text-[8px] bg-emerald-200/60 px-1 rounded">Auto-Loaded</span>
                  </div>
                )}
              </div>

              {/* Loaded Weight */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Loaded Weight ({unit}) *</Label>
                  {vehicleTicketsData.latestLoaded && (
                    <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Auto from Ticket
                    </span>
                  )}
                </div>
                <Input 
                  type="number"
                  value={loadedWeight}
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="Auto-fills on Vehicle select (or enter)" 
                  className="h-10 text-sm font-semibold bg-white border-emerald-200 text-emerald-700 placeholder:text-slate-300 shadow-sm font-mono font-bold"
                />
              </div>

              {/* Empty Weight */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Empty Weight ({unit}) *</Label>
                  {vehicleTicketsData.latestEmpty && (
                    <span className="text-[8px] font-black uppercase text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                      ✓ Auto from Ticket
                    </span>
                  )}
                </div>
                <Input 
                  type="number"
                  value={emptyWeight}
                  onChange={(e) => setEmptyWeight(e.target.value)}
                  placeholder="Auto-fills on Vehicle select (or enter)" 
                  className="h-10 text-sm font-semibold bg-amber-50/40 border-amber-200 text-amber-800 placeholder:text-slate-300 shadow-sm font-mono font-bold"
                />
              </div>

              {/* Net Weight (Calculated, Read-Only) */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Net Weight ({unit}) *</Label>
                <Input 
                  value={netWeight.toFixed(2)} 
                  readOnly 
                  className="h-10 text-sm font-bold bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed font-mono shadow-inner" 
                />
              </div>

              {/* Supplier Weight */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier Weight ({unit}) *</Label>
                <Input 
                  type="number"
                  value={supplierWeight}
                  onChange={(e) => setSupplierWeight(e.target.value)}
                  placeholder="Enter Supplier Weight" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm font-mono"
                />
              </div>

              {/* Weight Difference (Calculated, Read-Only) */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Weight Difference ({unit}) *</Label>
                <Input 
                  value={weightDifference.toFixed(2)} 
                  readOnly 
                  className="h-10 text-sm font-bold bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed font-mono shadow-inner" 
                />
              </div>

            </div>


          </div>

          {/* Form Actions Buttons Centered under Column 2 layout style */}
          <div className="flex justify-center gap-3 pt-6 border-t border-slate-100">
            <Button 
              type="submit"
              disabled={isSaving} 
              className="bg-[#00bcd4] hover:bg-[#00acc1] text-white font-extrabold text-xs tracking-wider uppercase h-10 px-6 gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer border-0"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
              {editingId ? "Save Changes" : "Save Inventory"}
            </Button>
            <Button 
              type="button"
              onClick={() => {
                if (editingId) {
                  navigate("/store/inventory/list");
                } else {
                  handleClear();
                }
              }}
              className="bg-[#e91e63] hover:bg-[#d81b60] text-white font-extrabold text-xs tracking-wider uppercase h-10 px-6 gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer border-0"
            >
              {editingId ? <Undo className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              {editingId ? "Cancel" : "Clear"}
            </Button>
            <Link href="/store/inventory/list">
              <Button 
                type="button"
                className="bg-[#4caf50] hover:bg-[#43a047] text-white font-extrabold text-xs tracking-wider uppercase h-10 px-6 gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                <FileText className="h-4 w-4" />
                Inventory List
              </Button>
            </Link>
          </div>
        </form>
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
            <div className="bg-black/80 rounded-xl p-5 border border-slate-800 flex items-center justify-between shadow-inner">
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
    </StoreLayout>
  );
}

