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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Plus, Clock, Trash2, RefreshCw, Printer, FileText, Sparkles, ReceiptText } from "lucide-react";

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

function numberToWordsINR(num: number): string {
  if (!isFinite(num) || num <= 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigits(r) : "");
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  let words = "";
  if (crore) words += (crore > 20 ? twoDigits(crore) : ones[crore]) + " Crore ";
  if (lakh) words += twoDigits(lakh) + " Lakh ";
  if (thousand) words += twoDigits(thousand) + " Thousand ";
  if (hundred) words += threeDigits(hundred);
  words = words.trim() + " Rupees";
  if (paise) words += " and " + twoDigits(paise) + " Paise";
  return words + " Only";
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
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [customerId, setCustomerId] = useState<string>("");
  const [siteName, setSiteName] = useState("");
  const [remark, setRemark] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceTime, setInvoiceTime] = useState(new Date().toTimeString().slice(0, 8));
  const [vehicleNo, setVehicleNo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  const [isAutoTime, setIsAutoTime] = useState(true);

  useEffect(() => {
    if (!isAutoTime) return;
    const timer = setInterval(() => {
      setInvoiceTime(new Date().toTimeString().slice(0, 8));
      setInvoiceDate(new Date().toISOString().slice(0, 10));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoTime]);

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
    const c = customers.find((x) => String(x.id) === customerId) as any;
    if (c) {
      setSiteName(c.siteName || c.name || "");
      setSiteAddress(c.siteAddress || c.address || "");
    }
  }, [customerId, customers]);

  const selectedCustomer = useMemo(
    () => customers?.find(c => String(c.id) === customerId),
    [customers, customerId]
  );

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
    setItems([...items, { id: Date.now() + Math.random(), name: "", qty: 0, rate: 0, taxRate: 18, includeTax: false }]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) {
      toast({
        title: "Cannot Remove Last Item",
        description: "At least one line item is required. Update this item or add another before removing it.",
        variant: "destructive"
      });
      return;
    }
    setItems(items.filter(it => it.id !== id));
  };

  const updateItem = (id: number, field: string, val: any) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it));
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
    setSelectedDcIds([]); // Clear selections
    toast({ title: `${selectedDcs.length} DC(s) appended successfully` });
  };

  const handleClear = () => {
    setCustomerId("");
    setSiteName("");
    setSiteAddress("");
    setVehicleNo("");
    setRemark("");
    setInvoiceNumber(generateInvoiceNumber());
    setItems([{ id: Date.now() + Math.random(), name: "RMC M25", qty: 0, rate: 0, taxRate: 18, includeTax: false }]);
    setIsAutoTime(true);
    toast({ title: "Form Reset", description: "Form fields cleared." });
  };

  const validateForm = () => {
    if (!customerId) {
      toast({
        title: "Required Input Missing",
        description: "Please select a Customer before submitting.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!vehicleNo || vehicleNo.trim() === "" || vehicleNo.toLowerCase() === "vehicle no") {
      toast({
        title: "Required Input Missing",
        description: "Please enter a valid Vehicle Number before submitting.",
        variant: "destructive"
      });
      return false;
    }

    if (!siteName || siteName.trim() === "") {
      toast({
        title: "Required Input Missing",
        description: "Please specify the Site Name before submitting.",
        variant: "destructive"
      });
      return false;
    }

    if (items.length === 0) {
      toast({
        title: "No Items Added",
        description: "Please add at least one line item with valid details.",
        variant: "destructive"
      });
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || it.name.trim() === "") {
        toast({
          title: "Item Validation Error",
          description: `Line #${i + 1}: Item description/name cannot be empty.`,
          variant: "destructive"
        });
        return false;
      }
      const q = parseFloat(it.qty) || 0;
      const r = parseFloat(it.rate) || 0;
      if (q <= 0) {
        toast({
          title: "Item Validation Error",
          description: `Line #${i + 1}: Quantity must be greater than zero.`,
          variant: "destructive"
        });
        return false;
      }
      if (r <= 0) {
        toast({
          title: "Item Validation Error",
          description: `Line #${i + 1}: Rate must be greater than zero.`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  // Base Save Function (Triggers on "Save Document" or normal form submit)
  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createInvoice.mutate({
      data: {
        invoiceNumber,
        invoiceDate,
        customerId: customerId as any,
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
        toast({ title: "Sales Document Registered!", description: `Invoice ${invoiceNumber} saved successfully to Atlas database.` });
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setLocation("/billing/sales-document");
      },
      onError: (err: any) => {
        toast({ title: "Database Save Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  // Advanced Save & Print Function (Runs window.print() on success and keeps the user on-page)
  const handleFinalizeAndPrint = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createInvoice.mutate({
      data: {
        invoiceNumber,
        invoiceDate,
        customerId: customerId as any,
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
        toast({ 
          title: "Sales Document Saved Successfully!", 
          description: "Database storage validated. Preparing print invoice sheet..." 
        });
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        
        // Let React update DOM before calling print
        setTimeout(() => {
          window.print();
          handleClear(); // Completely reset form on-page after print sheet trigger
        }, 300);
      },
      onError: (err: any) => {
        toast({ title: "Validation Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const labelStyle = "text-[9px] font-black text-gray-500 uppercase tracking-tight mb-0.5 block";
  const inputStyle = "h-7 text-xs border-gray-200 rounded focus:ring-[#1e40af] bg-white font-bold px-2 w-full shadow-none hover:border-gray-300 transition-colors";
  const tableHeaderStyle = "bg-[#1e40af] text-white text-[8px] font-black uppercase py-1 px-1 border-r border-white/5 last:border-0 text-center tracking-tighter whitespace-nowrap";

  return (
    <div className="bg-[#f8fafc] h-full overflow-hidden flex flex-col">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-invoice-sheet, .print-invoice-sheet * {
            visibility: visible;
          }
          .print-invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            margin: 0;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* PRINT ONLY SHEET LAYOUT WITH CORPORATE DETAILS */}
      <div className="hidden print:block print-invoice-sheet">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-[#1e40af] text-white flex items-center justify-center font-black text-xl rounded">
              RM
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">BuildRMC Enterprises</h1>
              <p className="text-xs text-slate-500 font-bold">123 Concrete Industrial Layout, Phase-1, Hyderabad</p>
              <p className="text-xs text-slate-500 font-semibold">GSTIN: 36AAAAA1111A1Z1 | contact@buildrmc.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black text-[#1e40af] uppercase tracking-wide">Sales Tax Document</h2>
            <p className="text-xs text-slate-500 mt-1 font-bold">Original Copy</p>
          </div>
        </div>

        {/* Invoice Metadata Metadata Grid */}
        <div className="grid grid-cols-3 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-xs font-semibold text-slate-700">
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Invoice Number</p>
            <p className="font-extrabold text-[#1e40af] text-sm">{invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Invoice Date</p>
            <p className="text-slate-800 font-black">{new Date(invoiceDate).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Loading Plant</p>
            <p className="text-slate-800 font-black">{plant}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Vehicle Number</p>
            <p className="text-slate-800 font-black">{vehicleNo || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Dispatch Time</p>
            <p className="text-slate-800 font-black">{invoiceTime}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Status</p>
            <p className="text-slate-800 font-black capitalize">Active / Sealed</p>
          </div>
        </div>

        {/* Billing Address Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
          <div className="border border-slate-200/80 p-4 rounded-lg">
            <h3 className="font-black text-[10px] text-[#1e40af] uppercase tracking-wider mb-2 pb-1 border-b">Billed Customer Details</h3>
            <p className="font-black text-slate-800 text-sm mb-1">{selectedCustomer?.name || "No Customer Selected"}</p>
            <p className="text-slate-500 font-medium leading-relaxed">{selectedCustomer?.address || "—"}</p>
            <p className="text-slate-600 font-bold mt-1.5">GSTIN: {selectedCustomer?.gstNumber || "Unregistered"}</p>
          </div>
          <div className="border border-slate-200/80 p-4 rounded-lg">
            <h3 className="font-black text-[10px] text-[#1e40af] uppercase tracking-wider mb-2 pb-1 border-b">Site Dispatch Destination</h3>
            <p className="font-black text-slate-800 text-sm mb-1">{siteName || "No Site Listed"}</p>
            <p className="text-slate-500 font-medium leading-relaxed">{siteAddress || "—"}</p>
          </div>
        </div>

        {/* Invoice Item List Grid */}
        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-6">
          <thead>
            <tr className="bg-slate-100 border-b text-slate-700 font-black text-left uppercase text-[10px]">
              <th className="p-3 text-center w-12 border-r">S/L</th>
              <th className="p-3 border-r">Item Description</th>
              <th className="p-3 text-right w-24 border-r">Quantity (m³)</th>
              <th className="p-3 text-right w-24 border-r">Rate per m³ (₹)</th>
              <th className="p-3 text-center w-20 border-r">Tax %</th>
              <th className="p-3 text-right w-28 border-r">Taxable Amt (₹)</th>
              <th className="p-3 text-right w-28 border-r">CGST/SGST (₹)</th>
              <th className="p-3 text-right w-32">Total Net (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium text-slate-800">
            {items.map((it, idx) => {
              const gross = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
              const tax = (gross * (parseFloat(it.taxRate) || 0)) / 100;
              const net = gross + tax;
              return (
                <tr key={it.id}>
                  <td className="p-3 text-center border-r text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3 border-r font-extrabold">{it.name || "Concrete Feed Item"}</td>
                  <td className="p-3 text-right border-r font-black text-slate-900">{Number(it.qty).toFixed(2)}</td>
                  <td className="p-3 text-right border-r">₹{Number(it.rate).toLocaleString("en-IN", {minimumFractionDigits: 2})}</td>
                  <td className="p-3 text-center border-r text-slate-500 font-bold">{it.taxRate}%</td>
                  <td className="p-3 text-right border-r">₹{gross.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td>
                  <td className="p-3 text-right border-r">₹{tax.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td>
                  <td className="p-3 text-right font-black text-slate-900">₹{net.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Print Totals Summary */}
        <div className="grid grid-cols-2 gap-8 items-start mb-8 text-xs font-semibold">
          <div className="bg-slate-50 border p-4 rounded-lg">
            <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-2">Invoice Amount In Words</h4>
            <p className="text-slate-800 font-black text-sm capitalize leading-snug">{numberToWordsINR(totals.net)}</p>
          </div>
          <div className="space-y-2 border border-slate-100 p-4 rounded-lg bg-slate-50/50">
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Price</span>
              <span className="font-extrabold text-slate-800">₹{totals.taxable.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CGST (9.0%)</span>
              <span className="font-extrabold text-slate-800">₹{(totals.tax / 2).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SGST (9.0%)</span>
              <span className="font-extrabold text-slate-800">₹{(totals.tax / 2).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Round Off Adjustment</span>
              <span className="font-extrabold text-slate-800">{totals.roundOff >= 0 ? "+" : ""}₹{totals.roundOff.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t-2 border-dashed border-slate-300 flex justify-between items-center">
              <span className="text-slate-900 font-black">Net Total Invoice Value</span>
              <span className="text-lg font-black text-[#1e40af]">₹{totals.net.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Authorized signatures */}
        <div className="grid grid-cols-2 gap-12 mt-16 text-xs pt-12">
          <div className="text-center">
            <div className="h-0.5 bg-slate-300 w-48 mx-auto mb-2" />
            <p className="font-black text-slate-600">Receiver's Signature & Stamp</p>
          </div>
          <div className="text-center">
            <div className="h-0.5 bg-slate-300 w-48 mx-auto mb-2" />
            <p className="font-black text-slate-600">For BuildRMC Enterprises (Auth. Signatory)</p>
          </div>
        </div>
      </div>

      {/* Screen Interactive UI Form Section */}
      <form onSubmit={handleSaveOnly} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden no-print">
        {/* Top Actions Panel */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1e40af]" /> New Sales Document Registration
            </h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
              <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href="/billing" className="hover:text-[#1e40af]">Billing</Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-[#1e40af]">Add Sales Document</span>
            </nav>
          </div>
          <div className="flex gap-2">
             <Button type="submit" size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3.5 h-6.5 uppercase tracking-wider rounded-md shadow-sm border-0">
               Save Document
             </Button>
             <Button type="button" onClick={handleClear} size="sm" variant="outline" className="border-rose-100 text-rose-500 hover:bg-rose-50/50 font-black text-[9px] px-3.5 h-6.5 uppercase tracking-wider border rounded-md">
               Clear Form
             </Button>
          </div>
        </div>

        {/* Main Workspace Frame */}
        <div className="flex-1 overflow-hidden p-3.5 flex flex-col gap-3 min-h-0">
          {/* Top Frame Layout Grid */}
          <div className="flex gap-3.5 shrink-0">
            {/* Left: Metadata Inputs Panel */}
            <div className="flex-[0.45] grid grid-cols-2 gap-x-2.5 gap-y-1.5 border-r pr-3.5">
              <div>
                <Label className={labelStyle}>Plant <span className="text-red-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    {PLANTS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelStyle}>Invoice No</Label>
                <Input value={invoiceNumber} readOnly className={`${inputStyle} bg-slate-50 font-extrabold text-[#1e40af] cursor-not-allowed`} />
              </div>

              <div>
                <Label className={labelStyle}>Invoice Date</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={e => { setInvoiceDate(e.target.value); setIsAutoTime(false); }} 
                    className={`${inputStyle} w-full pr-7`} 
                  />
                  {!isAutoTime && <RefreshCw onClick={() => setIsAutoTime(true)} className="absolute right-2 top-2 h-3.5 w-3.5 text-indigo-500 cursor-pointer" />}
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
                    className={`${inputStyle} w-full pr-7`} 
                  />
                  {isAutoTime && <Clock className="absolute right-2 top-2 h-3.5 w-3.5 text-[#1e40af] animate-pulse" />}
                </div>
              </div>

              <div className="col-span-2">
                <Label className={labelStyle}>Customer <span className="text-red-500">*</span></Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                  <SelectContent className="text-xs">
                    {customers?.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelStyle}>Vehicle No</Label>
                <Input placeholder="Vehicle NO" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className={inputStyle} />
              </div>
              <div>
                <Label className={labelStyle}>Site Name</Label>
                <Input value={siteName} readOnly className={`${inputStyle} bg-slate-50 text-slate-500`} />
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Site Address</Label>
                <Input value={siteAddress} readOnly className={`${inputStyle} bg-slate-50 text-slate-500`} />
              </div>
              <div className="col-span-2">
                <Label className={labelStyle}>Remark / Note</Label>
                <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Enter details..." className={inputStyle} />
              </div>
            </div>

            {/* Right: Challans Selector Grid */}
            <div className="flex-[0.55] border border-gray-150 rounded-lg overflow-hidden flex flex-col bg-white h-[160px] shadow-sm">
              <div className="flex bg-[#1e40af] shrink-0">
                <div className={tableHeaderStyle + " w-10"}>S/L</div>
                <div className={tableHeaderStyle + " w-20"}>DC No</div>
                <div className={tableHeaderStyle + " w-18"}>DC Date</div>
                <div className={tableHeaderStyle + " flex-1 text-left"}>Item</div>
                <div className={tableHeaderStyle + " w-16 text-right"}>Qty</div>
                <div className={tableHeaderStyle + " w-16 text-right"}>Rate</div>
                <div className={tableHeaderStyle + " w-20 text-right"}>Amount</div>
                <div className={tableHeaderStyle + " w-12 flex items-center justify-center gap-1"}>
                  <span className="text-[7px]">Select</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {filteredDcs.length > 0 ? (
                  filteredDcs.map((dc, idx) => (
                    <div key={dc.id} className="flex border-b text-[9px] items-center hover:bg-gray-50 py-1 font-bold text-slate-700">
                      <div className="w-10 text-center text-gray-400 border-r">{idx + 1}</div>
                      <div className="w-20 px-1.5 border-r truncate text-slate-900">{dc.dcNumber}</div>
                      <div className="w-18 px-1.5 border-r truncate">{dc.dcDate}</div>
                      <div className="flex-1 px-1.5 border-r truncate text-gray-500">{dc.grade || "RMC"}</div>
                      <div className="w-16 text-right px-1.5 border-r font-black text-cyan-600">{dc.quantity || 0}</div>
                      <div className="w-16 text-right px-1.5 border-r">₹{dc.rate || 0}</div>
                      <div className="w-20 text-right px-1.5 border-r">₹{(dc.quantity || 0) * (dc.rate || 0)}</div>
                      <div className="w-12 text-center">
                        <Checkbox 
                          checked={selectedDcIds.includes(dc.id)} 
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedDcIds([...selectedDcIds, dc.id]);
                            else setSelectedDcIds(selectedDcIds.filter(id => id !== dc.id));
                          }}
                          className="h-3 w-3 shadow-sm rounded border-gray-300"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[9px] italic font-semibold">
                    No Registered DCs Found for Customer
                  </div>
                )}
              </div>
              <div className="p-1.5 border-t bg-slate-50/50 flex justify-center gap-3 shrink-0">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAppend}
                  className="bg-[#4DB6AC] hover:bg-[#3d9189] h-5.5 text-[8px] font-black px-4 uppercase tracking-wider rounded-md shadow-none text-white border-0"
                >
                  Append DC
                </Button>
                <Button type="button" size="sm" className="bg-[#4FC3F7] hover:bg-[#3ba8d8] h-5.5 text-[8px] font-black px-4 uppercase tracking-wider rounded-md shadow-none text-white border-0">View DC Copy</Button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex-1 border border-gray-150 rounded-lg overflow-hidden flex flex-col bg-white min-h-[140px] shadow-sm">
            <div className="flex bg-slate-50 border-b shrink-0 py-1">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r w-10 text-center">#</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r flex-1">Item Description</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r w-20 text-right">Qty</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r w-24 text-right">Rate</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r w-16 text-center">Tax %</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r w-28 text-right">Taxable</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 border-r w-28 text-right">Tax</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight p-1.5 w-28 text-right">Net Amt</div>
                <div className="w-10 p-1 text-center">
                   <Button type="button" variant="ghost" onClick={addItem} className="h-5 w-5 p-0 text-[#1e40af] hover:bg-blue-50 rounded-full"><Plus className="h-3 w-3" /></Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 divide-y">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-8">
                  <div className="text-slate-300">
                    <Plus className="h-10 w-10" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">No line items added yet</p>
                  <p className="text-[10px] text-slate-300 font-medium">Click the + button in the header or use the button below to add items</p>
                  <Button
                    type="button"
                    onClick={addItem}
                    className="mt-1 bg-[#1e40af] hover:bg-blue-700 text-white font-bold text-xs px-5 h-8 rounded-lg shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Line Item
                  </Button>
                </div>
              ) : (
                items.map((it, idx) => {
                  const gross = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                  const tax = (gross * (parseFloat(it.taxRate) || 0)) / 100;
                  const net = gross + tax;
                  return (
                    <div key={it.id} className="flex items-center hover:bg-slate-50/40 group py-0 text-xs">
                      <div className="w-10 text-center text-[10px] font-black text-slate-300 border-r py-1">{idx + 1}</div>
                      <div className="flex-1 border-r h-full">
                        <Input
                          value={it.name}
                          onChange={e => updateItem(it.id, "name", e.target.value)}
                          className="h-7 border-0 focus-visible:ring-0 text-xs px-2 shadow-none font-bold text-slate-800 bg-transparent"
                          placeholder="e.g. RMC M25, M30..."
                        />
                      </div>
                      <div className="w-20 border-r h-full">
                        <Input
                          type="number"
                          min="0"
                          value={it.qty === 0 ? "" : it.qty}
                          onChange={e => updateItem(it.id, "qty", e.target.value)}
                          className="h-7 border-0 focus-visible:ring-0 text-xs px-1.5 text-right shadow-none font-black text-cyan-600 bg-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-24 border-r h-full">
                        <Input
                          type="number"
                          min="0"
                          value={it.rate === 0 ? "" : it.rate}
                          onChange={e => updateItem(it.id, "rate", e.target.value)}
                          className="h-7 border-0 focus-visible:ring-0 text-xs px-1.5 text-right shadow-none font-bold text-slate-700 bg-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-16 border-r h-full">
                        <Input
                          type="number"
                          value={it.taxRate}
                          onChange={e => updateItem(it.id, "taxRate", e.target.value)}
                          className="h-7 border-0 focus-visible:ring-0 text-xs px-1 text-center shadow-none text-slate-400 bg-transparent"
                        />
                      </div>
                      <div className="w-28 border-r text-right px-2 py-1.5 text-[10px] font-black text-slate-500 bg-slate-50/10">₹{gross.toFixed(2)}</div>
                      <div className="w-28 border-r text-right px-2 py-1.5 text-[10px] font-black text-slate-400 bg-slate-50/10">₹{tax.toFixed(2)}</div>
                      <div className="w-28 text-right px-2 py-1.5 text-[11px] font-extrabold text-[#1e40af] bg-slate-50/20">₹{net.toFixed(2)}</div>
                      <div className="w-10 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(it.id)}
                          title={items.length <= 1 ? "Cannot remove the last item" : "Remove this item"}
                          className={`h-5 w-5 p-0 transition-colors rounded-full ${
                            items.length <= 1
                              ? "text-slate-200 cursor-not-allowed"
                              : "text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Compact Summary Bottom bar */}
          <div className="flex items-center justify-between bg-slate-950 rounded-lg p-2 px-4 shrink-0 text-white shadow-lg border border-slate-900">
            <div className="flex gap-6 items-center">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">Taxable Total</span>
                    <span className="text-[11px] font-black">₹{totals.taxable.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">Total Tax</span>
                    <span className="text-[11px] font-black">₹{totals.tax.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">Round Off</span>
                    <span className="text-[11px] font-bold text-slate-500">{totals.roundOff.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right">
                    <div className="text-[8px] font-black text-indigo-400 uppercase tracking-wider">Total Payable</div>
                    <div className="text-[16px] font-black tracking-wide text-slate-100">₹ {totals.net.toLocaleString("en-IN")}</div>
                </div>
                <div className="h-7 w-px bg-white/10 mx-1.5" />
                <Button 
                  type="button" 
                  onClick={handleFinalizeAndPrint} 
                  className="bg-[#1e40af] hover:bg-blue-700 text-white font-black text-[10px] px-5 h-7.5 uppercase tracking-wider border-0 shadow-md gap-1.5 rounded-md"
                  disabled={createInvoice.isPending}
                >
                  <Printer className="w-3.5 h-3.5" /> 
                  {createInvoice.isPending ? "Finalizing..." : "Finalize & Print"}
                </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
