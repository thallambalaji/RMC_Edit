import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChevronRight, Save, Loader2, Archive, Calendar, Clock,
  ArrowRight, ShieldAlert, FileText, CheckCircle2, RotateCcw, Undo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useGetVehicles } from "@workspace/api-client-react";
import { StoreLayout } from "@/components/store-layout";

export default function AddInventory() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form States
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
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
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Flat no. 805, Rakesh Residency, Road no.7, PJR Colony, Chanda Nagar, Ranga Reddy, Telangana"
  );
  
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
    setPlant("FORTUNE CONCRETE");
    generateInventoryNo();
    setSupplierName("");
    setItemName("");
    setBillNo("");
    setAmount("");
    setGatepassNo("");
    setRoyaltyNo("");
    setUnit("KG");
    setDeliveryAddress("Flat no. 805, Rakesh Residency, Road no.7, PJR Colony, Chanda Nagar, Ranga Reddy, Telangana");
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
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#1e40af] focus:border-[#1e40af]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                    <SelectItem value="MARVAL RMC">MARVAL RMC</SelectItem>
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
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#1e40af] focus:border-[#1e40af]">
                    <SelectValue placeholder="Choose Supplier" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="ACC Cements">ACC Cements</SelectItem>
                    <SelectItem value="Local Quarry">Local Quarry</SelectItem>
                    <SelectItem value="Ramesh Quarry">Ramesh Quarry</SelectItem>
                    <SelectItem value="BASF India">BASF India</SelectItem>
                    <SelectItem value="NTPC Fly Ash">NTPC Fly Ash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Item Name Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Item Name *</Label>
                <Select value={itemName} onValueChange={setItemName}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#1e40af] focus:border-[#1e40af]">
                    <SelectValue placeholder="Choose Inventory Item" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="Cement OPC 53">Cement OPC 53</SelectItem>
                    <SelectItem value="River Sand (Coarse)">River Sand (Coarse)</SelectItem>
                    <SelectItem value="20mm Granite Chips">20mm Granite Chips</SelectItem>
                    <SelectItem value="10mm Granite Chips">10mm Granite Chips</SelectItem>
                    <SelectItem value="Admixture (Plasticizer)">Admixture (Plasticizer)</SelectItem>
                    <SelectItem value="Fly Ash">Fly Ash</SelectItem>
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
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#1e40af] focus:border-[#1e40af]">
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
                  className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 p-2.5 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1e40af] focus:border-[#1e40af]"
                />
              </div>

            </div>

            {/* COLUMN 3 */}
            <div className="space-y-4">
              
              {/* Vehicle No Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Vehicle No *</Label>
                <Select value={vehicleNo} onValueChange={setVehicleNo}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-[#1e40af] focus:border-[#1e40af]">
                    <SelectValue placeholder="Choose Vehicle" />
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

              {/* Loaded Weight */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Loaded Weight *</Label>
                <Input 
                  type="number"
                  value={loadedWeight}
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="Enter Loaded Weight" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm font-mono"
                />
              </div>

              {/* Empty Weight */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Empty Weight *</Label>
                <Input 
                  type="number"
                  value={emptyWeight}
                  onChange={(e) => setEmptyWeight(e.target.value)}
                  placeholder="Enter Empty Weight" 
                  className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm font-mono"
                />
              </div>

              {/* Net Weight (Calculated, Read-Only) */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Net Weight *</Label>
                <Input 
                  value={netWeight.toFixed(2)} 
                  readOnly 
                  className="h-10 text-sm font-bold bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-mono shadow-inner" 
                />
              </div>

              {/* Supplier Weight */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier Weight *</Label>
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
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Weight Difference *</Label>
                <Input 
                  value={weightDifference.toFixed(2)} 
                  readOnly 
                  className="h-10 text-sm font-bold bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-mono shadow-inner" 
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
    </div>
    </StoreLayout>
  );
}
