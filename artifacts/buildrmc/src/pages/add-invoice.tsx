import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetCustomers,
  useGetVehicles,
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
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Settings2, User, MapPin, Package, Calculator, ReceiptText, Wallet } from "lucide-react";

const PLANTS = ["FORTUNE CONCRETE", "NARVAL RMC"];
const BLOCKS = ["Block A", "Block B", "Block C", "Block D", "Tower 1", "Tower 2"];
const GRADES = ["M10", "M15", "M20", "M25", "M30", "M35", "M40", "M45", "M50"];
const PUMPS = ["Boom Pump", "Line Pump", "Stationary Pump", "No Pump"];

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
  return `${FY_PREFIX}/${rand}`;
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
  const createInvoice = useCreateInvoice();

  const { data: customers } = useGetCustomers();
  const { data: vehicles } = useGetVehicles();

  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [kmReading, setKmReading] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [block, setBlock] = useState<string>("");
  const [siteName, setSiteName] = useState("");
  const [invoiceTime, setInvoiceTime] = useState(new Date().toTimeString().slice(0, 8));
  const [driverName, setDriverName] = useState("");
  const [grade, setGrade] = useState("M25");
  const [loadedQuantity, setLoadedQuantity] = useState<string>("0");
  const [loadedGrade, setLoadedGrade] = useState("M25");
  const [remark, setRemark] = useState("");
  const [quantity, setQuantity] = useState<string>("0");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [pump, setPump] = useState<string>("No Pump");
  const [netAmount, setNetAmount] = useState<string>("0");

  const [showAdvance, setShowAdvance] = useState(false);
  const [cgstRate] = useState("9");
  const [sgstRate] = useState("9");
  const [igstRate] = useState("0");

  useEffect(() => {
    if (!customerId || !customers) return;
    const c = customers.find((x) => String(x.id) === customerId);
    if (c) {
      setSiteName(c.name || "");
    }
  }, [customerId, customers]);

  const selectedCustomer = useMemo(
    () => customers?.find((c) => String(c.id) === customerId),
    [customers, customerId],
  );

  const totals = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const loadedQty = parseFloat(loadedQuantity) || 0;
    const rate = parseFloat(netAmount) || 0;
    const gross = qty * rate;
    const cgstAmt = (gross * parseFloat(cgstRate)) / 100;
    const sgstAmt = (gross * parseFloat(sgstRate)) / 100;
    const igstAmt = (gross * parseFloat(igstRate)) / 100;
    const tax = cgstAmt + sgstAmt + igstAmt;
    const net = Math.round(gross + tax);
    const roundOff = net - (gross + tax);
    const balanceQty = Math.max(0, loadedQty - qty);

    return { gross, tax, cgstAmt, sgstAmt, igstAmt, net, roundOff, balanceQty, rate };
  }, [quantity, loadedQuantity, netAmount, cgstRate, sgstRate, igstRate]);

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
        customerId: parseInt(customerId, 10),
        totalAmount: totals.net,
        status: "pending",
        plant,
        site: siteName,
        remark,
        invoiceTime,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
        grade,
        loadedGrade,
        loadedQuantity: parseFloat(loadedQuantity),
        quantity: parseFloat(quantity),
        netAmount: parseFloat(netAmount),
        cgstRate: parseFloat(cgstRate),
        sgstRate: parseFloat(sgstRate),
        isBillReceived: false
      }
    }, {
      onSuccess: () => {
        toast({ title: "Invoice Created Successfully" });
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        setLocation("/billing");
      }
    });
  };

  const labelStyle = "text-[11px] font-bold text-gray-700 mb-1 block";
  const inputStyle = "h-8 text-xs border-gray-300 focus:ring-[#1e40af] focus:border-[#1e40af] rounded-sm shadow-sm";
  const summaryLabel = "bg-[#4e9fa5] text-white px-2 py-1.5 text-[10px] font-bold border-r border-white/10 flex items-center";
  const summaryValue = "bg-[#dbe7e8] text-gray-800 px-2 py-1.5 text-[10px] font-semibold flex items-center min-h-[28px]";

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-[1500px] mx-auto bg-white shadow-sm border-t-2 border-[#1e40af]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          <h2 className="text-lg font-bold text-gray-800">Add Invoice</h2>
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tight font-bold">
            <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
            <ChevronRight className="h-2 w-2" />
            <Link href="/billing" className="hover:text-[#1e40af]">Billing</Link>
            <ChevronRight className="h-2 w-2" />
            <span>Invoice</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-[#1e40af]">Add Invoice</span>
          </nav>
        </div>

        {/* Input Form Body */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <Label className={labelStyle}>Invoice No<span className="text-red-500">*</span></Label>
              <Input value={invoiceNumber} readOnly className={`${inputStyle} bg-gray-50`} />
            </div>
            <div>
              <Label className={labelStyle}>Customer<span className="text-red-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Site Name<span className="text-red-500">*</span></Label>
              <Select value={siteName} onValueChange={setSiteName}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Site" /></SelectTrigger>
                <SelectContent>
                  {siteName ? <SelectItem value={siteName}>{siteName}</SelectItem> : <SelectItem value="placeholder" disabled>Select Customer first</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Grade<span className="text-red-500">*</span></Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Grade" /></SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Loaded Grade<span className="text-red-500">*</span></Label>
              <Select value={loadedGrade} onValueChange={setLoadedGrade}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Grade" /></SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Quantity<span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <Label className={labelStyle}>Net Amount<span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={netAmount} onChange={e => setNetAmount(e.target.value)} className={`${inputStyle} bg-gray-50`} />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <Label className={labelStyle}>Plant<span className="text-red-500">*</span></Label>
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Invoice Date<span className="text-red-500">*</span></Label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <Label className={labelStyle}>Invoice Time<span className="text-red-500">*</span></Label>
              <Input type="time" step="1" value={invoiceTime} onChange={e => setInvoiceTime(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <Label className={labelStyle}>Loaded Quantity<span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={loadedQuantity} onChange={e => setLoadedQuantity(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <Label className={labelStyle}>Remark</Label>
              <Input value={remark} onChange={e => setRemark(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <Label className={labelStyle}>Vehicle No<span className="text-red-500">*</span></Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles?.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.registrationNo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Pump :</Label>
              <Select value={pump} onValueChange={setPump}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Pump" /></SelectTrigger>
                <SelectContent>
                  {PUMPS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <div>
              <Label className={labelStyle}>KM Reading :</Label>
              <Input type="number" value={kmReading} onChange={e => setKmReading(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <Label className={labelStyle}>Block(Optional) :</Label>
              <Select value={block} onValueChange={setBlock}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Block" /></SelectTrigger>
                <SelectContent>
                  {BLOCKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelStyle}>Driver Name :</Label>
              <Select value={driverName} onValueChange={setDriverName}>
                <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvance(!showAdvance)} className="text-[10px] h-7 px-3 bg-gray-50 border-gray-300 font-bold uppercase">
                Show Advance Option
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Section Redesign */}
        <div className="mt-8 px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-[#1e40af]"/> Invoice Summary
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Customer & Site Details */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
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
                    <MapPin className="w-3.5 h-3.5 text-[#1e40af] shrink-0 mt-0.5" /> {siteName || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Package className="w-3.5 h-3.5" /> Order Specs
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Grade</p>
                  <p className="text-base font-black text-[#1e40af]">{grade}</p>
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
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-200/60 pb-2">
                <Calculator className="w-3.5 h-3.5" /> Financials
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Gross Price</span>
                  <span className="font-bold text-gray-800">₹{totals.gross.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                </div>
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
                    <span className="text-xl font-black text-[#1e40af]">₹{totals.net.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Amount In Words (Full Width) */}
          <div className="mt-5 bg-[#1e40af]/10 border border-[#1e40af]/20 rounded-xl p-4 flex items-center gap-4">
            <div className="p-2.5 bg-white rounded-full shadow-sm">
              <Wallet className="w-5 h-5 text-[#1e40af]" />
            </div>
            <div>
              <p className="text-[10px] text-[#2a8f95] font-bold uppercase tracking-wider mb-1">Amount in words</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{numberToWordsINR(totals.net)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex justify-center gap-4 bg-[#f8fafc]">
          <Button type="submit" className="bg-[#1e40af] hover:bg-[#2A8F95] text-white px-10 h-8 font-extrabold text-[11px] rounded-sm uppercase tracking-wider" disabled={createInvoice.isPending}>
            {createInvoice.isPending ? "Submitting..." : "Submit"}
          </Button>
          <Button type="button" variant="outline" className="px-10 h-8 font-extrabold text-[11px] border-gray-300 text-gray-600 rounded-sm uppercase tracking-wider" onClick={() => setLocation("/billing")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
