import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ChevronRight, ListPlus, ChevronDown, ChevronUp } from "lucide-react";
import { 
  useGetCustomers, 
  useGetVehicles, 
  useGetMasters, 
  useGetSalesOrders,
  useGetEmployees,
  useCreateDC 
} from "@workspace/api-client-react";
import { useToast } from "../hooks/use-toast";

export default function AddDC() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form State
  const [isManual, setIsManual] = useState(false);
  const [dcNo, setDcNo] = useState(`DC/26-27/${Math.floor(1000 + Math.random() * 9000)}`);
  const [dcDate, setDcDate] = useState(new Date().toISOString().split("T")[0]);
  const [dcTime, setDcTime] = useState(new Date().toLocaleTimeString("en-GB", { hour12: false }));
  const [plant, setPlant] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [grade, setGrade] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("0");
  const [pumpType, setPumpType] = useState("");
  const [cementName, setCementName] = useState("");
  const [cementGrade, setCementGrade] = useState("OPC 43");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Fields
  const [slump, setSlump] = useState("");
  const [wcRatio, setWcRatio] = useState("");
  const [admixture, setAdmixture] = useState("");
  const [waitingTime, setWaitingTime] = useState("");
  const [loadedPlant, setLoadedPlant] = useState("");
  const [loadedQty, setLoadedQty] = useState("");
  const [loadedGrade, setLoadedGrade] = useState("");
  const [transportCharge, setTransportCharge] = useState("");
  const [pumpCharge, setPumpCharge] = useState("");

  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();
  const { data: employees } = useGetEmployees();
  const { data: pumps } = useGetMasters("pump");
  const { data: grades } = useGetMasters("grade");
  const { data: sites } = useGetMasters("site");
  const { data: plants } = useGetMasters("plant");

  useMemo(() => {
    if (plants && plants.length > 0) {
      if (!plant) setPlant(String(plants[0].name || plants[0].id || ""));
      if (!loadedPlant) setLoadedPlant(String(plants[0].name || plants[0].id || ""));
    }
  }, [plants, plant, loadedPlant]);

  const gradesList = useMemo(() => {
    if (grades && grades.length > 0) {
      return grades.map((g: any) => g.name);
    }
    return [];
  }, [grades]);

  const drivers = useMemo(() => {
    if (!employees) return [];
    return (employees as any[]).filter(e => 
      e.designation?.toLowerCase().includes("driver") || 
      e.role?.toLowerCase().includes("driver") ||
      true // Fallback to all employees if roles aren't defined strictly
    );
  }, [employees]);
  const { data: allSalesOrders } = useGetSalesOrders();

  const selectedCustomer = useMemo(() => customers?.find(c => String(c.id) === customerId), [customers, customerId]);
  const selectedVehicle = useMemo(() => vehicles?.find(v => String(v.id) === vehicleId), [vehicles, vehicleId]);

  // Totals Calculation
  const totals = useMemo(() => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    const gross = q * r;
    const cgst = gross * 0.09;
    const sgst = gross * 0.09;
    const tcs = gross * 0.001;
    const net = Math.round(gross + cgst + sgst + tcs);
    return { gross, cgst, sgst, tcs, net };
  }, [qty, rate]);

  const createDC = useCreateDC({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Delivery Challan saved successfully" });
        setLocation("/dc/list");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message || "Failed to save DC", variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    if (!customerId || !vehicleId || !qty || !grade) {
      toast({ title: "Validation Error", description: "Please fill all required fields (*)", variant: "destructive" });
      return;
    }

    createDC.mutate({
      dcNumber: dcNo,
      dcDate,
      dcTime,
      plant,
      customerid: customerId,
      vehicleid: vehicleId,
      siteId: siteId || null,
      driverName,
      grade,
      quantity: parseFloat(qty),
      netAmount: totals.net,
      cementName,
      cementGrade,
      pumpType,
      slump: parseFloat(slump) || null,
      wcRatio: parseFloat(wcRatio) || null,
      admixture,
      waitingTime: parseInt(waitingTime) || null,
      loadedPlant,
      loadedQuantity: parseFloat(loadedQty) || null,
      loadedGrade,
      transportCharge: parseFloat(transportCharge) || null,
      pumpCharge: parseFloat(pumpCharge) || null,
      status: "pending",
      destination: selectedCustomer?.address || ""
    });
  };

  const handleClear = () => {
    setCustomerId("");
    setVehicleId("");
    setSiteId("");
    setDriverName("");
    setGrade("");
    setQty("");
    setRate("0");
    setPumpType("");
    setCementName("");
    setSlump("");
    setWcRatio("");
    setAdmixture("");
    setWaitingTime("");
    setLoadedQty("");
    setTransportCharge("");
    setPumpCharge("");
  };

  const infoPanel = [
    { label: "Customer Name", value: selectedCustomer?.name || "" },
    { label: "Customer Phone", value: selectedCustomer?.contact || "" },
    { label: "Site Name", value: siteId || "" },
    { label: "Site Address", value: selectedCustomer?.address || "" },
    { label: "Grade", value: grade },
    { label: "Rate", value: rate ? `₹${rate}` : "" },
    { label: "Quantity", value: qty ? `${qty} m³` : "" },
    { label: "Balanced Quantity", value: "" },
    { label: "Gross Price", value: totals.gross ? `₹${totals.gross.toFixed(2)}` : "" },
    { label: "Tax Price", value: (totals.cgst + totals.sgst).toFixed(2) },
    { label: "CGST %", value: "9%" },
    { label: "SGST %", value: "9%" },
    { label: "IGST %", value: "0%" },
    { label: "TCS Amount", value: totals.tcs ? `₹${totals.tcs.toFixed(2)}` : "" },
    { label: "Net Price", value: totals.net ? `₹${totals.net}` : "" },
    { label: "IN WORDS", value: "" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add DC</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dc" className="hover:text-primary transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dc/delivery-challan" className="hover:text-primary transition-colors">Delivery Challan</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Add DC</span>
        </nav>
      </div>

      <div className="flex justify-start mb-4">
        <Link href="/dc/list">
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2">
            <ListPlus className="h-4 w-4" />
            + DC List
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

            <div className="space-y-2">
              <Label className="text-sm font-semibold">DC No <span className="text-rose-500">*</span></Label>
              <div className="flex gap-2">
                <Input 
                  value={dcNo} 
                  onChange={(e) => setDcNo(e.target.value)} 
                  readOnly={!isManual} 
                  className={`bg-gray-100 h-10 flex-1 ${!isManual && 'text-gray-500'}`} 
                />
                <Button 
                  onClick={() => setIsManual(!isManual)} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white whitespace-nowrap px-4 h-10 text-xs"
                >
                  {isManual ? "Auto Generate" : "For Manual"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">DC Date</Label>
              <Input type="date" value={dcDate} onChange={e => setDcDate(e.target.value)} className="bg-white h-10" />
            </div>

             <div className="space-y-2">
              <Label className="text-sm font-semibold">Plant <span className="text-rose-500">*</span></Label>
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Plant" /></SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label className="text-sm font-semibold">DC Time <span className="text-rose-500">*</span></Label>
              <Input type="time" value={dcTime} onChange={e => setDcTime(e.target.value)} step="1" className="bg-white h-10" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Customer <span className="text-rose-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Vehicle No <span className="text-rose-500">*</span></Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles?.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.registrationNo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Site Name <span className="text-rose-500">*</span></Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Site" /></SelectTrigger>
                <SelectContent>
                  {sites?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

             <div className="space-y-2">
              <Label className="text-sm font-semibold">Driver Name :</Label>
              <Select value={driverName} onValueChange={setDriverName}>
                <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Driver" /></SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {drivers.length > 0 ? (
                    drivers.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled>No drivers registered</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">DC Grade <span className="text-rose-500">*</span></Label>
              <div className="flex gap-1">
                <Input
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="Grade"
                  className="bg-white h-10 flex-1 font-semibold border-slate-200 text-slate-700"
                />
                <Select value={gradesList.includes(grade) ? grade : ""} onValueChange={setGrade}>
                  <SelectTrigger className="bg-white h-10 w-10 shrink-0 border-slate-200 text-slate-600 px-1">
                    <span className="text-[10px]">▼</span>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-700">
                    {gradesList.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold invisible">Actions</Label>
              <div className="flex gap-2 items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-sky-400 hover:bg-sky-500 text-white flex-1 h-10 text-xs font-semibold">Select By PO</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Select Sales Order / PO</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      {allSalesOrders?.filter(o => String(o.customerId) === customerId).map((order: any) => (
                        <div key={order.id} className="p-4 border rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                             onClick={() => {
                               if (order.items && order.items.length > 0) {
                                 setGrade(order.items[0].grade);
                                 setRate(String(order.items[0].rate));
                               }
                               toast({ title: "PO Selected", description: `Applied grade/rate from ${order.poNumber}` });
                             }}>
                          <div>
                            <p className="font-bold">{order.poNumber} ({order.poDate})</p>
                            <p className="text-sm text-gray-500">Items: {order.items?.length || 0}</p>
                          </div>
                          <Button size="sm">Select</Button>
                        </div>
                      ))}
                      {customerId && (!allSalesOrders || allSalesOrders.filter(o => String(o.customerId) === customerId).length === 0) && (
                        <p className="text-center text-gray-500 py-8">No matching Sales Orders found for this customer.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-semibold text-gray-500">Pump :</Label>
                  <Select value={pumpType} onValueChange={setPumpType}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Pump" /></SelectTrigger>
                    <SelectContent>
                      {pumps && pumps.length > 0 ? (
                        pumps.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)
                      ) : (
                        <SelectItem value="_empty" disabled>No pumps configured</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">DC Quantity <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="Enter DC Quantity Here..."
                value={qty}
                onChange={e => setQty(e.target.value)}
                type="number"
                step="0.5"
                className="bg-white h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Net Amount <span className="text-rose-500">*</span></Label>
              <Input value={totals.net ? `₹${totals.net}` : ""} readOnly className="bg-gray-100 h-10 text-gray-600 font-semibold" placeholder="Auto-calculated" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-500">Cement Name</Label>
              <Input className="bg-white h-10" placeholder="e.g. Ultratech" value={cementName} onChange={e => setCementName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-500">Cement Grade</Label>
              <Select value={cementGrade} onValueChange={setCementGrade}>
                <SelectTrigger className="bg-white h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPC 43">OPC 43</SelectItem>
                  <SelectItem value="OPC 53">OPC 53</SelectItem>
                  <SelectItem value="PPC">PPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 gap-2 h-9 text-sm"
              onClick={() => setShowAdvanced(v => !v)}
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showAdvanced ? "Hide" : "Show"} Advance Options
            </Button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4 p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Slump (mm)</Label>
                  <Input type="number" placeholder="e.g. 75" className="bg-white h-10" value={slump} onChange={e => setSlump(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">W/C Ratio</Label>
                  <Input type="number" step="0.01" placeholder="e.g. 0.45" className="bg-white h-10" value={wcRatio} onChange={e => setWcRatio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Admixture</Label>
                  <Input placeholder="Enter Admixture" className="bg-white h-10" value={admixture} onChange={e => setAdmixture(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Waiting Time (min)</Label>
                  <Input type="number" placeholder="0" className="bg-white h-10" value={waitingTime} onChange={e => setWaitingTime(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Loaded Plant</Label>
                  <Select value={loadedPlant} onValueChange={setLoadedPlant}>
                    <SelectTrigger className="bg-white h-10"><SelectValue placeholder="Choose Plant" /></SelectTrigger>
                    <SelectContent>
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
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Loaded Quantity (m³)</Label>
                  <Input type="number" step="0.5" placeholder="0" className="bg-white h-10" value={loadedQty} onChange={e => setLoadedQty(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Loaded Grade</Label>
                  <div className="flex gap-1">
                    <Input
                      value={loadedGrade}
                      onChange={e => setLoadedGrade(e.target.value)}
                      placeholder="Loaded Grade"
                      className="bg-white h-10 flex-1 font-semibold border-slate-200 text-slate-700"
                    />
                    <Select value={gradesList.includes(loadedGrade) ? loadedGrade : ""} onValueChange={setLoadedGrade}>
                      <SelectTrigger className="bg-white h-10 w-10 shrink-0 border-slate-200 text-slate-600 px-1">
                        <span className="text-[10px]">▼</span>
                      </SelectTrigger>
                      <SelectContent className="bg-white text-slate-700">
                        {gradesList.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Transport Charge (₹)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" className="bg-white h-10" value={transportCharge} onChange={e => setTransportCharge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-500">Pump Charge (₹)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" className="bg-white h-10" value={pumpCharge} onChange={e => setPumpCharge(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 h-10 font-bold" onClick={handleSave} disabled={createDC.isPending}>
              {createDC.isPending ? "Saving..." : "Save DC"}
            </Button>
            <Button className="bg-orange-400 hover:bg-orange-500 text-white px-8 h-10 font-bold" onClick={handleClear}>Clear</Button>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden flex flex-col">
          <div className="h-2 bg-gradient-to-r from-[#1e40af] to-cyan-600" />
          <div className="p-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">DC Information Panel</p>
          </div>
          <div className="flex flex-col flex-1">
            {infoPanel.map((item, idx) => (
              <div key={idx} className="flex border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="w-36 bg-[#4e9fa3] text-white p-2 text-xs font-semibold flex items-center shrink-0">
                  {item.label} :
                </div>
                <div className="flex-1 bg-gray-50 p-2 min-h-[30px] text-xs font-medium text-gray-700">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
