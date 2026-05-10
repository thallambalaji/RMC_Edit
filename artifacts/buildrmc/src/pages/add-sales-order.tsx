// v1.0.2 - Fixed typos and verified logic
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useGetCustomers, useCreateSalesOrder } from "@workspace/api-client-react";
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
import { ChevronRight, ListPlus, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface GradeRow { id: number; grade: string; qty: string; rate: string; }

export default function AddSalesOrder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading: customersLoading } = useGetCustomers();
  const { mutate: createOrder, isPending: isSubmitting } = useCreateSalesOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Sales Order created successfully!" });
        queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
        navigate("/customer-po/sales-order/list");
      },
      onError: (error: any) => {
        console.error("Sales Order Error:", error);
        toast({ 
          title: "Submission Failed", 
          description: error.data?.error || "Please check all fields and try again.", 
          variant: "destructive" 
        });
      }
    }
  });

  const [customerId, setCustomerId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState("");
  const [plant, setPlant] = useState("All Plant");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [taxInclude, setTaxInclude] = useState(true);
  const [gstPercent, setGstPercent] = useState("18.0");
  const [orderType, setOrderType] = useState("OPEN ORDER");
  const [marketingPerson, setMarketingPerson] = useState("FORTUNE CONCRETE");
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([{ id: 1, grade: "", qty: "", rate: "" }]);

  const addRow = () => setGradeRows(prev => [...prev, { id: Date.now(), grade: "", qty: "", rate: "" }]);
  const removeRow = (id: number) => {
    if (gradeRows.length === 1) return;
    setGradeRows(prev => prev.filter(r => r.id !== id));
  };
  const updateRow = (id: number, field: keyof GradeRow, value: string) => {
    setGradeRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Sales Order...", { customerId, poNumber, poDate, itemsCount: gradeRows.length });

    if (!customerId) {
      toast({ title: "Validation Error", description: "Please select a customer", variant: "destructive" });
      return;
    }
    if (!poNumber) {
      toast({ title: "Validation Error", description: "Please enter a PO Number", variant: "destructive" });
      return;
    }

    const items = gradeRows.map(row => ({
      grade: row.grade,
      quantity: parseFloat(row.qty) || 0,
      rate: parseFloat(row.rate) || 0,
      remainingQty: parseFloat(row.qty) || 0
    })).filter(item => item.grade && item.quantity > 0);

    if (items.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one grade with valid quantity", variant: "destructive" });
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    createOrder({
      data: {
        poNumber,
        poDate: poDate.split('-').reverse().join('/'),
        validity,
        customerId,
        siteAddress: siteAddress || siteName,
        taxInclude,
        gstPercent: parseFloat(gstPercent),
        orderType: orderType.toLowerCase(),
        salesPerson: marketingPerson,
        plant,
        items,
        totalAmount,
        status: "pending"
      }
    });
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add Sales Order</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po/sales-order" className="hover:text-primary transition-colors">Sales Order</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Add Sales Order</span>
        </nav>
      </div>

      <div className="flex justify-start mb-2">
        <Link href="/customer-po/sales-order/list">
          <Button variant="outline" className="border-[#3DB9C1] text-[#3DB9C1] hover:bg-cyan-50 gap-2">
            <ListPlus className="h-4 w-4" />
            View Sales Order List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Customer <span className="text-rose-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-[#3DB9C1] transition-all">
                  <SelectValue placeholder={customersLoading ? "Loading..." : "Choose Customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {customers?.length === 0 && <div className="p-2 text-sm text-gray-400 italic text-center">No customers found</div>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Order Date <span className="text-rose-500">*</span></Label>
              <Input 
                type="date" 
                value={poDate} 
                onChange={(e) => setPoDate(e.target.value)}
                className="h-12 border-gray-300 focus:ring-2 focus:ring-[#3DB9C1] transition-all" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">PO Number <span className="text-rose-500">*</span></Label>
              <Input 
                placeholder="Enter PO No." 
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="h-12 border-gray-300 focus:ring-2 focus:ring-[#3DB9C1] transition-all" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Site Name</Label>
              <Input 
                placeholder="Enter Site Name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="h-12 border-gray-300" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Site Address</Label>
              <Input 
                placeholder="Enter Site Address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="h-12 border-gray-300" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">PO Validity</Label>
              <Input 
                type="date" 
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="h-12 border-gray-300" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Plant <span className="text-rose-500">*</span></Label>
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-12 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="All Plant">All Plant</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">GST (%) <span className="text-rose-500">*</span></Label>
              <Select value={gstPercent} onValueChange={setGstPercent}>
                <SelectTrigger className="h-12 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="18.0">GST @18.0%</SelectItem>
                  <SelectItem value="12.0">GST @12.0%</SelectItem>
                  <SelectItem value="5.0">GST @5.0%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Order Type <span className="text-rose-500">*</span></Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="h-12 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN ORDER">OPEN ORDER</SelectItem>
                  <SelectItem value="CLOSE ORDER">CLOSE ORDER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Marketing Person</Label>
              <Select value={marketingPerson} onValueChange={setMarketingPerson}>
                <SelectTrigger className="h-12 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rate-tax" 
                  checked={taxInclude} 
                  onCheckedChange={(v) => setTaxInclude(!!v)}
                  className="text-[#3DB9C1] h-5 w-5 border-gray-300" 
                />
                <label htmlFor="rate-tax" className="text-sm font-semibold text-gray-600">Rate Include Tax?</label>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-lg font-black text-[#3DB9C1] uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Grade Details
              </h3>
              <Button type="button" onClick={addRow} variant="ghost" className="text-[#3DB9C1] hover:bg-cyan-50 font-bold">
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
            </div>
            
            <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="grid grid-cols-12 bg-gray-50 text-gray-500">
                <div className="col-span-4 p-4 text-[10px] font-black uppercase tracking-tighter text-center">Grade</div>
                <div className="col-span-4 p-4 text-[10px] font-black uppercase tracking-tighter text-center border-l border-white">Quantity</div>
                <div className="col-span-3 p-4 text-[10px] font-black uppercase tracking-tighter text-center border-l border-white">Rate</div>
                <div className="col-span-1 p-4"></div>
              </div>
              {gradeRows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 border-t border-gray-100 hover:bg-gray-50/30 transition-colors">
                  <div className="col-span-4 p-3">
                    <Select value={row.grade} onValueChange={(v) => updateRow(row.id, "grade", v)}>
                      <SelectTrigger className="h-10 border-gray-200"><SelectValue placeholder="Choose Grade" /></SelectTrigger>
                      <SelectContent>
                        {["M10", "M15", "M20", "M25", "M30", "M35", "M40"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 p-3 border-l border-gray-50">
                    <Input 
                      value={row.qty} 
                      onChange={(e) => updateRow(row.id, "qty", e.target.value)} 
                      placeholder="Enter Qty" 
                      className="h-10 border-gray-200 text-center font-semibold" 
                    />
                  </div>
                  <div className="col-span-3 p-3 border-l border-gray-50">
                    <Input 
                      value={row.rate} 
                      onChange={(e) => updateRow(row.id, "rate", e.target.value)} 
                      placeholder="Enter Rate" 
                      className="h-10 border-gray-200 text-center" 
                    />
                  </div>
                  <div className="col-span-1 p-3 flex items-center justify-center">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6 mt-12 justify-center">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white px-20 h-14 font-black uppercase tracking-widest shadow-xl shadow-[#3DB9C1]/20 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : null}
              Submit Order
            </Button>
            <Button 
              type="button" 
              onClick={() => navigate("/customer-po/sales-order")} 
              variant="outline"
              className="px-20 h-14 font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 border-gray-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
