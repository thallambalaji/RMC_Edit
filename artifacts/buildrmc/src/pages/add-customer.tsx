import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCreateCustomer, useGetMasters, useGetEmployees } from "@workspace/api-client-react";
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
import { ChevronRight, Loader2, Save, UserPlus, SlidersHorizontal, Building2, UserCircle2, Tags, MapPin, CheckCircle2, XCircle, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { sanitizePhone, isValidPhone } from "@/lib/utils";


type GstinStatus = "idle" | "loading" | "verified" | "invalid" | "unverified";

export default function AddCustomer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // GSTIN verification state
  const [gstinStatus, setGstinStatus] = useState<GstinStatus>("idle");
  const [gstinVerifiedData, setGstinVerifiedData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    contact: "",
    email: "",
    address: "",
    gstNumber: "",
    creditTerms: "30 Days",
    state: "TELANGANA",
    pinCode: "",
    location: "",
    panNo: "",
    marketingPerson: "",
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    businessGroup: "READY MIX CONCRETE",
    contactPersonName: "",
    contactPersonPhone: "",
    sourceType: "direct",
    designation: "owner",
    plant: "",
    businessType: "B2B",
    isTcsEnabled: true,
    isTdsEnabled: false,
  });

  const { data: plants } = useGetMasters("plant");
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

  useEffect(() => {
    if (plants && plants.length > 0 && !formData.plant) {
      setFormData(prev => ({ ...prev, plant: plants[0].name }));
    }
  }, [plants, formData.plant]);

  useEffect(() => {
    if (marketingStaff.length > 0 && !formData.marketingPerson) {
      setFormData(prev => ({ ...prev, marketingPerson: marketingStaff[0].name || marketingStaff[0].fullName }));
    }
  }, [marketingStaff, formData.marketingPerson]);

  // Multiple Sites state representing dynamic list of site inputs
  const [sites, setSites] = useState<Array<{ name: string; address: string; pinCode: string }>>([
    { name: "", address: "", pinCode: "" }
  ]);

  const handleAddSiteRow = () => {
    setSites(prev => [...prev, { name: "", address: "", pinCode: "" }]);
    toast({ title: "Site Row Added", description: "Created an additional site destination entry." });
  };

  const handleRemoveSiteRow = (index: number) => {
    if (sites.length === 1) return;
    setSites(prev => prev.filter((_, idx) => idx !== index));
    toast({ title: "Site Row Removed" });
  };

  const handleSiteValueChange = (index: number, field: "name" | "address" | "pinCode", value: string) => {
    setSites(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  // Create Customer API mutation hooked up to live Atlas database
  const { mutate: createCustomer, isPending } = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer Created! 🎉", description: `${formData.name} is successfully registered inside MongoDB.` });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        navigate("/customer-po/customer");
      },
      onError: (error: any) => {
        const errorDetail = error.data?.detail || error.data?.error || error.message || "Unknown server error";
        toast({ 
          title: "Failed to save customer", 
          description: errorDetail, 
          variant: "destructive" 
        });
      }
    }
  });

  // Real GSTIN Verification — calls backend which hits official GST API
  const handleValidateGSTIN = async () => {
    const gst = formData.gstNumber.trim().toUpperCase();
    if (!gst) {
      toast({ title: "Validation Error", description: "Please enter a GSTIN number first.", variant: "destructive" });
      return;
    }
    if (gst.length !== 15) {
      toast({ title: "Invalid GSTIN", description: "GSTIN must be exactly 15 characters.", variant: "destructive" });
      return;
    }

    setGstinStatus("loading");
    setGstinVerifiedData(null);

    try {
      const res = await fetch(`/api/verify-gstin/${encodeURIComponent(gst)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setGstinStatus("invalid");
        setGstinVerifiedData(data);
        toast({
          title: "❌ GSTIN Not Valid",
          description: data.error || "This GSTIN is not registered on the GST portal.",
          variant: "destructive",
        });
        return;
      }

      // Auto-fill form fields from verified GST data
      setFormData(prev => ({
        ...prev,
        gstNumber: gst,
        panNo: data.pan || prev.panNo,
        state: data.state || prev.state,
        legalName: data.legalName || prev.legalName,
        name: prev.name || data.tradeName || data.legalName || prev.name,
      }));

      setGstinVerifiedData(data);

      if (data.verified) {
        // Status check
        const status = (data.status || "").toUpperCase();
        if (status === "CANCELLED" || status === "SUSPENDED") {
          setGstinStatus("invalid");
          toast({
            title: "⚠️ GSTIN Registration Cancelled/Suspended",
            description: `This GSTIN belongs to "${data.legalName || data.tradeName}" but its registration is ${data.status}. Proceed with caution.`,
            variant: "destructive",
          });
        } else {
          setGstinStatus("verified");
          toast({
            title: "✅ GSTIN Verified Successfully!",
            description: `Registered to: ${data.legalName || data.tradeName || "N/A"} | State: ${data.state} | Status: ${data.status || "Active"}`,
          });
        }
      } else {
        // Format valid but not live-verified
        setGstinStatus("unverified");
        toast({
          title: "⚠️ Format Valid — Live Verification Pending",
          description: data.warning || "GSTIN format is correct. Add GSTIN_API_KEY to .env for live GST portal verification.",
        });
      }

    } catch (err: any) {
      setGstinStatus("invalid");
      toast({
        title: "Verification Failed",
        description: "Could not connect to the GST verification service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.address.trim()) {
      toast({ title: "Missing Required Fields", description: "Customer Name, Contact Phone, and Customer Address are mandatory.", variant: "destructive" });
      return;
    }

    if (!isValidPhone(formData.contact, true)) {
      toast({ title: "Validation Error", description: "Customer Phone must be exactly 10 digits.", variant: "destructive" });
      return;
    }

    if (formData.contactPersonPhone && !isValidPhone(formData.contactPersonPhone, false)) {
      toast({ title: "Validation Error", description: "Contact Person Phone must be exactly 10 digits.", variant: "destructive" });
      return;
    }

    // Validate that at least the first site is completed
    const firstSite = sites[0];
    if (!firstSite.name.trim() || !firstSite.address.trim() || !firstSite.pinCode.trim()) {
      toast({ title: "Missing Site Details", description: "Please complete the details of your first site location.", variant: "destructive" });
      return;
    }

    // Concatenate multiple sites cleanly if there are more than 1
    const finalSiteNames = sites.map(s => s.name.trim()).filter(Boolean).join(" | ");
    const finalSiteAddresses = sites.map(s => `${s.address.trim()} (PIN: ${s.pinCode.trim()})`).filter(Boolean).join(" | ");

    const payload = {
      name: formData.name.trim(),
      legalName: formData.legalName.trim() || undefined,
      contact: formData.contact.trim(),
      email: formData.email.trim() || undefined,
      address: formData.address.trim(),
      gstNumber: formData.gstNumber.trim() || undefined,
      panNo: formData.panNo.trim() || undefined,
      location: formData.location.trim() || undefined,
      pinCode: formData.pinCode.trim() || undefined,
      state: formData.state || undefined,
      businessGroup: formData.businessGroup || undefined,
      businessType: formData.businessType || undefined,
      marketingPerson: formData.marketingPerson || undefined,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      creditDays: formData.creditDays ? parseInt(formData.creditDays) : undefined,
      openingBalance: formData.openingBalance ? parseFloat(formData.openingBalance) : undefined,
      contactPersonName: formData.contactPersonName.trim() || undefined,
      contactPersonPhone: formData.contactPersonPhone.trim() || undefined,
      sourceType: formData.sourceType || undefined,
      designation: formData.designation || undefined,
      plant: formData.plant || undefined,
      siteName: finalSiteNames || undefined,
      siteAddress: finalSiteAddresses || undefined,
      creditTerms: formData.creditTerms || undefined,
      isTcsEnabled: formData.isTcsEnabled,
      isTdsEnabled: formData.isTdsEnabled,
    };

    createCustomer({ data: payload });
  };

  const handleChange = (field: string, value: any) => {
    let finalVal = value;
    if (field === "contact" || field === "contactPersonPhone") {
      finalVal = sanitizePhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: finalVal }));
  };


  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white";

  return (
    <div className="bg-[#f8fafc] h-full overflow-hidden flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden border-t-2 border-[#ea580c]">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#ea580c]/10 p-1 rounded">
               <UserPlus className="h-3 w-3 text-[#ea580c]" />
            </div>
            <h2 className="text-[11px] font-black text-gray-900 tracking-tight uppercase">New Customer Registration</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[8px] text-muted-foreground flex items-center gap-0.5 font-bold uppercase tracking-tighter">
              <Link href="/dashboard" className="hover:text-[#ea580c]">Home</Link>
              <ChevronRight className="h-2 w-2" />
              <Link href="/customer-po" className="hover:text-[#ea580c]">Customer & PO</Link>
              <ChevronRight className="h-2 w-2" />
              <span className="text-[#ea580c]">Add Customer</span>
            </nav>
          </div>
          <div className="flex gap-1.5">
             <Link href="/customer-po/customer">
                <Button type="button" variant="outline" className="border-orange-100/50 text-[#ea580c] hover:bg-orange-50/40 font-black text-[9px] px-3 h-6 uppercase tracking-wider cursor-pointer">Customer List</Button>
             </Link>
             <Button type="submit" disabled={isPending} className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black text-[9px] px-4 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer">
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Customer
             </Button>
          </div>
        </div>

        {/* Form Body Fields */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-100 pb-10">
          
          {/* Group 1: Business Identity */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
             <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Business Identity</span>
             </div>
             <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                 {/* GSTIN Field with Real GST Portal Verification */}
                 <div className="col-span-1">
                   <Label className={labelStyle}>Customer GSTIN</Label>
                   <div className="relative">
                     <Input
                       placeholder="ENTER GSTIN"
                       className={`${inputStyle} uppercase pr-[75px] ${
                         gstinStatus === "verified" ? "border-emerald-400 bg-emerald-50/30" :
                         gstinStatus === "invalid" ? "border-rose-400 bg-rose-50/30" :
                         gstinStatus === "unverified" ? "border-amber-400 bg-amber-50/30" : ""
                       }`}
                       value={formData.gstNumber}
                       onChange={e => { handleChange("gstNumber", e.target.value); setGstinStatus("idle"); setGstinVerifiedData(null); }}
                     />
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                       {gstinStatus === "verified" && (
                         <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                       )}
                       {gstinStatus === "invalid" && (
                         <XCircle className="h-3 w-3 text-rose-500" />
                       )}
                       {gstinStatus === "unverified" && (
                         <AlertTriangle className="h-3 w-3 text-amber-500" />
                       )}
                       <Button
                         type="button"
                         variant="ghost"
                         onClick={handleValidateGSTIN}
                         disabled={gstinStatus === "loading" || !formData.gstNumber}
                         className="h-5 min-h-0 text-[8px] font-extrabold uppercase bg-orange-50/40 hover:bg-orange-100 text-[#ea580c] px-2 py-0 flex items-center gap-1 shadow-none border border-orange-200 rounded-[4px] cursor-pointer disabled:opacity-50"
                       >
                         {gstinStatus === "loading" ? (
                           <Loader2 className="h-2.5 w-2.5 animate-spin" />
                         ) : (
                           <CheckCircle2 className="h-2.5 w-2.5" />
                         )}
                         {gstinStatus === "loading" ? "..." : "Verify"}
                       </Button>
                     </div>
                   </div>
                   {/* Live verification result badge */}
                   {gstinVerifiedData && gstinStatus === "verified" && (
                     <div className="mt-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[8px] font-bold text-emerald-700 flex items-center gap-1">
                       <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                       <span>✅ Live Verified · {gstinVerifiedData.legalName || gstinVerifiedData.tradeName} · {gstinVerifiedData.status}</span>
                     </div>
                   )}
                   {gstinVerifiedData && gstinStatus === "unverified" && (
                     <div className="mt-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[8px] font-bold text-amber-700 flex items-center gap-1">
                       <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                       <span>⚠️ Format valid · Add API key for live verification</span>
                     </div>
                   )}
                   {gstinVerifiedData && gstinStatus === "invalid" && (
                     <div className="mt-1 px-2 py-1 bg-rose-50 border border-rose-200 rounded text-[8px] font-bold text-rose-700 flex items-center gap-1">
                       <XCircle className="h-2.5 w-2.5 shrink-0" />
                       <span>❌ {gstinVerifiedData.error || "Not registered on GST portal"}</span>
                     </div>
                   )}
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
                  <Input value={formData.contact} onChange={e => handleChange("contact", e.target.value)} placeholder="Phone" className={inputStyle} maxLength={10} required />
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
                  <Input value={formData.location} onChange={e => handleChange("location", e.target.value)} placeholder="City / Area" className={inputStyle} required />
                </div>
                <div>
                  <Label className={labelStyle}>PIN Code <span className="text-rose-500">*</span></Label>
                  <Input value={formData.pinCode} onChange={e => handleChange("pinCode", e.target.value)} placeholder="XXXXXX" className={inputStyle} required />
                </div>
                <div>
                  <Label className={labelStyle}>State <span className="text-rose-500">*</span></Label>
                  <Select value={formData.state} onValueChange={v => handleChange("state", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TELANGANA" className="text-[10px] font-bold">TELANGANA</SelectItem>
                      <SelectItem value="ANDHRA PRADESH" className="text-[10px] font-bold">ANDHRA PRADESH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelStyle}>Marketing Person <span className="text-rose-500">*</span></Label>
                  <Select value={formData.marketingPerson} onValueChange={v => handleChange("marketingPerson", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Person" /></SelectTrigger>
                    <SelectContent>
                      {marketingStaff.length > 0 ? (
                        marketingStaff.map((m: any) => (
                          <SelectItem key={m.id || m._id} value={m.name || m.fullName} className="text-[10px] font-bold">
                            {m.name || m.fullName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_empty" disabled className="text-[10px] font-bold">No sales person registered</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>

          {/* Group 2: Financial & Classification */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
             <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Financial & Classification</span>
             </div>
             <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                <div>
                  <Label className={labelStyle}>Credit Limit <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={formData.creditLimit} onChange={e => handleChange("creditLimit", e.target.value)} placeholder="Limit Amount" className={inputStyle} required />
                </div>
                <div>
                  <Label className={labelStyle}>Credit Days <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={formData.creditDays} onChange={e => handleChange("creditDays", e.target.value)} placeholder="Days" className={inputStyle} required />
                </div>
                <div>
                  <Label className={labelStyle}>Opening Balance <span className="text-rose-500">*</span></Label>
                  <Input type="number" value={formData.openingBalance} onChange={e => handleChange("openingBalance", e.target.value)} placeholder="₹ 0.00" className={inputStyle} required />
                </div>
                <div>
                  <Label className={labelStyle}>Business Group <span className="text-rose-500">*</span></Label>
                  <Select value={formData.businessGroup} onValueChange={v => handleChange("businessGroup", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="READY MIX CONCRETE" className="text-[10px] font-bold">READY MIX CONCRETE</SelectItem>
                      <SelectItem value="INFRASTRUCTURE BUILDERS" className="text-[10px] font-bold">INFRASTRUCTURE BUILDERS</SelectItem>
                      <SelectItem value="REAL ESTATE DEVELOPERS" className="text-[10px] font-bold">REAL ESTATE DEVELOPERS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className={labelStyle}>Source Type</Label>
                  <Select value={formData.sourceType} onValueChange={v => handleChange("sourceType", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct" className="text-[10px] font-bold">Direct</SelectItem>
                      <SelectItem value="referral" className="text-[10px] font-bold">Referral</SelectItem>
                      <SelectItem value="campaign" className="text-[10px] font-bold">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelStyle}>Customer Designation</Label>
                  <Select value={formData.designation} onValueChange={v => handleChange("designation", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue placeholder="Choose Designation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner" className="text-[10px] font-bold">Owner</SelectItem>
                      <SelectItem value="manager" className="text-[10px] font-bold">Manager</SelectItem>
                      <SelectItem value="director" className="text-[10px] font-bold">Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={labelStyle}>Business Type <span className="text-rose-500">*</span></Label>
                  <Select value={formData.businessType} onValueChange={v => handleChange("businessType", v)}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2B" className="text-[10px] font-bold">B2B</SelectItem>
                      <SelectItem value="B2C" className="text-[10px] font-bold">B2C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>

          {/* Group 3: Contact details & Tax configurations */}
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
                      <Input value={formData.contactPersonPhone} onChange={e => handleChange("contactPersonPhone", e.target.value)} placeholder="Phone No" className={inputStyle} maxLength={10} />
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

          {/* Group 4: Default Site Info (Fully Dynamic Row Builder) */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Default Site (Location) Details</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddSiteRow}
                    className="h-5 px-2.5 text-[8px] font-black uppercase text-[#ea580c] border-orange-100/50 cursor-pointer hover:bg-orange-50/40"
                  >
                    + Add More Sites
                  </Button>
              </div>
              
              <div className="space-y-3">
                {sites.map((site, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end border-b border-dashed border-gray-100 pb-2 last:border-b-0 last:pb-0">
                      <div className="col-span-3">
                          {index === 0 && <Label className={labelStyle}>Site Name (Location) <span className="text-rose-500">*</span></Label>}
                          <Input 
                            value={site.name} 
                            onChange={e => handleSiteValueChange(index, "name", e.target.value)} 
                            placeholder="Site / Site Name" 
                            className={inputStyle} 
                            required 
                          />
                      </div>
                      <div className="col-span-5">
                          {index === 0 && <Label className={labelStyle}>Site Address <span className="text-rose-500">*</span></Label>}
                          <Input 
                            value={site.address} 
                            onChange={e => handleSiteValueChange(index, "address", e.target.value)} 
                            placeholder="Delivery Address" 
                            className={inputStyle} 
                            required 
                          />
                      </div>
                      <div className="col-span-3">
                          {index === 0 && <Label className={labelStyle}>PIN Code <span className="text-rose-500">*</span></Label>}
                          <Input 
                            value={site.pinCode} 
                            onChange={e => handleSiteValueChange(index, "pinCode", e.target.value)} 
                            placeholder="XXXXXX" 
                            className={inputStyle} 
                            required 
                          />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                          {sites.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              onClick={() => handleRemoveSiteRow(index)}
                              className="h-7 w-7 p-0 bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer border-0 shadow-sm"
                              title="Delete site entry row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </form>
    </div>
  );
}
