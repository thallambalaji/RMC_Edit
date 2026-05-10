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
import { ChevronRight, Plus, Trash2, FileText, Sparkles, ListPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GradeRow { id: number; grade: string; qty: string; rate: string; recipe: string; cement: string; }

export default function AddQuotation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => { setMounted(true); }, []);

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
    if (!siteAddress || !paymentTerms) {
      toast({ title: "Please fill in site address and payment terms", variant: "destructive" });
      return;
    }
    if (!marketingPerson) {
      toast({ title: "Please select a marketing person", variant: "destructive" });
      return;
    }
    toast({ title: "Quotation submitted successfully!", description: `Quotation for ${customerName} has been saved.` });
    navigate("/customer-po/quotation/list");
  };

  const handleCancel = () => navigate("/customer-po/quotation");

  return (
    <div
      className="space-y-6"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-200">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Add Customer Quotation</h2>
            <p className="text-sm text-gray-400">Create a new pricing quote for your client</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <nav className="text-xs text-muted-foreground flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/customer-po" className="hover:text-orange-500 transition-colors">Customer PO</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/customer-po/quotation" className="hover:text-orange-500 transition-colors">Quotation</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium">Add</span>
          </nav>
          <Link href="/customer-po/quotation/list">
            <Button className="bg-gradient-to-r from-[#3DB9C1] to-[#2ea4ac] hover:opacity-90 text-white gap-2 shadow-md shadow-cyan-100">
              <ListPlus className="h-4 w-4" />+ Customer Quotation List
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main Form Card */}
        <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 relative z-10">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Customer Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter Customer Name"
                className="h-11 border-gray-200 rounded-lg bg-white hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Quotation No <span className="text-rose-500">*</span>
              </Label>
              <Input
                readOnly
                defaultValue="STARQUOT/2027/0001"
                className="h-11 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Minimum Qty For Pump Charge</Label>
              <Input
                value={minPumpQty}
                onChange={(e) => setMinPumpQty(e.target.value)}
                placeholder="Enter Pump Quantity"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Customer Phone <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter Customer Phone"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Quotation Date</Label>
              <Input
                type="date"
                defaultValue="2026-05-09"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Pump Charges</Label>
              <Input
                value={pumpCharges}
                onChange={(e) => setPumpCharges(e.target.value)}
                placeholder="Enter Pump Charge"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer Email</Label>
              <Input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter Customer Email"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            {/* Site Address spans 2 rows */}
            <div className="space-y-1.5 row-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Site Address <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="Enter Site Address..."
                className="h-[96px] border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200 resize-none"
              />
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="rate-tax"
                  checked={rateIncludeTax}
                  onCheckedChange={(v) => setRateIncludeTax(!!v)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <label htmlFor="rate-tax" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
                  Rate Include Tax?
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Payment Terms <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ex : 80 days"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer GSTIN</Label>
              <Input
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="Enter Customer GSTIN"
                className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Marketing Person <span className="text-rose-500">*</span>
              </Label>
              <Select value={marketingPerson} onValueChange={setMarketingPerson}>
                <SelectTrigger className="h-11 border-gray-200 rounded-lg hover:border-orange-300 focus:ring-2 focus:ring-orange-300 transition-all duration-200">
                  <SelectValue placeholder="Choose Marketing Person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fortune">FORTUNE CONCRETE</SelectItem>
                  <SelectItem value="person2">Person 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-7">
            <div className="flex gap-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNote())}
                placeholder="Add any additional note here..."
                className="border-0 rounded-none h-11 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 bg-white"
              />
              <Button
                type="button"
                onClick={addNote}
                className="bg-gradient-to-r from-[#3DB9C1] to-[#2ea4ac] hover:opacity-90 text-white h-11 rounded-none px-6 font-semibold"
              >
                Add Note
              </Button>
            </div>
          </div>
          {notes.length > 0 && (
            <div className="mt-2 mb-3 space-y-1">
              <Label className="font-extrabold text-sm text-gray-700 tracking-wide">Notes:</Label>
              {notes.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                  <span className="text-orange-400 font-bold">{i + 1}.</span> {n}
                  <button type="button" onClick={() => setNotes(prev => prev.filter((_, idx) => idx !== i))} className="ml-auto text-rose-400 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Grade Table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm mt-4">
            <div className="grid grid-cols-12 bg-gradient-to-r from-[#3DB9C1] to-[#2ea4ac] text-white">
              {["S/L No", "Grade", "Quantity", "Rate", "Recipe Code", "Cement Type"].map((h, i) => (
                <div
                  key={h}
                  className={`p-3 font-bold text-xs uppercase tracking-wider text-center ${
                    i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-2"
                  } ${i < 5 ? "border-r border-white/20" : ""}`}
                >
                  {h}
                </div>
              ))}
            </div>

            {rows.map((row, idx) => (
              <div key={row.id} className="grid grid-cols-12 bg-white border-b border-gray-50 hover:bg-orange-50/30 transition-colors duration-150 group">
                <div className="col-span-1 p-2 flex items-center justify-center text-sm font-semibold text-gray-500 border-r border-gray-100">{idx + 1}</div>
                <div className="col-span-3 p-2 border-r border-gray-100">
                  <Select value={row.grade} onValueChange={(v) => updateRow(row.id, "grade", v)}>
                    <SelectTrigger className="h-9 border-gray-200 bg-white text-sm focus:ring-1 focus:ring-orange-300">
                      <SelectValue placeholder="Choose Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {["M10", "M15", "M20", "M25", "M30", "M35", "M40"].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 p-2 border-r border-gray-100">
                  <Input value={row.qty} onChange={(e) => updateRow(row.id, "qty", e.target.value)} placeholder="Quantity" className="h-9 border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-orange-300" />
                </div>
                <div className="col-span-2 p-2 border-r border-gray-100">
                  <Input value={row.rate} onChange={(e) => updateRow(row.id, "rate", e.target.value)} placeholder="Rate" className="h-9 border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-orange-300" />
                </div>
                <div className="col-span-2 p-2 border-r border-gray-100">
                  <Select value={row.recipe} onValueChange={(v) => updateRow(row.id, "recipe", v)}>
                    <SelectTrigger className="h-9 border-dashed border-gray-200 bg-white text-sm focus:ring-1 focus:ring-orange-300">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="r1">Code 1</SelectItem>
                      <SelectItem value="r2">Code 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 p-2 flex items-center gap-1">
                  <Select value={row.cement} onValueChange={(v) => updateRow(row.id, "cement", v)}>
                    <SelectTrigger className="h-9 border-gray-200 bg-white text-sm flex-1 focus:ring-1 focus:ring-orange-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opc">OPC</SelectItem>
                      <SelectItem value="ppc">PPC</SelectItem>
                    </SelectContent>
                  </Select>
                  <button type="button" onClick={() => removeRow(row.id)} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-md hover:bg-rose-100 text-rose-400 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-gray-50/50 p-2 flex justify-end border-t border-gray-100">
              <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-all duration-150">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 justify-center">
            <Button type="submit" className="bg-gradient-to-r from-[#3DB9C1] to-[#2ea4ac] hover:opacity-90 text-white px-10 h-11 font-bold rounded-xl shadow-md shadow-cyan-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <Sparkles className="h-4 w-4 mr-2" />
              Submit
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="px-10 h-11 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-gray-600">
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
