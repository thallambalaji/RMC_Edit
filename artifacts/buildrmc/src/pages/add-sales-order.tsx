// v1.0.3 - Customer site auto-fill + grade text+dropdown
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetCustomers, useCreateSalesOrder, useGetEmployees, useGetMasters } from "@workspace/api-client-react";
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
  const { data: employees } = useGetEmployees();
  
  const salesStaff = useMemo(() => {
    if (!employees) return [];
    return employees.filter((e: any) => 
      e.designation?.toLowerCase().includes("sales") || 
      e.designation?.toLowerCase().includes("marketing") ||
      true // fallback to all employees
    );
  }, [employees]);

  const { mutate: createOrder, isPending: isSubmitting } = useCreateSalesOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Sales Order created successfully!" });
        queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
        navigate("/customer-po/sales-order");
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
  const [plant, setPlant] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [taxInclude, setTaxInclude] = useState(true);
  const [gstPercent, setGstPercent] = useState("18.0");
  const [orderType, setOrderType] = useState("OPEN ORDER");
  const [marketingPerson, setMarketingPerson] = useState("");
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([{ id: 1, grade: "", qty: "", rate: "" }]);

  const { data: plants } = useGetMasters("plant");
  const { data: dbGrades } = useGetMasters("grade");

  const gradesList = useMemo(() => {
    if (dbGrades && dbGrades.length > 0) {
      return dbGrades.map((g: any) => g.name || g.id);
    }
    return [];
  }, [dbGrades]);

  useEffect(() => {
    if (plants && plants.length > 0 && !plant) {
      setPlant(plants[0].name);
    }
  }, [plants, plant]);

  useEffect(() => {
    if (salesStaff.length > 0 && !marketingPerson) {
      setMarketingPerson(salesStaff[0].name || (salesStaff[0] as any).fullName);
    }
  }, [salesStaff, marketingPerson]);

  // Derive selected customer object
  const selectedCustomer = useMemo(
    () => customers?.find((c: any) => String(c.id) === customerId) as any,
    [customers, customerId]
  );

  // Parse pipe-joined siteName from customer DB into individual site names
  const customerSites = useMemo(() => {
    if (!selectedCustomer?.siteName) return [];
    return selectedCustomer.siteName
      .split("|")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [selectedCustomer]);

  // Parse pipe-joined siteAddress from customer DB into individual addresses
  const customerSiteAddresses = useMemo(() => {
    if (!selectedCustomer?.siteAddress) return [];
    return selectedCustomer.siteAddress
      .split("|")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [selectedCustomer]);

  // When customer changes: auto-select first site + address
  useEffect(() => {
    if (!customerId) {
      setSiteName("");
      setSiteAddress("");
      return;
    }
    if (customerSites.length > 0) {
      setSiteName(customerSites[0]);
      setSiteAddress(customerSiteAddresses[0] || "");
    } else {
      setSiteName("");
      setSiteAddress("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, customerSites.join(",")]);

  // When site name changes: auto-fill matching address
  const handleSiteNameChange = (name: string) => {
    setSiteName(name);
    const idx = customerSites.indexOf(name);
    if (idx >= 0 && customerSiteAddresses[idx]) {
      setSiteAddress(customerSiteAddresses[idx]);
    }
  };

  const addRow = () => setGradeRows(prev => [...prev, { id: Date.now(), grade: "", qty: "", rate: "" }]);
  const removeRow = (id: number) => {
    if (gradeRows.length === 1) return;
    setGradeRows(prev => prev.filter(r => r.id !== id));
  };
  const updateRow = (id: number, field: keyof GradeRow, value: string) => {
    setGradeRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCancel = () => {
    setCustomerId("");
    setPoNumber("");
    setPoDate(new Date().toISOString().split('T')[0]);
    setValidity("");
    setPlant(plants && plants.length > 0 ? plants[0].name : "");
    setSiteName("");
    setSiteAddress("");
    setTaxInclude(true);
    setGstPercent("18.0");
    setOrderType("OPEN ORDER");
    setMarketingPerson(salesStaff.length > 0 ? (salesStaff[0].name || (salesStaff[0] as any).fullName) : "");
    setGradeRows([{ id: 1, grade: "", qty: "", rate: "" }]);
    toast({ title: "Form Cleared", description: "All inputs have been reset successfully." });
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
      } as any
    });
  };

  return (
    <div className="space-y-3 pb-2">
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase">New Sales Order Registration</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
            <Link href="/dashboard" className="hover:text-[#ea580c]">Home</Link>
            <ChevronRight className="h-2 w-2" />
            <Link href="/customer-po" className="hover:text-[#ea580c]">Customer & PO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-[#ea580c]">Add Sales Order</span>
          </nav>
        </div>
        <Link href="/customer-po/sales-order">
          <Button variant="outline" size="sm" className="h-6 text-[9px] font-black uppercase border-[#ea580c] text-[#ea580c] hover:bg-orange-50/40 gap-2">
            <ListPlus className="h-3 w-3" /> Sales Order List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Customer <span className="text-rose-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-8 text-xs border-gray-300">
                  <SelectValue placeholder={customersLoading ? "Loading..." : "Choose Customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers && customers.length > 0 ? (
                    customers.map((c: any) => (
                      <SelectItem key={c.id || c._id} value={String(c.id || c._id)} className="text-xs">{c.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No customers found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Order Date <span className="text-rose-500">*</span></Label>
              <Input 
                type="date" 
                value={poDate} 
                onChange={(e) => setPoDate(e.target.value)}
                className="h-8 text-xs border-gray-300" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">PO Number <span className="text-rose-500">*</span></Label>
              <Input 
                placeholder="Enter PO No." 
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="h-8 text-xs border-gray-300" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">PO Validity</Label>
              <Input 
                type="date" 
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="h-8 text-xs border-gray-300" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Site Name</Label>
              {customerSites.length > 0 ? (
                <Select value={siteName} onValueChange={handleSiteNameChange}>
                  <SelectTrigger className="h-8 text-xs border-gray-300">
                    <SelectValue placeholder="Choose Site" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerSites.map((s: string) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={customerId ? "No sites on record — type manually" : "Select customer first"}
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="h-8 text-xs border-gray-300"
                />
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Site Address</Label>
              <Input
                placeholder="Auto-filled from customer sites"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="h-8 text-xs border-gray-300"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Plant <span className="text-rose-500">*</span></Label>
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-8 text-xs border-gray-300"><SelectValue placeholder="Choose Plant" /></SelectTrigger>
                <SelectContent>
                  {plants && plants.length > 0 ? (
                    plants.map((p: any) => (
                      <SelectItem key={p.id || p._id} value={p.name} className="text-xs">{p.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No plants configured</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">GST (%) <span className="text-rose-500">*</span></Label>
              <Select value={gstPercent} onValueChange={setGstPercent}>
                <SelectTrigger className="h-8 text-xs border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="18.0" className="text-xs">GST @18.0%</SelectItem>
                  <SelectItem value="12.0" className="text-xs">GST @12.0%</SelectItem>
                  <SelectItem value="5.0" className="text-xs">GST @5.0%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Order Type <span className="text-rose-500">*</span></Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="h-8 text-xs border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN ORDER" className="text-xs">OPEN ORDER</SelectItem>
                  <SelectItem value="CLOSE ORDER" className="text-xs">CLOSE ORDER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase">Marketing Person</Label>
              <Select value={marketingPerson} onValueChange={setMarketingPerson}>
                <SelectTrigger className="h-8 text-xs border-gray-300"><SelectValue placeholder="Choose Person" /></SelectTrigger>
                <SelectContent>
                  {salesStaff.length > 0 ? (
                    salesStaff.map((e: any) => (
                      <SelectItem key={e.id || e._id} value={e.name || e.fullName} className="text-xs">{e.name || e.fullName}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty" disabled className="text-xs">No sales staff registered</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-6 pt-5">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rate-tax" 
                  checked={taxInclude} 
                  onCheckedChange={(v) => setTaxInclude(!!v)}
                  className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[#ea580c] data-[state=checked]:border-[#ea580c]" 
                />
                <label htmlFor="rate-tax" className="text-[11px] font-bold text-gray-600">Rate Include Tax?</label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
              <h3 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Grade Details
              </h3>
              <Button type="button" onClick={addRow} variant="ghost" size="sm" className="h-7 text-[10px] text-[#ea580c] hover:bg-orange-50/40 font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Grade
              </Button>
            </div>
            
            <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm max-h-[200px] overflow-y-auto">
              <div className="grid grid-cols-12 bg-gray-50 text-gray-500 sticky top-0 z-10 border-b">
                <div className="col-span-5 p-2 text-[10px] font-bold uppercase text-center">Grade</div>
                <div className="col-span-3 p-2 text-[10px] font-bold uppercase text-center border-l">Quantity</div>
                <div className="col-span-3 p-2 text-[10px] font-bold uppercase text-center border-l">Rate</div>
                <div className="col-span-1 p-2"></div>
              </div>
              {gradeRows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 border-b last:border-0 border-gray-100 hover:bg-gray-50/30 transition-colors items-center">
                  <div className="col-span-5 p-2">
                    <div className="flex gap-1">
                      <Input
                        value={row.grade}
                        onChange={(e) => updateRow(row.id, "grade", e.target.value)}
                        placeholder="e.g. M25"
                        className="h-8 text-xs border-gray-200 flex-1"
                      />
                      <Select
                        value={gradesList.includes(row.grade) ? row.grade : ""}
                        onValueChange={(v) => updateRow(row.id, "grade", v)}
                      >
                        <SelectTrigger className="h-8 w-10 shrink-0 border-gray-200 rounded-md px-1">
                          <span className="text-[10px] text-gray-500">▾</span>
                        </SelectTrigger>
                        <SelectContent>
                          {gradesList.length > 0 ? (
                            gradesList.map(g => (
                              <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="_empty" disabled className="text-xs">No grades configured</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="col-span-3 p-2 border-l border-gray-50">
                    <Input 
                      value={row.qty} 
                      onChange={(e) => updateRow(row.id, "qty", e.target.value)} 
                      placeholder="Qty" 
                      className="h-8 text-xs border-gray-200 text-center font-bold" 
                    />
                  </div>
                  <div className="col-span-3 p-2 border-l border-gray-50">
                    <Input 
                      value={row.rate} 
                      onChange={(e) => updateRow(row.id, "rate", e.target.value)} 
                      placeholder="Rate" 
                      className="h-8 text-xs border-gray-200 text-center font-bold" 
                    />
                  </div>
                  <div className="col-span-1 p-2 flex items-center justify-center">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-6 justify-end">
            <Button 
              type="button" 
              onClick={handleCancel} 
              variant="outline"
              size="sm"
              className="px-6 h-9 text-xs font-bold uppercase tracking-wider text-gray-500 border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="sm"
              className="bg-[#ea580c] hover:bg-[#d97706] text-white px-10 h-9 text-xs font-bold uppercase tracking-widest shadow-md shadow-[#ea580c]/10 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Sales Order
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
