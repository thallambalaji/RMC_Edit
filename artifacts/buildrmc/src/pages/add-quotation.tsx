import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateQuotation, useGetMasters, useGetEmployees } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { sanitizePhone, isValidPhone } from "@/lib/utils";


interface GradeRow { id: number; grade: string; qty: string; rate: string; recipe: string; cement: string; }

export default function AddQuotation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Suggest a beautiful, unique quotation number by default
  const [quotationNo, setQuotationNo] = useState(() => {
    return `QUOT/${format(new Date(), "yyyyMMdd")}/${Math.floor(100 + Math.random() * 900)}`;
  });

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [pumpCharges, setPumpCharges] = useState("");
  const [minPumpQty, setMinPumpQty] = useState("");
  const [marketingPerson, setMarketingPerson] = useState("");
  const [rateIncludeTax, setRateIncludeTax] = useState(true);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [dateVal, setDateVal] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: dbGrades } = useGetMasters("grade");
  const { data: employees } = useGetEmployees();

  const marketingStaff = useMemo(() => {
    if (!employees) return [];
    return (employees as any[]).filter(e => 
      e.designation?.toLowerCase().includes("sales") || 
      e.designation?.toLowerCase().includes("marketing") ||
      e.role?.toLowerCase().includes("sales") ||
      e.role?.toLowerCase().includes("marketing") ||
      true
    );
  }, [employees]);

  const gradesList = useMemo(() => {
    if (dbGrades && dbGrades.length > 0) {
      return dbGrades.map((g: any) => g.name);
    }
    return [];
  }, [dbGrades]);

  const [rows, setRows] = useState<GradeRow[]>([
    { id: 1, grade: "", qty: "", rate: "", recipe: "", cement: "opc" },
  ]);

  const { mutate: createQuotation, isPending } = useCreateQuotation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Quotation Saved! 💾", description: "Your customer quotation has been registered successfully." });
        navigate("/customer-po/quotation");
      },
      onError: (err: any) => {
        toast({ title: "Submission Failed", description: err.message || "Failed to save quotation to Atlas.", variant: "destructive" });
      }
    }
  });

  const addRow = () =>
    setRows(prev => [...prev, { id: Date.now(), grade: "", qty: "", rate: "", recipe: "", cement: "opc" }]);

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof GradeRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [...prev, note.trim()]);
    setNote("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast({ title: "Validation Error", description: "Please enter the customer name.", variant: "destructive" });
      return;
    }
    if (!customerPhone.trim() || !isValidPhone(customerPhone, true)) {
      toast({ title: "Validation Error", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
      return;
    }
    if (!siteAddress.trim()) {
      toast({ title: "Validation Error", description: "Please specify the site delivery address.", variant: "destructive" });
      return;
    }
    if (!marketingPerson) {
      toast({ title: "Validation Error", description: "Please assign a marketing sales person.", variant: "destructive" });
      return;
    }

    // Map rows
    const items = rows.map(r => ({
      grade: r.grade,
      quantity: Number(r.qty) || 0,
      rate: Number(r.rate) || 0,
      recipeCode: r.recipe || undefined,
      cementType: r.cement || "OPC"
    }));

    if (items.some(item => !item.grade || item.quantity <= 0 || item.rate <= 0)) {
      toast({ title: "Validation Error", description: "Please specify a valid grade, quantity, and rate for all concrete rows.", variant: "destructive" });
      return;
    }

    const payload = {
      quotationNo: quotationNo.trim(),
      date: format(parseISO(dateVal), "dd/MM/yyyy"),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
      customerGstin: customerGstin.trim() || null,
      siteAddress: siteAddress.trim(),
      paymentTerms: paymentTerms.trim() || null,
      pumpCharges: Number(pumpCharges) || null,
      minPumpQty: Number(minPumpQty) || null,
      marketingPerson,
      rateIncludeTax,
      notes,
      items
    };

    createQuotation(payload);
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white";
  const tableHeaderStyle = "bg-[#ea580c] text-white text-[8px] font-black uppercase py-1.5 px-2 border-r border-white/10 last:border-0 text-center tracking-tighter";

  return (
    <div className="bg-[#f8fafc] h-full overflow-hidden flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden border-t-2 border-[#ea580c]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase">Add Quotation</h2>
            <div className="h-4 w-px bg-gray-300 mx-0.5" />
            <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
              <Link href="/dashboard" className="hover:text-[#ea580c]">Home</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href="/customer-po" className="hover:text-[#ea580c]">Customer & PO</Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-[#ea580c]">New Quotation</span>
            </nav>
          </div>
          <div className="flex gap-1.5">
             <Link href="/customer-po/quotation">
               <Button type="button" variant="outline" className="border-orange-100/50 text-[#ea580c] hover:bg-orange-50/40 font-black text-[9px] px-3 h-6 uppercase tracking-wider whitespace-nowrap cursor-pointer">Customer Quotation List</Button>
             </Link>
             <Button type="submit" disabled={isPending} className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black text-[9px] px-4 h-6 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center gap-1">
               {isPending ? "Saving..." : "Submit Quotation"}
             </Button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-hidden p-3 flex flex-col gap-3 min-h-0">
          {/* Top Form Grid */}
          <div className="grid grid-cols-4 gap-x-3 gap-y-2 shrink-0 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
             <div>
                <Label className={labelStyle}>Customer Name <span className="text-rose-500">*</span></Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full Name" autoComplete="off" className={inputStyle} />
             </div>
             <div>
                <Label className={labelStyle}>Quotation No <span className="text-rose-500">*</span></Label>
                <Input value={quotationNo} onChange={e => setQuotationNo(e.target.value)} placeholder="QUOT/YYYYMMDD/123" className={`${inputStyle} text-[#ea580c] font-black border-[#ea580c]/20 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20`} />
             </div>
             <div>
                <Label className={labelStyle}>Phone Number <span className="text-rose-500">*</span></Label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(sanitizePhone(e.target.value))} placeholder="10-digit contact no" autoComplete="off" className={inputStyle} maxLength={10} />
             </div>
             <div>
                <Label className={labelStyle}>Date</Label>
                <Input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} className={inputStyle} />
             </div>
             
             <div>
                <Label className={labelStyle}>Pump Charges</Label>
                <div className="flex gap-1">
                   <Input value={pumpCharges} onChange={e => setPumpCharges(e.target.value)} placeholder="Amount" className={`${inputStyle} flex-1`} />
                   <Input value={minPumpQty} onChange={e => setMinPumpQty(e.target.value)} placeholder="Min Qty" className={`${inputStyle} w-16`} />
                </div>
             </div>
             <div>
                <Label className={labelStyle}>Email Address</Label>
                <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" autoComplete="off" className={inputStyle} />
             </div>
             <div>
                <Label className={labelStyle}>Marketing Person <span className="text-rose-500">*</span></Label>
                <Select value={marketingPerson} onValueChange={setMarketingPerson}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {marketingStaff.length > 0 ? (
                      marketingStaff.map((m: any) => (
                        <SelectItem key={m.id || m._id} value={m.name || m.fullName} className="text-[10px] font-bold">
                          {m.name || m.fullName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled className="text-[10px] font-bold">No sales staff registered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
             </div>
             <div>
                <Label className={labelStyle}>Payment Terms</Label>
                <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Ex: 30 Days" className={inputStyle} />
             </div>

             <div className="col-span-2">
                <Label className={labelStyle}>Site Address <span className="text-rose-500">*</span></Label>
                <Input value={siteAddress} onChange={e => setSiteAddress(e.target.value)} placeholder="Delivery location details..." autoComplete="off" className={inputStyle} />
             </div>
             <div>
                <Label className={labelStyle}>GSTIN Number</Label>
                <Input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} placeholder="GST Number" autoComplete="off" className={inputStyle} />
             </div>
             <div className="flex items-end pb-1 gap-2">
                 <Checkbox id="tax" checked={rateIncludeTax} onCheckedChange={v => setRateIncludeTax(!!v)} className="h-3.5 w-3.5 cursor-pointer" />
                 <label htmlFor="tax" className="text-[9px] font-black text-gray-700 uppercase cursor-pointer select-none">Rate includes Tax</label>
             </div>
          </div>

          {/* Grade Selection Table */}
          <div className="flex-1 border border-gray-100 rounded overflow-hidden flex flex-col bg-white min-h-[150px]">
             <div className="flex bg-[#ea580c] shrink-0">
                <div className={tableHeaderStyle + " w-10"}>S/L</div>
                <div className={tableHeaderStyle + " flex-1 text-left"}>Grade / Concrete Type</div>
                <div className={tableHeaderStyle + " w-24 text-right"}>Quantity</div>
                <div className={tableHeaderStyle + " w-24 text-right"}>Rate</div>
                <div className={tableHeaderStyle + " w-32 text-left"}>Recipe Code</div>
                <div className={tableHeaderStyle + " w-24 text-left"}>Cement</div>
                <div className={tableHeaderStyle + " w-8"}></div>
             </div>
             <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100">
                 {rows.map((row, idx) => (
                   <div key={row.id} className="flex border-b items-center hover:bg-orange-50/40/20 group">
                     <div className="w-10 text-center text-[10px] font-bold text-gray-400 border-r py-1">{idx + 1}</div>
                      <div className="flex-1 border-r h-full flex items-center gap-0.5 w-full">
                         <Input
                           value={row.grade}
                           onChange={e => updateRow(row.id, "grade", e.target.value)}
                           placeholder="Grade"
                           className="h-7 border-0 focus-visible:ring-0 text-[10px] font-bold px-2 shadow-none flex-1 bg-transparent"
                         />
                         <Select value={gradesList.includes(row.grade) ? row.grade : ""} onValueChange={v => updateRow(row.id, "grade", v)}>
                           <SelectTrigger className="h-7 w-6 shrink-0 border-0 focus:ring-0 text-[8px] text-slate-400 px-0 shadow-none bg-transparent">
                             <span>▼</span>
                           </SelectTrigger>
                           <SelectContent>
                             {gradesList.map(g => <SelectItem key={g} value={g} className="text-[10px] font-bold">{g}</SelectItem>)}
                           </SelectContent>
                         </Select>
                      </div>
                     <div className="w-24 border-r h-full"><Input value={row.qty} onChange={e => updateRow(row.id, "qty", e.target.value)} placeholder="0" className="h-7 border-0 focus-visible:ring-0 text-[10px] text-right font-black text-[#ea580c] shadow-none px-2" /></div>
                     <div className="w-24 border-r h-full"><Input value={row.rate} onChange={e => updateRow(row.id, "rate", e.target.value)} placeholder="0.00" className="h-7 border-0 focus-visible:ring-0 text-[10px] text-right font-bold shadow-none px-2 text-emerald-600" /></div>
                     <div className="w-32 border-r h-full">
                        <Select value={row.recipe} onValueChange={v => updateRow(row.id, "recipe", v)}>
                          <SelectTrigger className="h-7 border-0 focus:ring-0 text-[10px] px-2 shadow-none"><SelectValue placeholder="Recipe" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CODE_2026_A" className="text-[10px] font-bold">CODE_2026_A</SelectItem>
                            <SelectItem value="CODE_2026_B" className="text-[10px] font-bold">CODE_2026_B</SelectItem>
                            <SelectItem value="CODE_2026_C" className="text-[10px] font-bold">CODE_2026_C</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="w-24 border-r h-full">
                        <Select value={row.cement} onValueChange={v => updateRow(row.id, "cement", v)}>
                          <SelectTrigger className="h-7 border-0 focus:ring-0 text-[10px] px-2 shadow-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="opc" className="text-[10px] font-bold">OPC</SelectItem>
                            <SelectItem value="ppc" className="text-[10px] font-bold">PPC</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="w-8 text-center">
                        <Button type="button" variant="ghost" onClick={() => removeRow(row.id)} className="h-6 w-6 p-0 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></Button>
                     </div>
                   </div>
                 ))}
             </div>
             <div className="p-1 border-t bg-slate-50 flex justify-end shrink-0">
                <Button type="button" variant="ghost" onClick={addRow} className="h-6 text-[9px] font-black text-[#ea580c] uppercase tracking-wider px-3 hover:bg-white cursor-pointer"><Plus className="h-3 w-3 mr-1" /> Add Grade Row</Button>
             </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="shrink-0 bg-slate-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
             <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Terms & Conditions (Printed on PDF)</Label>
                <span className="text-[9px] text-gray-400 font-medium">Add custom terms such as "Validity", "Supply capacity", "Cement brand override", or specific credit clauses that will render on the official proposal PDF layout.</span>
             </div>
             <div className="flex gap-2">
                <Input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addNote())} placeholder="Enter specific term details here..." className="h-8 bg-white border-gray-200 text-gray-800 text-[11px] flex-1 font-semibold focus-visible:ring-[#ea580c]" />
                <Button type="button" onClick={addNote} className="h-8 bg-[#ea580c] hover:bg-[#ea580c] text-white text-[10px] font-bold px-5 uppercase cursor-pointer tracking-wider shrink-0 shadow-sm">Add Term</Button>
             </div>
             {notes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pt-1">
                  {notes.map((n, i) => (
                    <div key={i} className="bg-white text-gray-800 text-[10px] px-2.5 py-1 rounded-md flex items-center gap-2 border border-gray-200/80 font-bold shadow-sm">
                       <span className="text-[#ea580c] font-black">{i+1}.</span> {n}
                       <Trash2 onClick={() => setNotes(prev => prev.filter((_, idx) => idx !== i))} className="h-3 w-3 text-red-400 cursor-pointer hover:text-red-600 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>
      </form>
    </div>
  );
}
