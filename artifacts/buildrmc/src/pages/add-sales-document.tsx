import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetCustomers,
  useGetVehicles,
  useGetDeliveryChallans,
  useCreateInvoice,
  getGetInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Plus, Calendar, Clock, Trash2, RefreshCw } from "lucide-react";

const PLANTS = ["FORTUNE CONCRETE", "NARVAL RMC"];

const FY_PREFIX = (() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  return `${String(fyStart % 100).padStart(2, "0")}-${String(fyEnd).padStart(2, "0")}`;
})();

function generateInvoiceNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV/${FY_PREFIX}/${rand}`;
}

export default function AddSalesDocument() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInvoice = useCreateInvoice();

  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();
  const { data: allDcs } = useGetDeliveryChallans();

  // Form State
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [customerId, setCustomerId] = useState<string>("");
  const [siteName, setSiteName] = useState("");
  const [remark, setRemark] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceTime, setInvoiceTime] = useState(new Date().toTimeString().slice(0, 8));
  const [vehicleNo, setVehicleNo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  // Auto-update clock feature
  const [isAutoTime, setIsAutoTime] = useState(true);

  useEffect(() => {
    if (!isAutoTime) return;
    const timer = setInterval(() => {
      setInvoiceTime(new Date().toTimeString().slice(0, 8));
      setInvoiceDate(new Date().toISOString().slice(0, 10));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoTime]);

  // Selected DCs for the current customer
  const filteredDcs = useMemo(() => {
    if (!allDcs || !customerId) return [];
    return (allDcs as any[]).filter(dc => String(dc.customerId?._id || dc.customerId) === customerId);
  }, [allDcs, customerId]);

  const [selectedDcIds, setSelectedDcIds] = useState<string[]>([]);

  // Line Items State
  const [items, setItems] = useState<any[]>([
    { id: 1, name: "RMC M25", qty: 0, rate: 0, taxRate: 18, includeTax: false }
  ]);

  useEffect(() => {
    if (!customerId || !customers) return;
    const c = customers.find((x) => String(x.id) === customerId);
    if (c) {
      setSiteName(c.name || "");
      setSiteAddress(c.address || "");
    }
  }, [customerId, customers]);

  const totals = useMemo(() => {
    let taxable = 0;
    let tax = 0;
    items.forEach(it => {
      const lineTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
      taxable += lineTotal;
      tax += (lineTotal * (parseFloat(it.taxRate) || 0)) / 100;
    });
    const tcs = 0;
    const beforeRound = taxable + tax + tcs;
    const net = Math.round(beforeRound);
    const roundOff = net - beforeRound;

    return { taxable, tax, tcs, roundOff, net };
  }, [items]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: "", qty: 0, rate: 0, taxRate: 18, includeTax: false }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(it => it.id !== id));
  };

  const updateItem = (id: number, field: string, val: any) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Select Customer", variant: "destructive" });
      return;
    }
    
    createInvoice.mutate({
      data: {
        invoiceNumber,
        invoiceDate,
        customerid: customerId,
        totalAmount: totals.net,
        status: "pending",
        plant,
        site: siteName,
        remark,
        invoiceTime,
        vehicleNo,
        quantity: items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0),
        netAmount: totals.taxable,
        cgstRate: 9,
        sgstRate: 9,
        isBillReceived: false
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sales Document Saved" });
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setLocation("/billing/sales-document");
      },
      onError: (err: any) => {
        const errorDetail = err?.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message;
        alert("CRITICAL ERROR FROM SERVER:\n" + errorDetail);
        toast({ title: "Failed to save document", description: err?.response?.data?.error || err.message || "Unknown error", variant: "destructive" });
        console.error("Save Document Error:", err);
      }
    });
  };

  const handleAppend = () => {
    if (selectedDcIds.length === 0) {
      toast({ title: "Select at least one DC", variant: "destructive" });
      return;
    }

    const selectedDcs = filteredDcs.filter(dc => selectedDcIds.includes(dc.id));
    const newItems = selectedDcs.map(dc => ({
      id: Date.now() + Math.random(),
      name: dc.grade || "RMC",
      qty: dc.quantity || 0,
      rate: dc.rate || 0,
      taxRate: 18,
      includeTax: false,
      dcNo: dc.dcNumber
    }));

    setItems([...items, ...newItems]);
    setSelectedDcIds([]); // Clear selection after append
    toast({ title: `${selectedDcs.length} DC(s) appended to items` });
  };

  const handleClear = () => {
    setCustomerId("");
    setSiteName("");
    setSiteAddress("");
    setVehicleNo("");
    setRemark("");
    setItems([{ id: Date.now(), name: "RMC M25", qty: 0, rate: 0, taxRate: 18, includeTax: false }]);
    setIsAutoTime(true);
    toast({ title: "Form Cleared" });
  };

  const labelStyle = "text-[8px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-6 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-1.5";
  const tableHeaderStyle = "bg-[#1e40af] text-white text-[8px] font-black uppercase py-1 px-1 border-r border-white/5 last:border-0 text-center tracking-tighter whitespace-nowrap";

  return (
    <div className="bg-[#f8fafc] h-full overflow-hidden flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase">New Sales Document Registration</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
              <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href="/billing" className="hover:text-[#1e40af]">Billing</Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-[#1e40af]">Add Sales Document</span>
            </nav>
          </div>
          <div className="flex gap-1.5">
             <Button type="submit" size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0">Save Document</Button>
             <Button type="button" onClick={handleClear} size="sm" variant="outline" className="border-rose-100 text-rose-500 hover:bg-rose-50 font-black text-[9px] px-3 h-6 uppercase tracking-wider border">Clear Form</Button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-hidden p-2 flex flex-col gap-2 min-h-0">
          {/* Top Section: Form + DC Table */}
          <div className="flex gap-3 shrink-0">
            {/* Left: Input Form (approx 45%) */}
            <div className="flex-[0.45] grid grid-cols-2 gap-x-2 gap-y-1.5 border-r pr-3">
              <div className="col-span-1">
                <Label className={labelStyle}>Plant <span className="text-red-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANTS.map(p => <SelectItem key={p} value={p} className="text-[10px]">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label className={labelStyle}>Invoice No</Label>
                <Input value={invoiceNumber} readOnly className={`${inputStyle} bg-gray-50/50 border-dashed text-gray-600`} />
              </div>

              <div>
                <Label className={labelStyle}>Invoice Date</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={e => { setInvoiceDate(e.target.value); setIsAutoTime(false); }} 
                    className={`${inputStyle} w-full pr-6`} 
                  />
                  {!isAutoTime && <RefreshCw onClick={() => setIsAutoTime(true)} className="absolute right-1.5 top-1.5 h-3 w-3 text-cyan-500 cursor-pointer" />}
                </div>
              </div>
              <div>
                <Label className={labelStyle}>Invoice Time</Label>
                <div className="relative">
                  <Input 
                    type="time" 
                    step="1" 
                    value={invoiceTime} 
                    onChange={e => { setInvoiceTime(e.target.value); setIsAutoTime(false); }} 
                    className={`${inputStyle} w-full pr-6`} 
                  />
                  {isAutoTime && <Clock className="absolute right-1.5 top-1.5 h-3 w-3 text-cyan-500 animate-pulse" />}
                </div>
              </div>

              <div className="col-span-2">
                <Label className={labelStyle}>Customer <span className="text-red-500">*</span></Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-[10px]">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelStyle}>Vehicle No</Label>
                <Input placeholder="Vehicle NO" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className={inputStyle} />
              </div>
              <div>
                <Label className={labelStyle}>Site Name</Label>
                <Input value={siteName} readOnly className={`${inputStyle} bg-gray-50/30 text-gray-500`} />
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Site Address</Label>
                <Input value={siteAddress} readOnly className={`${inputStyle} bg-gray-50/30 text-gray-500`} />
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Remark / Note</Label>
                <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Optional note..." className={inputStyle} />
              </div>
            </div>

            {/* Right: Full DC Selection (approx 55%) */}
            <div className="flex-[0.55] border border-gray-100 rounded overflow-hidden flex flex-col bg-white h-[140px]">
              <div className="flex bg-[#1e40af] shrink-0">
                <div className={tableHeaderStyle + " w-8"}>S/L</div>
                <div className={tableHeaderStyle + " w-16"}>DC No</div>
                <div className={tableHeaderStyle + " w-16"}>DC Date</div>
                <div className={tableHeaderStyle + " flex-1 text-left"}>Item</div>
                <div className={tableHeaderStyle + " w-14 text-right"}>Qty</div>
                <div className={tableHeaderStyle + " w-14 text-right"}>Rate</div>
                <div className={tableHeaderStyle + " w-16 text-right"}>Amount</div>
                <div className={tableHeaderStyle + " w-10 flex items-center justify-center gap-1"}>
                  <Checkbox className="h-2.5 w-2.5 border-white" />
                  <span className="text-[7px]">All</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100">
                {filteredDcs.length > 0 ? (
                  filteredDcs.map((dc, idx) => (
                    <div key={dc.id} className="flex border-b text-[8px] items-center hover:bg-gray-50 py-0.5 font-bold">
                      <div className="w-8 text-center text-gray-500 border-r">{idx + 1}</div>
                      <div className="w-16 px-1 border-r truncate">{dc.dcNumber}</div>
                      <div className="w-16 px-1 border-r truncate">{dc.dcDate}</div>
                      <div className="flex-1 px-1 border-r truncate text-gray-600">{dc.grade || "RMC"}</div>
                      <div className="w-14 text-right px-1 border-r font-black text-cyan-600">{dc.quantity || 0}</div>
                      <div className="w-14 text-right px-1 border-r">{dc.rate || 0}</div>
                      <div className="w-16 text-right px-1 border-r">{(dc.quantity || 0) * (dc.rate || 0)}</div>
                      <div className="w-10 text-center">
                        <Checkbox 
                          checked={selectedDcIds.includes(dc.id)} 
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedDcIds([...selectedDcIds, dc.id]);
                            else setSelectedDcIds(selectedDcIds.filter(id => id !== dc.id));
                          }}
                          className="h-2.5 w-2.5"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-[8px] italic">
                    No DCs Available
                  </div>
                )}
              </div>
              <div className="p-1 border-t bg-gray-50/50 flex justify-center gap-2 shrink-0">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAppend}
                  className="bg-[#4DB6AC] hover:bg-[#3d9189] h-5 text-[8px] font-black px-4 uppercase tracking-tighter shadow-none"
                >
                  Append
                </Button>
                <Button type="button" size="sm" className="bg-[#4FC3F7] hover:bg-[#3ba8d8] h-5 text-[8px] font-black px-4 uppercase tracking-tighter shadow-none">View DC</Button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex-1 border border-gray-100 rounded overflow-hidden flex flex-col bg-white min-h-[140px]">
            <div className="flex bg-gray-50 border-b shrink-0">
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r w-8 text-center">#</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r flex-1">Item Description</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r w-16 text-right">Qty</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r w-20 text-right">Rate</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r w-14 text-center">Tax %</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r w-24 text-right">Taxable</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 border-r w-24 text-right">Tax</div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter p-1.5 w-24 text-right">Net Amt</div>
                <div className="w-6 p-1.5 text-center">
                   <Button type="button" variant="ghost" onClick={addItem} className="h-4 w-4 p-0 text-[#1e40af]"><Plus className="h-2.5 w-2.5" /></Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-50">
              {items.map((it, idx) => {
                const gross = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                const tax = (gross * (parseFloat(it.taxRate) || 0)) / 100;
                const net = gross + tax;
                return (
                  <div key={it.id} className="flex border-b items-center hover:bg-gray-50/30 group py-0">
                    <div className="w-8 text-center text-[9px] font-bold text-gray-200 border-r py-0.5">{idx + 1}</div>
                    <div className="flex-1 border-r h-full"><Input value={it.name} onChange={e => updateItem(it.id, "name", e.target.value)} className="h-6 border-0 focus-visible:ring-0 text-[10px] px-2 shadow-none font-bold" /></div>
                    <div className="w-16 border-r h-full"><Input type="number" value={it.qty} onChange={e => updateItem(it.id, "qty", e.target.value)} className="h-6 border-0 focus-visible:ring-0 text-[10px] px-1 text-right shadow-none font-black text-cyan-600" /></div>
                    <div className="w-20 border-r h-full"><Input type="number" value={it.rate} onChange={e => updateItem(it.id, "rate", e.target.value)} className="h-6 border-0 focus-visible:ring-0 text-[10px] px-1 text-right shadow-none font-bold" /></div>
                    <div className="w-14 border-r h-full"><Input type="number" value={it.taxRate} onChange={e => updateItem(it.id, "taxRate", e.target.value)} className="h-6 border-0 focus-visible:ring-0 text-[10px] px-1 text-center shadow-none text-gray-500" /></div>
                    <div className="w-24 border-r py-0.5 text-right px-2 text-[10px] font-bold text-gray-500 bg-gray-50/10">{gross.toFixed(2)}</div>
                    <div className="w-24 border-r py-0.5 text-right px-2 text-[10px] font-bold text-gray-500 bg-gray-50/10">{tax.toFixed(2)}</div>
                    <div className="w-24 py-0.5 text-right px-2 text-[10px] font-black text-[#1e40af] bg-gray-50/20">{net.toFixed(2)}</div>
                    <div className="w-6 p-0 text-center">
                      <Button type="button" variant="ghost" onClick={() => removeItem(it.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 h-5 w-5 p-0 transition-colors">
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Summary Bar */}
          <div className="flex items-center justify-between bg-slate-900 rounded-md p-1.5 px-3 shrink-0 text-white shadow-md">
            <div className="flex gap-5">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Taxable Total</span>
                    <span className="text-[10px] font-black">₹{totals.taxable.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Total Tax</span>
                    <span className="text-[10px] font-black">₹{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Round Off</span>
                    <span className="text-[10px] font-bold text-gray-500">{totals.roundOff.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right">
                    <div className="text-[8px] font-black text-[#1e40af] uppercase tracking-tighter opacity-80">Total Payable</div>
                    <div className="text-[16px] font-black leading-none tracking-tighter">₹ {totals.net.toLocaleString("en-IN")}</div>
                </div>
                <div className="h-6 w-px bg-white/10 mx-1" />
                <Button type="submit" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[10px] px-6 h-7 uppercase tracking-wider border-0 shadow-none">Finalize & Print</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
