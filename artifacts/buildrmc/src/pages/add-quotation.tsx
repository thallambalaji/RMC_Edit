import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Plus, Trash2, FileText, Sparkles, ListPlus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GradeRow { id: number; grade: string; qty: string; rate: string; recipe: string; cement: string; }

export default function AddQuotation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Form state
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

  const [rows, setRows] = useState<GradeRow[]>([
    { id: 1, grade: "", qty: "", rate: "", recipe: "", cement: "opc" },
  ]);

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
    if (!customerName || !customerPhone) {
      toast({ title: "Please fill in the customer name and phone", variant: "destructive" });
      return;
    }
    toast({ title: "Quotation submitted successfully!" });
    navigate("/customer-po/quotation/list");
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-2";
  const tableHeaderStyle = "bg-[#1e40af] text-white text-[8px] font-black uppercase py-1.5 px-2 border-r border-white/10 last:border-0 text-center tracking-tighter";

  return (
    <div className="bg-[#f8fafc] h-full overflow-hidden flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden border-t-2 border-[#1e40af]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase">Add Quotation</h2>
            <div className="h-4 w-px bg-gray-300 mx-0.5" />
            <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
              <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href="/customer-po" className="hover:text-[#1e40af]">Customer & PO</Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-[#1e40af]">New Quotation</span>
            </nav>
          </div>
          <div className="flex gap-1.5">
             <Link href="/customer-po/quotation">
               <Button type="button" variant="outline" className="border-cyan-100 text-[#1e40af] hover:bg-cyan-50 font-black text-[9px] px-3 h-6 uppercase tracking-wider whitespace-nowrap">Customer Quotation List</Button>
             </Link>
             <Button type="submit" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-4 h-6 uppercase tracking-wider shadow-none border-0">Submit Quotation</Button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-hidden p-3 flex flex-col gap-3 min-h-0">
          {/* Top Form Grid */}
          <div className="grid grid-cols-4 gap-x-3 gap-y-2 shrink-0 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
             <div>
               <Label className={labelStyle}>Customer Name <span className="text-rose-500">*</span></Label>
               <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full Name" className={inputStyle} />
             </div>
             <div>
               <Label className={labelStyle}>Quotation No</Label>
               <Input readOnly value="QUOT/2027/001" className={`${inputStyle} bg-gray-100/50 text-gray-500 border-dashed`} />
             </div>
             <div>
               <Label className={labelStyle}>Phone Number <span className="text-rose-500">*</span></Label>
               <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Contact No" className={inputStyle} />
             </div>
             <div>
               <Label className={labelStyle}>Date</Label>
               <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputStyle} />
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
               <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" className={inputStyle} />
             </div>
             <div>
               <Label className={labelStyle}>Marketing Person <span className="text-rose-500">*</span></Label>
               <Select value={marketingPerson} onValueChange={setMarketingPerson}>
                 <SelectTrigger className={inputStyle}><SelectValue placeholder="Select" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="fortune" className="text-[10px]">Fortune Concrete</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label className={labelStyle}>Payment Terms</Label>
               <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Ex: 30 Days" className={inputStyle} />
             </div>

             <div className="col-span-2">
               <Label className={labelStyle}>Site Address <span className="text-rose-500">*</span></Label>
               <Input value={siteAddress} onChange={e => setSiteAddress(e.target.value)} placeholder="Delivery location details..." className={inputStyle} />
             </div>
             <div>
               <Label className={labelStyle}>GSTIN Number</Label>
               <Input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} placeholder="GST Number" className={inputStyle} />
             </div>
             <div className="flex items-end pb-1 gap-2">
                <Checkbox id="tax" checked={rateIncludeTax} onCheckedChange={v => setRateIncludeTax(!!v)} className="h-3 w-3" />
                <label htmlFor="tax" className="text-[9px] font-black text-gray-700 uppercase cursor-pointer">Rate includes Tax</label>
             </div>
          </div>

          {/* Grade Selection Table */}
          <div className="flex-1 border border-gray-100 rounded overflow-hidden flex flex-col bg-white min-h-[150px]">
             <div className="flex bg-[#1e40af] shrink-0">
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
                  <div key={row.id} className="flex border-b items-center hover:bg-cyan-50/20 group">
                    <div className="w-10 text-center text-[10px] font-bold text-gray-300 border-r py-1">{idx + 1}</div>
                    <div className="flex-1 border-r h-full">
                       <Select value={row.grade} onValueChange={v => updateRow(row.id, "grade", v)}>
                         <SelectTrigger className="h-7 border-0 focus:ring-0 text-[10px] px-2 shadow-none font-bold"><SelectValue placeholder="Choose Grade" /></SelectTrigger>
                         <SelectContent>
                           {["M10", "M20", "M25", "M30"].map(g => <SelectItem key={g} value={g} className="text-[10px]">{g}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="w-24 border-r h-full"><Input value={row.qty} onChange={e => updateRow(row.id, "qty", e.target.value)} className="h-7 border-0 focus-visible:ring-0 text-[10px] text-right font-black text-cyan-600 shadow-none px-2" /></div>
                    <div className="w-24 border-r h-full"><Input value={row.rate} onChange={e => updateRow(row.id, "rate", e.target.value)} className="h-7 border-0 focus-visible:ring-0 text-[10px] text-right font-bold shadow-none px-2" /></div>
                    <div className="w-32 border-r h-full">
                       <Select value={row.recipe} onValueChange={v => updateRow(row.id, "recipe", v)}>
                         <SelectTrigger className="h-7 border-0 focus:ring-0 text-[10px] px-2 shadow-none"><SelectValue placeholder="Recipe" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="r1" className="text-[10px]">CODE_2026_A</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="w-24 border-r h-full">
                       <Select value={row.cement} onValueChange={v => updateRow(row.id, "cement", v)}>
                         <SelectTrigger className="h-7 border-0 focus:ring-0 text-[10px] px-2 shadow-none font-bold"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="opc" className="text-[10px]">OPC</SelectItem>
                           <SelectItem value="ppc" className="text-[10px]">PPC</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="w-8 text-center">
                       <Button type="button" variant="ghost" onClick={() => removeRow(row.id)} className="h-6 w-6 p-0 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-1 border-t bg-slate-50 flex justify-end shrink-0">
                <Button type="button" variant="ghost" onClick={addRow} className="h-6 text-[9px] font-black text-[#1e40af] uppercase tracking-wider px-3 hover:bg-white"><Plus className="h-3 w-3 mr-1" /> Add Grade Row</Button>
             </div>
          </div>

          {/* Quick Notes Section */}
          <div className="shrink-0 bg-slate-900 rounded-lg p-2 flex flex-col gap-2">
             <div className="flex gap-2">
                <Input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addNote())} placeholder="Add specific terms or conditions..." className="h-7 bg-white/5 border-white/10 text-white text-[10px] flex-1 focus-visible:ring-[#1e40af]" />
                <Button type="button" onClick={addNote} className="h-7 bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-[9px] font-black px-4 uppercase">Add Term</Button>
             </div>
             {notes.length > 0 && (
               <div className="flex flex-wrap gap-1.5 max-h-[40px] overflow-y-auto scrollbar-hide">
                 {notes.map((n, i) => (
                   <div key={i} className="bg-white/10 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1.5 border border-white/5 font-medium">
                      <span className="opacity-40">{i+1}.</span> {n}
                      <Trash2 onClick={() => setNotes(prev => prev.filter((_, idx) => idx !== i))} className="h-2.5 w-2.5 text-rose-400 cursor-pointer hover:text-rose-500" />
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
