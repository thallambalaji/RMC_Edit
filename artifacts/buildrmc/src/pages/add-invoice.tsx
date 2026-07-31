import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetCustomers,
  useGetVehicles,
  useGetEmployees,
  useGetMasters,
  useGetSalesOrders,
  getGetInvoicesQueryKey,
  useGetInvoices,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  Settings2, 
  User, 
  MapPin, 
  Package, 
  Calculator, 
  ReceiptText, 
  Wallet, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Trash2 
} from "lucide-react";



const FY_PREFIX = (() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  return `${String(fyStart % 100).padStart(2, "0")}-${String(fyEnd).padStart(2, "0")}`;
})();

function getNextInvoiceNumber(invoices: any[], fyPrefix: string): string {
  if (!invoices || invoices.length === 0) {
    return `INV/${fyPrefix}/0001`;
  }
  const numbers = invoices
    .map(inv => inv.invoiceNumber || inv.invoiceNo)
    .filter(num => typeof num === "string" && num.startsWith(`INV/${fyPrefix}/`))
    .map(num => {
      const parts = num.split("/");
      const lastPart = parts[parts.length - 1];
      const parsed = parseInt(lastPart, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(4, "0");
  return `INV/${fyPrefix}/${paddedNum}`;
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

export default function AddInvoice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: invoices } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });

  // Master Data Hook Queries
  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();
  const { data: sites } = useGetMasters("site");
  const { data: allSalesOrders } = useGetSalesOrders();
  const { data: dbGrades } = useGetMasters("grade");
  const { data: dbPlants } = useGetMasters("plant");
  const { data: dbBlocks } = useGetMasters("block");

  // Fetch drivers from transport module endpoint
  const { data: transportDrivers } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    }
  });

  // Fetch pump-dgs from transport module endpoint
  const { data: pumpDgs } = useQuery<any[]>({
    queryKey: ["/api/pump-dgs"],
    queryFn: async () => {
      const res = await fetch("/api/pump-dgs");
      if (!res.ok) throw new Error("Failed to fetch pump-dgs");
      return res.json();
    }
  });

  const plantsList = useMemo(() => (dbPlants || []).map((p: any) => p.name || p.id), [dbPlants]);
  const blocksList = useMemo(() => (dbBlocks || []).map((b: any) => b.name || b.id), [dbBlocks]);

  const pumpsList = useMemo(() => {
    return (pumpDgs || [])
      .filter((p: any) => p.type === "Pump" && p.status !== "inactive" && p.status !== "deactivated")
      .map((p: any) => p.name);
  }, [pumpDgs]);

  const drivers = useMemo(() => {
    return (transportDrivers || []).filter((d: any) => d.status !== "inactive" && d.status !== "deactivated");
  }, [transportDrivers]);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [kmReading, setKmReading] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [block, setBlock] = useState<string>("");
  const [siteName, setSiteName] = useState("");
  const [invoiceTime, setInvoiceTime] = useState(new Date().toTimeString().slice(0, 8));
  const [driverName, setDriverName] = useState("");
  const [grade, setGrade] = useState("");
  const [loadedQuantity, setLoadedQuantity] = useState<string>("");
  const [loadedGrade, setLoadedGrade] = useState("");
  const [remark, setRemark] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [pump, setPump] = useState<string>("");
  const [netAmount, setNetAmount] = useState<string>("0");

  // Advanced Form State (Now fully active and functional!)
  const [showAdvance, setShowAdvance] = useState(false);
  const [pumpCharge, setPumpCharge] = useState<string>("0");
  const [transportCharge, setTransportCharge] = useState<string>("0");
  const [loadedPlant, setLoadedPlant] = useState<string>("");

  useEffect(() => {
    if (plantsList.length > 0) {
      if (!plant || plant === "FORTUNE CONCRETE") {
        setPlant(plantsList[0]);
      }
      if (!loadedPlant) setLoadedPlant(plantsList[0]);
    }
  }, [plantsList, plant, loadedPlant]);

  useEffect(() => {
    if (invoices && !invoiceNumber) {
      const nextNum = getNextInvoiceNumber(invoices, FY_PREFIX);
      setInvoiceNumber(nextNum);
    }
  }, [invoices, invoiceNumber]);

  // Mock Upload state variables with premium tickmarks
  const [dcFile, setDcFile] = useState<string | null>(null);
  const [weighmentFile, setWeighmentFile] = useState<string | null>(null);
  const [annexureFile, setAnnexureFile] = useState<string | null>(null);

  const [cgstRate] = useState("9");
  const [sgstRate] = useState("9");
  const [igstRate] = useState("0");

  const selectedCustomer = useMemo(
    () => customers?.find((c) => String(c.id) === customerId) as any,
    [customers, customerId],
  );

  // Parse pipe-joined siteName string from customer DB → individual site names array
  const availableSites = useMemo(() => {
    if (!selectedCustomer?.siteName) return [];
    return selectedCustomer.siteName
      .split("|")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [selectedCustomer]);

  // Collect all unique grades from ALL sales orders belonging to this customer
  const customerGrades = useMemo(() => {
    const gradeSet = new Set<string>();
    if (customerId && allSalesOrders) {
      const orders = (allSalesOrders as any[]).filter(
        (o) => String(o.customerId) === customerId
      );
      orders.forEach((o) => {
        (o.items || []).forEach((item: any) => {
          if (item.grade) gradeSet.add(item.grade);
        });
      });
    }
    
    // Always provide standard concrete grades as a baseline
    ["M10", "M15", "M20", "M25", "M30", "M35", "M40", "M45", "M50"].forEach(g => gradeSet.add(g));
    
    // Also include any master grades from the database
    if (dbGrades && dbGrades.length > 0) {
      dbGrades.forEach((g: any) => {
        gradeSet.add(g.name || g.id);
      });
    }
    
    return Array.from(gradeSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [customerId, allSalesOrders, dbGrades]);

  // When customer changes: auto-select first site, reset grade to first customer grade
  useEffect(() => {
    if (!customerId) {
      setSiteName("");
      setGrade("");
      setLoadedGrade("");
      return;
    }
    if (availableSites.length > 0) {
      setSiteName(availableSites[0]);
    } else {
      setSiteName("");
    }
    // Do not auto-select grades; force manual selection
    setGrade("");
    setLoadedGrade("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, availableSites.join(",")]);

  // Auto-fetch rate from sales order when customer, site name, or grade changes
  useEffect(() => {
    if (!customerId || !grade || !allSalesOrders) {
      setNetAmount("0");
      return;
    }
    const customerOrders = (allSalesOrders as any[]).filter(
      (o) => String(o.customerId) === customerId
    );
    
    // Attempt site-specific order match first
    const siteMatchingOrders = customerOrders.filter(
      (o) => o.siteAddress && (
        o.siteAddress.toLowerCase().includes(siteName.toLowerCase()) || 
        siteName.toLowerCase().includes(o.siteAddress.toLowerCase())
      )
    );
    
    let rateFound = "";
    for (const order of siteMatchingOrders) {
      const match = (order.items || []).find((item: any) => item.grade === grade);
      if (match && match.rate !== undefined && match.rate !== null) {
        rateFound = String(match.rate);
        break;
      }
    }
    
    // Fallback to any order of the customer with this grade
    if (!rateFound) {
      for (const order of customerOrders) {
        const match = (order.items || []).find((item: any) => item.grade === grade);
        if (match && match.rate !== undefined && match.rate !== null) {
          rateFound = String(match.rate);
          break;
        }
      }
    }
    
    setNetAmount(rateFound || "0");
  }, [customerId, siteName, grade, allSalesOrders]);

  // Financial Calculations
  const totals = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const rate = parseFloat(netAmount) || 0;
    const pChg = parseFloat(pumpCharge) || 0;
    const tChg = parseFloat(transportCharge) || 0;

    // Gross Amount includes base price + pump + transport charges
    const gross = (qty * rate) + pChg + tChg;

    const cgstAmt = (gross * parseFloat(cgstRate)) / 100;
    const sgstAmt = (gross * parseFloat(sgstRate)) / 100;
    const igstAmt = (gross * parseFloat(igstRate)) / 100;
    const tax = cgstAmt + sgstAmt + igstAmt;
    const net = Math.round(gross + tax);
    const roundOff = net - (gross + tax);
    
    const loadedQty = parseFloat(loadedQuantity) || 0;
    const balanceQty = Math.max(0, loadedQty - qty);

    return { gross, tax, cgstAmt, sgstAmt, igstAmt, net, roundOff, balanceQty, rate };
  }, [quantity, loadedQuantity, netAmount, cgstRate, sgstRate, igstRate, pumpCharge, transportCharge]);

  const handleClear = () => {
    setInvoiceNumber("");
    setPlant("");
    setKmReading("");
    setCustomerId("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setBlock("");
    setSiteName("");
    setInvoiceTime(new Date().toTimeString().slice(0, 8));
    setDriverName("");
    setGrade("");
    setLoadedQuantity("");
    setLoadedGrade("");
    setRemark("");
    setQuantity("");
    setVehicleId("");
    setPump("No Pump");
    setNetAmount("0");
    setPumpCharge("0");
    setTransportCharge("0");
    setLoadedPlant("");
    setDcFile(null);
    setWeighmentFile(null);
    setAnnexureFile(null);
    setShowAdvance(false);
    toast({
      title: "Form Cleared",
      description: "All inputs have been successfully reset.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber) {
      toast({ title: "Enter Invoice Number", description: "Invoice number is required.", variant: "destructive" });
      return;
    }
    if (!customerId) {
      toast({ title: "Select Customer", description: "Choosing a customer is required.", variant: "destructive" });
      return;
    }
    if (!siteName) {
      toast({ title: "Select Site Name", description: "Choosing an active site location is required.", variant: "destructive" });
      return;
    }
    if (!grade) {
      toast({ title: "Select Grade", description: "Choosing a concrete grade is required.", variant: "destructive" });
      return;
    }
    if (!loadedGrade) {
      toast({ title: "Select Loaded Grade", description: "Choosing a loaded concrete grade is required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        customerId,           // MongoDB ObjectId string — sent directly
        totalAmount: totals.net,
        status: "pending",
        plant,
        site: siteName,
        remark,
        invoiceTime,
        vehicleId: vehicleId || null,   // MongoDB ObjectId string or null
        vehicleNo: vehicles?.find(v => String(v.id) === vehicleId)?.registrationNo || undefined,
        grade,
        loadedGrade,
        loadedQuantity: parseFloat(loadedQuantity) || 0,
        quantity: parseFloat(quantity) || 0,
        netAmount: parseFloat(netAmount),
        cgstRate: parseFloat(cgstRate),
        sgstRate: parseFloat(sgstRate),
        isBillReceived: false,
        pumpCharge: parseFloat(pumpCharge) || 0,
        transportCharge: parseFloat(transportCharge) || 0,
        loadedPlant,
        pumpType: pump,
        kmReading: parseFloat(kmReading) || 0,
        driverName: driverName || "Default Driver",
        block: block || ""
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      toast({ 
        title: "Invoice Submitted Successfully!", 
        description: `Invoice ${invoiceNumber} has been saved to the database.` 
      });
      queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
      setLocation("/billing");
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "An error occurred while saving the invoice.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = "text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1 block";
  const inputStyle = "h-8 text-xs border-gray-200 focus:ring-[#4f46e5] focus:border-[#4f46e5] rounded-md shadow-sm bg-white text-slate-800 font-medium w-full transition-shadow hover:border-slate-300";

  return (
    <div className="pb-6">
      <form onSubmit={handleSubmit} className="max-w-[1500px] mx-auto bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Add New Invoice</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tight font-bold">
              <Link href="/dashboard" className="hover:text-[#4f46e5] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/billing" className="hover:text-[#4f46e5] transition-colors">Billing</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#4f46e5]">Create Invoice</span>
            </nav>
          </div>
          <div className="flex items-center gap-1 text-[10px] bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Active Database Connection
          </div>
        </div>

        {/* Form Body Fields */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
          
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <Label className={labelStyle}>Invoice No <span className="text-red-500">*</span></Label>
              <Input
                value={invoiceNumber}
                readOnly
                placeholder="Generating sequential number..."
                className={`${inputStyle} bg-slate-50 cursor-not-allowed select-none`}
              />
            </div>
            
            <div>
              <Label className={labelStyle}>Customer <span className="text-red-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                <SelectContent className="text-xs">
                  {customers && customers.length > 0 ? (
                    customers.map((c) => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No customers found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={labelStyle}>Site Name <span className="text-red-500">*</span></Label>
              {availableSites.length > 0 ? (
                <Select value={siteName} onValueChange={setSiteName}>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Choose Site" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {availableSites.map((s: string) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  placeholder={customerId ? "No sites registered for this customer" : "Select a customer first"}
                  className={inputStyle}
                />
              )}
            </div>
            
            <div>
              <Label className={labelStyle}>Grade <span className="text-red-500">*</span></Label>
              <Select value={customerGrades.includes(grade) ? grade : undefined} onValueChange={setGrade}>
                <SelectTrigger className={inputStyle}>
                  <SelectValue placeholder="Select the Grade" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {customerGrades.length > 0 ? (
                    customerGrades.map(g => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No grades found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={labelStyle}>Loaded Grade <span className="text-red-500">*</span></Label>
              <Select value={customerGrades.includes(loadedGrade) ? loadedGrade : undefined} onValueChange={setLoadedGrade}>
                <SelectTrigger className={inputStyle}>
                  <SelectValue placeholder="Select the Loaded Grade" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {customerGrades.length > 0 ? (
                    customerGrades.map(g => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No grades found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={labelStyle}>Quantity (m³) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputStyle} />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <Label className={labelStyle}>Invoice Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputStyle} />
            </div>
            
            <div>
              <Label className={labelStyle}>Invoice Time <span className="text-red-500">*</span></Label>
              <Input type="time" step="1" value={invoiceTime} onChange={e => setInvoiceTime(e.target.value)} className={inputStyle} />
            </div>
            
            <div>
              <Label className={labelStyle}>Loaded Quantity <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={loadedQuantity} onChange={e => setLoadedQuantity(e.target.value)} className={inputStyle} />
            </div>
            
            <div>
              <Label className={labelStyle}>Remark / Notes</Label>
              <Input value={remark} onChange={e => setRemark(e.target.value)} className={inputStyle} placeholder="Enter description details..." />
            </div>
            
            <div>
              <Label className={labelStyle}>Vehicle No <span className="text-red-500">*</span></Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Vehicle" /></SelectTrigger>
                <SelectContent className="text-xs">
                  {vehicles?.map(v => <SelectItem key={v.id} value={String(v.id)} className="text-xs">{v.registrationNo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={labelStyle}>Pump Type</Label>
              <Select value={pump} onValueChange={setPump}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Pump" /></SelectTrigger>
                <SelectContent className="text-xs">
                  {pumpsList.length > 0 ? (
                    pumpsList.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No pumps configured</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <div>
              <Label className={labelStyle}>KM Reading</Label>
              <Input type="number" value={kmReading} onChange={e => setKmReading(e.target.value)} className={inputStyle} placeholder="Odometer reading" />
            </div>
            
            <div>
              <Label className={labelStyle}>Block (Optional)</Label>
              <Select value={block} onValueChange={setBlock}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Block" /></SelectTrigger>
                <SelectContent className="text-xs">
                  {blocksList.length > 0 ? (
                    blocksList.map(b => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No blocks configured</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={labelStyle}>Driver Name</Label>
              <Select value={driverName} onValueChange={setDriverName}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Driver" /></SelectTrigger>
                <SelectContent className="text-xs">
                  {drivers.length > 0 ? (
                    drivers.map((d) => (
                      <SelectItem key={d.id} value={d.name} className="text-xs">{d.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No drivers registered</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAdvance(!showAdvance)} 
                className={`w-full text-xs h-9 px-4 font-black uppercase tracking-wider flex items-center justify-center gap-2 border shadow-sm transition-all ${
                  showAdvance 
                    ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:text-white" 
                    : "bg-slate-100 border-gray-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Settings2 className="w-4 h-4" /> 
                {showAdvance ? "Hide Advanced Options" : "Show Advanced Options"}
              </Button>
            </div>
          </div>
        </div>

        {/* ADVANCED EXPANDABLE OPTIONS BLOCK (Files Upload & Advanced Settings) */}
        <div className={`transition-all duration-300 ease-in-out border-t overflow-hidden ${
          showAdvance ? "max-h-[1000px] opacity-100 bg-slate-50/40 p-6" : "max-h-0 opacity-0 p-0 border-transparent pointer-events-none"
        }`}>
          <div className="max-w-[1400px] mx-auto space-y-6">
            <h3 className="text-xs font-black text-[#4f46e5] uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
              <Settings2 className="w-4 h-4" /> Advanced Billing Configurations & Upload Attachments
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pump Charge */}
              <div className="space-y-1">
                <Label className={labelStyle}>Pump Charge (₹)</Label>
                <Input 
                  type="number" 
                  value={pumpCharge} 
                  onChange={(e) => setPumpCharge(e.target.value)} 
                  className={inputStyle} 
                  placeholder="0" 
                />
              </div>

              {/* Transport Charge */}
              <div className="space-y-1">
                <Label className={labelStyle}>Transport Charge (₹)</Label>
                <Input 
                  type="number" 
                  value={transportCharge} 
                  onChange={(e) => setTransportCharge(e.target.value)} 
                  className={inputStyle} 
                  placeholder="0" 
                />
              </div>

              {/* Loaded Plant */}
              <div className="space-y-1">
                <Label className={labelStyle}>Loaded Plant</Label>
                <Select value={loadedPlant} onValueChange={setLoadedPlant}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Plant" /></SelectTrigger>
                  <SelectContent className="text-xs">
                    {plantsList.length > 0 ? (
                      plantsList.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)
                    ) : (
                      <SelectItem value="_empty" disabled className="text-xs">No plants configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload Attachment Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              
              {/* Delivery Challan File */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative">
                <Label className={`${labelStyle} text-[#4f46e5]`}>Delivery Challan (DC) Document</Label>
                <p className="text-[10px] text-slate-400 mb-3">Upload copy of original signed DC paper</p>
                
                {dcFile ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[160px]">{dcFile}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setDcFile(null)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative group border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDcFile(file.name);
                          toast({ title: "DC Uploaded!", description: `Loaded: ${file.name}` });
                        }
                      }}
                    />
                    <Upload className="w-5 h-5 mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Click to upload DC</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">PDF, PNG, JPG up to 5MB</span>
                  </div>
                )}
              </div>

              {/* Weighment Slip File */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative">
                <Label className={`${labelStyle} text-[#4f46e5]`}>Weighment Ticket Slip</Label>
                <p className="text-[10px] text-slate-400 mb-3">Upload authorized weighbridge receipts</p>
                
                {weighmentFile ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[160px]">{weighmentFile}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setWeighmentFile(null)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative group border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setWeighmentFile(file.name);
                          toast({ title: "Weighment Slip Uploaded!", description: `Loaded: ${file.name}` });
                        }
                      }}
                    />
                    <Upload className="w-5 h-5 mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Click to upload Slip</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">PDF, PNG, JPG up to 5MB</span>
                  </div>
                )}
              </div>

              {/* Annexure Statement File */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative">
                <Label className={`${labelStyle} text-[#4f46e5]`}>Annexure statement Document</Label>
                <p className="text-[10px] text-slate-400 mb-3">Upload additional supporting calculations</p>
                
                {annexureFile ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[160px]">{annexureFile}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => setAnnexureFile(null)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative group border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAnnexureFile(file.name);
                          toast({ title: "Annexure Statement Loaded!", description: `Loaded: ${file.name}` });
                        }
                      }}
                    />
                    <Upload className="w-5 h-5 mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Click to upload Doc</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">PDF, PNG, JPG up to 5MB</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Summary Section Redesign */}
        <div className="mt-4 px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2 border-gray-100">
            <ReceiptText className="w-4 h-4 text-[#4f46e5]"/> Invoice Calculations & Preview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Customer & Site Details */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <User className="w-3.5 h-3.5" /> Customer Details
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Customer Name</p>
                  <p className="text-sm font-bold text-gray-800">{selectedCustomer?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Customer Address</p>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">{selectedCustomer?.address || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Site Info</p>
                  <p className="text-xs font-medium text-gray-600 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#4f46e5] shrink-0 mt-0.5" /> {siteName || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Package className="w-3.5 h-3.5" /> Order Specs
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Grade</p>
                  <p className="text-base font-black text-[#4f46e5]">{grade}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Quantity</p>
                  <p className="text-base font-bold text-gray-800">{quantity} <span className="text-[10px] font-normal text-gray-500">m³</span></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Rate / m³</p>
                  <p className="text-sm font-bold text-gray-800">₹{totals.rate.toLocaleString("en-IN", {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <p className="text-[10px] text-orange-400 font-semibold uppercase mb-1">Balance Qty</p>
                  <p className="text-sm font-bold text-orange-600">{totals.balanceQty.toFixed(2)} <span className="text-[10px] font-normal opacity-70">m³</span></p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-200/60 pb-2">
                <Calculator className="w-3.5 h-3.5" /> Financials
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Gross Price</span>
                  <span className="font-bold text-gray-800">₹{totals.gross.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                </div>
                
                {parseFloat(pumpCharge) > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-indigo-600 font-semibold">
                    <span>Pump Charge (+)</span>
                    <span>₹{parseFloat(pumpCharge).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                  </div>
                )}

                {parseFloat(transportCharge) > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-indigo-600 font-semibold">
                    <span>Transport Charge (+)</span>
                    <span>₹{parseFloat(transportCharge).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">CGST ({cgstRate}%)</span>
                  <span className="font-medium text-gray-700">₹{totals.cgstAmt.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">SGST ({sgstRate}%)</span>
                  <span className="font-medium text-gray-700">₹{totals.sgstAmt.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                </div>
                {Number(igstRate) > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">IGST ({igstRate}%)</span>
                    <span className="font-medium text-gray-700">₹{totals.igstAmt.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Round Off</span>
                  <span className="font-medium text-gray-700">{totals.roundOff > 0 ? "+" : ""}₹{totals.roundOff.toFixed(2)}</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-dashed border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-gray-800">Net Price</span>
                    <span className="text-xl font-black text-[#4f46e5]">₹{totals.net.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Amount In Words (Full Width) */}
          <div className="mt-5 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
            <div className="p-2.5 bg-white rounded-full shadow-sm">
              <Wallet className="w-5 h-5 text-[#4f46e5]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Amount in words</p>
              <p className="text-sm font-black text-slate-800 capitalize leading-tight">{numberToWordsINR(totals.net)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div className="p-6 flex justify-center gap-4 bg-slate-50 border-t border-gray-100">
          <Button 
            type="submit" 
            className="bg-[#4f46e5] hover:bg-indigo-700 text-white px-12 h-9 font-black text-[11px] rounded-lg uppercase tracking-wider gap-2 shadow-md" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Invoice"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="px-12 h-9 font-black text-[11px] border-gray-200 text-slate-600 rounded-lg uppercase tracking-wider hover:bg-slate-100" 
            onClick={handleClear}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
