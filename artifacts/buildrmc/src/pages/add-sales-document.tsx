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
import { ChevronRight, Plus, Calendar, Clock, Trash2 } from "lucide-react";

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
    toast({ title: "Form Cleared" });
  };

  const labelStyle = "text-[11px] font-bold text-gray-600 mb-1 block";
  const inputStyle = "h-8 text-xs border-gray-300 rounded shadow-sm focus:ring-[#3DB9C1]";
  const tableHeaderStyle = "bg-[#00BCD4] text-white text-[10px] font-bold uppercase py-2 px-3 border-r border-white/20 last:border-0";

  return (
    <div className="bg-[#f1f5f9] min-h-screen p-4">
      <form onSubmit={handleSubmit} className="max-w-[1500px] mx-auto bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-[#3DB9C1]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
          <h2 className="text-xl font-extrabold text-gray-800">Add Sales Document</h2>
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold uppercase">
            <Link href="/dashboard" className="hover:text-[#3DB9C1]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/billing" className="hover:text-[#3DB9C1]">Billing</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Sales Document</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#3DB9C1]">Add Sales Document</span>
          </nav>
        </div>

        {/* Main Body Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Input Form */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label className={labelStyle}>Plant <span className="text-red-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelStyle}>Invoice Date</Label>
                <div className="relative">
                  <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={`${inputStyle} pr-8`} />
                  <Calendar className="absolute right-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label className={labelStyle}>Invoice No <span className="text-red-500">*</span></Label>
                <Input value={invoiceNumber} readOnly className={`${inputStyle} bg-gray-50`} />
              </div>
              <div>
                <Label className={labelStyle}>Invoice Time <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input type="time" step="1" value={invoiceTime} onChange={e => setInvoiceTime(e.target.value)} className={`${inputStyle} pr-8`} />
                  <Clock className="absolute right-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Customer <span className="text-red-500">*</span></Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelStyle}>Vehicle No</Label>
                <Input placeholder="Enter Vehicle NO" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className={inputStyle} />
              </div>
              <div>
                <Label className={labelStyle}>Site Name <span className="text-red-500">*</span></Label>
                <Select value={siteName} onValueChange={setSiteName}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Site" /></SelectTrigger>
                  <SelectContent>
                    {siteName ? <SelectItem value={siteName}>{siteName}</SelectItem> : <SelectItem value="placeholder" disabled>No Site Available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Site Address <span className="text-red-500">*</span></Label>
                <Input value={siteAddress} readOnly className={`${inputStyle} bg-gray-50`} />
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Remark</Label>
                <Input value={remark} onChange={e => setRemark(e.target.value)} className={inputStyle} />
              </div>
            </div>

            {/* Right: DC Selection Table */}
            <div className="border rounded-md overflow-hidden flex flex-col shadow-sm">
              <div className="flex bg-[#00BCD4]">
                <div className={tableHeaderStyle + " w-[60px]"}>S/L No</div>
                <div className={tableHeaderStyle + " flex-1"}>DC No</div>
                <div className={tableHeaderStyle + " flex-1"}>DC Date</div>
                <div className={tableHeaderStyle + " flex-1"}>Item</div>
                <div className={tableHeaderStyle + " w-[80px]"}>Quantity</div>
                <div className={tableHeaderStyle + " w-[80px]"}>Rate</div>
                <div className={tableHeaderStyle + " w-[100px]"}>Amount</div>
                <div className={tableHeaderStyle + " w-[40px]"}><Checkbox className="border-white" /></div>
              </div>
              <div className="flex-1 bg-white min-h-[250px] overflow-y-auto">
                {filteredDcs.length > 0 ? (
                  filteredDcs.map((dc, idx) => (
                    <div key={dc.id} className="flex border-b text-[10px] items-center hover:bg-gray-50">
                      <div className="w-[60px] p-2 text-center border-r">{idx + 1}</div>
                      <div className="flex-1 p-2 border-r">{dc.dcNumber}</div>
                      <div className="flex-1 p-2 border-r">{dc.dcDate}</div>
                      <div className="flex-1 p-2 border-r">{dc.grade || "RMC"}</div>
                      <div className="w-[80px] p-2 text-right border-r">{dc.quantity || 0}</div>
                      <div className="w-[80px] p-2 text-right border-r">{dc.rate || 0}</div>
                      <div className="w-[100px] p-2 text-right border-r">{(dc.quantity || 0) * (dc.rate || 0)}</div>
                      <div className="w-[40px] p-2 text-center">
                        <Checkbox 
                          checked={selectedDcIds.includes(dc.id)} 
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedDcIds([...selectedDcIds, dc.id]);
                            else setSelectedDcIds(selectedDcIds.filter(id => id !== dc.id));
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                    No Delivery Challans available for selected customer
                  </div>
                )}
              </div>
              <div className="p-2 border-t flex justify-center gap-2 bg-gray-50">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAppend}
                  className="bg-[#4DB6AC] hover:bg-[#3d9189] h-7 text-[10px] font-bold px-4"
                >
                  APPEND
                </Button>
                <Button type="button" size="sm" className="bg-[#4FC3F7] hover:bg-[#3ba8d8] h-7 text-[10px] font-bold px-4">VIEW DC</Button>
              </div>
            </div>
          </div>

          {/* Bottom Wide Table: Line Items */}
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-transparent border-b">
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[60px]">S/L No</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r">Item Name</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[100px]">Quantity</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[100px]">Rate</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[80px]">Tax @ %</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[80px] text-center">Include Tax</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[120px]">Gross Amount</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 border-r w-[120px]">Tax Amount</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-600 w-[120px]">Net Amount</TableHead>
                  <TableHead className="w-[40px] text-center p-0">
                    <Button type="button" variant="ghost" onClick={addItem} className="h-full w-full p-0 text-[#3DB9C1] hover:bg-gray-100"><Plus className="h-4 w-4" /></Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, idx) => {
                  const gross = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                  const tax = (gross * (parseFloat(it.taxRate) || 0)) / 100;
                  const net = gross + tax;
                  return (
                    <TableRow key={it.id} className="h-10 hover:bg-transparent border-b">
                      <TableCell className="text-center text-xs font-medium border-r">{idx + 1}</TableCell>
                      <TableCell className="p-0 border-r"><Input value={it.name} onChange={e => updateItem(it.id, "name", e.target.value)} className="h-full border-0 focus-visible:ring-0 text-xs px-3 shadow-none" /></TableCell>
                      <TableCell className="p-0 border-r"><Input type="number" value={it.qty} onChange={e => updateItem(it.id, "qty", e.target.value)} className="h-full border-0 focus-visible:ring-0 text-xs px-3 text-right shadow-none" /></TableCell>
                      <TableCell className="p-0 border-r"><Input type="number" value={it.rate} onChange={e => updateItem(it.id, "rate", e.target.value)} className="h-full border-0 focus-visible:ring-0 text-xs px-3 text-right shadow-none" /></TableCell>
                      <TableCell className="p-0 border-r"><Input type="number" value={it.taxRate} onChange={e => updateItem(it.id, "taxRate", e.target.value)} className="h-full border-0 focus-visible:ring-0 text-xs px-3 text-center shadow-none" /></TableCell>
                      <TableCell className="text-center border-r"><Checkbox checked={it.includeTax} onCheckedChange={v => updateItem(it.id, "includeTax", !!v)} /></TableCell>
                      <TableCell className="bg-gray-50 text-right text-xs px-3 border-r font-medium">{gross.toFixed(2)}</TableCell>
                      <TableCell className="bg-gray-50 text-right text-xs px-3 border-r font-medium">{tax.toFixed(2)}</TableCell>
                      <TableCell className="bg-gray-50 text-right text-xs px-3 font-bold">{net.toFixed(2)}</TableCell>
                      <TableCell className="text-center p-0"><Button type="button" variant="ghost" onClick={() => removeItem(it.id)} className="text-red-400 hover:text-red-600 h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Footer Totals */}
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 pt-4">
            <div className="flex gap-2">
              <Button type="submit" className="bg-[#00BCD4] hover:bg-[#00acc1] text-white font-extrabold text-xs px-8 h-10 shadow-lg">SAVE SALES DOCUMENT</Button>
              <Button 
                type="button" 
                onClick={handleClear}
                variant="destructive" 
                className="bg-[#EF5350] hover:bg-[#e53935] font-extrabold text-xs px-10 h-10 shadow-lg"
              >
                CLEAR
              </Button>
            </div>
            
            <div className="w-[350px] border rounded shadow-sm bg-white overflow-hidden">
              <div className="flex border-b">
                <div className="w-1/2 p-2 text-[10px] font-bold text-gray-500 text-right bg-gray-50 uppercase">Taxable Amount</div>
                <div className="w-1/2 p-2 text-[11px] font-bold text-gray-800 text-right border-l">{totals.taxable.toFixed(2)}</div>
              </div>
              <div className="flex border-b">
                <div className="w-1/2 p-2 text-[10px] font-bold text-gray-500 text-right bg-gray-50 uppercase">Tax Amount</div>
                <div className="w-1/2 p-2 text-[11px] font-bold text-gray-800 text-right border-l">{totals.tax.toFixed(2)}</div>
              </div>
              <div className="flex border-b">
                <div className="w-1/2 p-2 text-[10px] font-bold text-gray-500 text-right bg-gray-50 uppercase">TCS Amount</div>
                <div className="w-1/2 p-2 text-[11px] font-bold text-gray-800 text-right border-l">{totals.tcs.toFixed(2)}</div>
              </div>
              <div className="flex border-b">
                <div className="w-1/2 p-2 text-[10px] font-bold text-gray-500 text-right bg-gray-50 uppercase">Round Off</div>
                <div className="w-1/2 p-2 text-[11px] font-bold text-gray-800 text-right border-l">{totals.roundOff.toFixed(2)}</div>
              </div>
              <div className="flex bg-[#fdfdfd]">
                <div className="w-1/2 p-2 text-[11px] font-black text-gray-700 text-right bg-gray-50 uppercase border-b-0">Net Amount</div>
                <div className="w-1/2 p-2 text-[13px] font-black text-[#3DB9C1] text-right border-l border-b-0">₹ {totals.net.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
