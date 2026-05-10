import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateCustomer } from "@workspace/api-client-react";
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
import { ChevronRight, ListPlus, Loader2, Save, UserPlus, SlidersHorizontal, MapPin, Building2, UserCircle2, Briefcase, Tags, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddCustomer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAdvance, setShowAdvance] = useState(true); // Default to true as per user request to see all fields

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    contact: "",
    email: "",
    address: "",
    gstNumber: "",
    creditTerms: "30 Days",
    state: "JAMMU AND KASHMIR",
    pinCode: "",
    location: "",
    panNo: "",
    marketingPerson: "fortune",
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    businessGroup: "READY MIX CONCRETE",
    contactPersonName: "",
    contactPersonPhone: "",
    sourceType: "",
    designation: "",
    plant: "All Plant",
    businessType: "B2B",
    isTcsEnabled: true,
    isTdsEnabled: false,
    siteName: "",
    siteAddress: "",
    sitePinCode: ""
  });

  const { mutate: createCustomer, isPending } = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer added successfully!" });
        navigate("/customer-po/customer");
      },
      onError: (error: any) => {
        toast({ 
          title: "Failed to add customer", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.address) {
      toast({ title: "Name, contact, and address are required", variant: "destructive" });
      return;
    }
    // @ts-ignore
    createCustomer({ data: {
      ...formData,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      creditDays: formData.creditDays ? parseInt(formData.creditDays) : undefined,
      openingBalance: formData.openingBalance ? parseFloat(formData.openingBalance) : undefined,
    }});
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-2 bg-white";

  return (
    <div className="bg-[#f8fafc] h-full overflow-hidden flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden border-t-2 border-[#1e40af]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#1e40af]/10 p-1 rounded">
               <UserPlus className="h-3 w-3 text-[#1e40af]" />
            </div>
            <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase">New Customer Registration</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
              <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href="/customer-po" className="hover:text-[#1e40af]">Customer & PO</Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-[#1e40af]">Add Customer</span>
            </nav>
          </div>
          <div className="flex gap-1.5">
             <Link href="/customer-po/customer">
               <Button type="button" variant="outline" className="border-cyan-100 text-[#1e40af] hover:bg-cyan-50 font-black text-[9px] px-3 h-6 uppercase tracking-wider">Customer List</Button>
             </Link>
             <Button type="submit" disabled={isPending} className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-4 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5">
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Customer
             </Button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-100 pb-10">
          {/* Section 1: Business Identity */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
             <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Business Identity</span>
             </div>
             <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                <div className="col-span-1">
                  <Label className={labelStyle}>Customer GSTIN <span className="text-rose-500">*</span></Label>
                  <div className="flex gap-1">
                    <Input placeholder="Enter GSTIN" className={`${inputStyle} flex-1 uppercase`} value={formData.gstNumber} onChange={e => handleChange("gstNumber", e.target.value)} />
                    <Button type="button" variant="secondary" className="h-7 text-[8px] font-black uppercase bg-[#1e40af] hover:bg-[#1d4ed8] text-white px-2">Validate</Button>
                  </div>
                </div>
                <div className="col-span-1">
                  <Label className={labelStyle}>Customer Name <span className="text-rose-500">*</span></Label>
                  <Input value={formData.name} onChange={e => handleChange("name", e.target.value)} placeholder="Display Name" className={inputStyle} required />
                </div>
                <div className="col-span-1">
                  <Label className={labelStyle}>Legal Name</Label>
                  <Input value={formData.legalName} onChange={e => handleChange("legalName", e.target.value)} placeholder="As per GST" className={inputStyle} />
                </div>
                <div className="col-span-1">
                  <Label className={labelStyle}>PAN Number</Label>
                  <Input value={formData.panNo} onChange={e => handleChange("panNo", e.target.value)} placeholder="ABCDE1234F" className={`${inputStyle} uppercase`} />
                </div>

                <div className="col-span-1">
                  <Label className={labelStyle}>Customer Phone <span className="text-rose-500">*</span></Label>
                  <Input value={formData.contact} onChange={e => handleChange("contact", e.target.value)} placeholder="Phone" className={inputStyle} required />
                </div>
                <div className="col-span-1">
                  <Label className={labelStyle}>Customer Email</Label>
                  <Input value={formData.email} onChange={e => handleChange("email", e.target.value)} placeholder="Email" className={inputStyle} />
                </div>
                <div className="col-span-2">
                  <Label className={labelStyle}>Customer Address <span className="text-rose-500">*</span></Label>
                  <Input value={formData.address} onChange={e => handleChange("address", e.target.value)} placeholder="Full Billing Address" className={inputStyle} required />
                </div>

                <div>
                  <Label className={labelStyle}>Location <span className="text-rose-500">*</span></Label>
                  <Input value={formData.location} onChange={e => handleChange("location", e.target.value)} placeholder="City / Area" className={inputStyle} />
                </div>
                <div>
                  <Label className={labelStyle}>PIN Code <span className="text-rose-500">*</span></Label>
                  <Input value={formData.pinCode} onChange={e => handleChange("pinCode", e.target.value)} placeholder="XXXXXX" className={inputStyle} />
                </div>
                <div>
                  <Label className={labelStyle}>State <span className="text-rose-500">*</span></Label>
                  <Select value={formData.state} onValueChange={v => handleChange("state", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JAMMU AND KASHMIR" className="text-[10px]">JAMMU AND KASHMIR</SelectItem>
                      <SelectItem value="KARNATAKA" className="text-[10px]">KARNATAKA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelStyle}>Marketing Person <span className="text-rose-500">*</span></Label>
                  <Select value={formData.marketingPerson} onValueChange={v => handleChange("marketingPerson", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Person" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fortune" className="text-[10px]">Fortune Concrete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>

          {/* Section 2: Financial & Classification */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
             <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Financial & Classification</span>
             </div>
             <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                <div>
                  <Label className={labelStyle}>Credit Limit <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={formData.creditLimit} onChange={e => handleChange("creditLimit", e.target.value)} placeholder="Limit Amount" className={inputStyle} />
                </div>
                <div>
                  <Label className={labelStyle}>Credit Days <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={formData.creditDays} onChange={e => handleChange("creditDays", e.target.value)} placeholder="Days" className={inputStyle} />
                </div>
                <div>
                  <Label className={labelStyle}>Opening Balance <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={formData.openingBalance} onChange={e => handleChange("openingBalance", e.target.value)} placeholder="₹ 0.00" className={inputStyle} />
                </div>
                <div>
                  <Label className={labelStyle}>Business Group <span className="text-rose-500">*</span></Label>
                  <Select value={formData.businessGroup} onValueChange={v => handleChange("businessGroup", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="READY MIX CONCRETE" className="text-[10px]">READY MIX CONCRETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className={labelStyle}>Source Type</Label>
                  <Select value={formData.sourceType} onValueChange={v => handleChange("sourceType", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct" className="text-[10px]">Direct</SelectItem>
                      <SelectItem value="referral" className="text-[10px]">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelStyle}>Customer Designation</Label>
                  <Select value={formData.designation} onValueChange={v => handleChange("designation", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Designation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner" className="text-[10px]">Owner</SelectItem>
                      <SelectItem value="manager" className="text-[10px]">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelStyle}>Plant <span className="text-rose-500">*</span></Label>
                  <Select value={formData.plant} onValueChange={v => handleChange("plant", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Plant" className="text-[10px]">All Plant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelStyle}>Business Type <span className="text-rose-500">*</span></Label>
                  <Select value={formData.businessType} onValueChange={v => handleChange("businessType", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2B" className="text-[10px]">B2B</SelectItem>
                      <SelectItem value="B2C" className="text-[10px]">B2C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>

          {/* Section 3: Contact & Tax Options */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
             <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                   <UserCircle2 className="h-3 w-3 text-slate-400" />
                   <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Contact Person Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <Label className={labelStyle}>Contact Person Name</Label>
                      <Input value={formData.contactPersonName} onChange={e => handleChange("contactPersonName", e.target.value)} placeholder="Full Name" className={inputStyle} />
                   </div>
                   <div>
                      <Label className={labelStyle}>Contact Person Phone</Label>
                      <Input value={formData.contactPersonPhone} onChange={e => handleChange("contactPersonPhone", e.target.value)} placeholder="Phone No" className={inputStyle} />
                   </div>
                </div>
             </div>

             <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                   <Tags className="h-3 w-3 text-slate-400" />
                   <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Tax Configurations</span>
                </div>
                <div className="flex items-center gap-6 pt-1">
                   <div className="flex items-center space-x-2">
                      <Checkbox id="tcs" checked={formData.isTcsEnabled} onCheckedChange={v => handleChange("isTcsEnabled", !!v)} className="h-3.5 w-3.5" />
                      <label htmlFor="tcs" className="text-[10px] font-bold text-gray-700 uppercase cursor-pointer">Is TCS Enabled? <span className="text-rose-500">*</span></label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <Checkbox id="tds" checked={formData.isTdsEnabled} onCheckedChange={v => handleChange("isTdsEnabled", !!v)} className="h-3.5 w-3.5" />
                      <label htmlFor="tds" className="text-[10px] font-bold text-gray-700 uppercase cursor-pointer">Is TDS Enabled? <span className="text-rose-500">*</span></label>
                   </div>
                </div>
             </div>
          </div>

          {/* Section 4: Default Site Info */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Default Site (Location) Details</span>
                  </div>
                  <Button type="button" variant="outline" className="h-5 px-2 text-[8px] font-black uppercase text-cyan-600 border-cyan-100">
                    + Add More Sites
                  </Button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                      <Label className={labelStyle}>Site Name (Location) <span className="text-rose-500">*</span></Label>
                      <Input value={formData.siteName} onChange={e => handleChange("siteName", e.target.value)} placeholder="Site / Site Name" className={inputStyle} />
                  </div>
                  <div className="col-span-2">
                      <Label className={labelStyle}>Site Address <span className="text-rose-500">*</span></Label>
                      <Input value={formData.siteAddress} onChange={e => handleChange("siteAddress", e.target.value)} placeholder="Delivery Address" className={inputStyle} />
                  </div>
                  <div className="col-span-1">
                      <Label className={labelStyle}>PIN Code <span className="text-rose-500">*</span></Label>
                      <div className="flex gap-1">
                        <Input value={formData.sitePinCode} onChange={e => handleChange("sitePinCode", e.target.value)} placeholder="XXXXXX" className={`${inputStyle} flex-1`} />
                        <Button type="button" variant="secondary" className="h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </form>
    </div>
  );
}
