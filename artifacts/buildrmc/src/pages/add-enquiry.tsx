import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Reusable compact field components ── */
function Field({
  label,
  required,
  children,
  span,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }} className="flex flex-col gap-1">
      <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md bg-white outline-none transition-all duration-150 " +
  "hover:border-[#ea580c] focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/30";

const selectTriggerCls = "h-8 text-[13px] border-gray-200 rounded-md hover:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/30";

/* ── Section Card ── */
function SectionCard({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e8eef5", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "8px 16px", background: `linear-gradient(135deg, ${accent}18, ${accent}08)`, borderBottom: `2px solid ${accent}30`, display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", borderRadius: "2px", background: accent }} />
        <span style={{ fontSize: "10px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

interface RequirementRow {
  id: number;
  projectName: string;
  locality: string;
  sourceOfLead: string;
  materialType: string;
  paymentTerms: string;
  estimatedRate: string;
  constructionStage: string;
  estimatedQty: string;
  unit: string;
  projectAddress: string;
}

export default function AddEnquiry() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer fields
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [altNumber, setAltNumber] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Multiple Requirement fields state list
  const [requirements, setRequirements] = useState<RequirementRow[]>([
    {
      id: 1,
      projectName: "",
      locality: "",
      sourceOfLead: "",
      materialType: "",
      paymentTerms: "",
      estimatedRate: "",
      constructionStage: "",
      estimatedQty: "",
      unit: "",
      projectAddress: "",
    }
  ]);

  useEffect(() => { setMounted(true); }, []);

  const addRequirement = () => {
    setRequirements(prev => [
      ...prev,
      {
        id: Date.now(),
        projectName: "",
        locality: "",
        sourceOfLead: "",
        materialType: "",
        paymentTerms: "",
        estimatedRate: "",
        constructionStage: "",
        estimatedQty: "",
        unit: "",
        projectAddress: "",
      }
    ]);
  };

  const removeRequirement = (id: number) => {
    if (requirements.length === 1) return;
    setRequirements(prev => prev.filter(r => r.id !== id));
  };

  const updateRequirement = (id: number, field: keyof RequirementRow, value: string) => {
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCancel = () => {
    setContactPerson("");
    setMobile("");
    setAltNumber("");
    setEmail("");
    setCompanyName("");
    setDesignation("");
    setCustomerAddress("");
    setRequirements([
      {
        id: Date.now(),
        projectName: "",
        locality: "",
        sourceOfLead: "",
        materialType: "",
        paymentTerms: "",
        estimatedRate: "",
        constructionStage: "",
        estimatedQty: "",
        unit: "",
        projectAddress: "",
      }
    ]);
    toast({ title: "Form Cleared", description: "All input fields have been reset successfully." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson || !mobile || !designation || !customerAddress) {
      toast({ title: "Validation Error", description: "Please fill all required customer fields (*)", variant: "destructive" });
      return;
    }

    // Validate each requirement
    for (let i = 0; i < requirements.length; i++) {
      const r = requirements[i];
      if (!r.projectName || !r.locality || !r.sourceOfLead || !r.materialType || !r.paymentTerms || !r.estimatedQty || !r.unit || !r.projectAddress) {
        toast({ title: "Validation Error", description: `Please fill all required fields in Requirement #${i + 1}`, variant: "destructive" });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactPerson,
          mobile,
          altNumber,
          email,
          companyName,
          designation,
          customerAddress,
          requirements: requirements.map(r => ({
            projectName: r.projectName,
            locality: r.locality,
            sourceOfLead: r.sourceOfLead,
            materialType: r.materialType,
            paymentTerms: r.paymentTerms,
            estimatedRate: r.estimatedRate ? parseFloat(r.estimatedRate) : undefined,
            constructionStage: r.constructionStage || "Foundation",
            estimatedQty: parseFloat(r.estimatedQty) || 0,
            unit: r.unit,
            projectAddress: r.projectAddress
          }))
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create sales enquiry");
      }

      toast({ title: "Success", description: "Sales Enquiry saved successfully!" });
      navigate("/sales/enquiry/list");
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)", transition: "all 0.4s ease" }}
      className="space-y-3 pb-4"
    >
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Add Enquiry</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/sales" className="hover:text-[#ea580c] transition-colors">Sales</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#ea580c]">Add Enquiry</span>
          </nav>
        </div>
        <Link href="/sales/enquiry/list">
          <Button variant="outline" size="sm" className="h-8 border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c] hover:text-white font-bold uppercase text-[10px] tracking-wider">
            <List className="h-3.5 w-3.5 mr-1.5" /> Enquiry List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ── Customer Details ── */}
        <SectionCard title="Customer Details" accent="#10b981">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <Field label="Contact Person" required>
              <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name" className={inputCls} />
            </Field>
            <Field label="Mobile" required>
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
            </Field>
            <Field label="Alternative Number">
              <input value={altNumber} onChange={(e) => setAltNumber(e.target.value)} placeholder="Alternate phone" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
            </Field>
            <Field label="Company / Individual Name">
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company or individual" className={inputCls} />
            </Field>
            <Field label="Designation" required>
              <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Site Engineer" className={inputCls} />
            </Field>
            <Field label="Customer Address" required span={2}>
              <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Full address" className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        {/* ── Requirement Details ── */}
        <SectionCard title="Requirement Details" accent="#ea580c">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <span className="text-[10px] text-gray-400">Fill in the project requirement information</span>
            <Button 
              type="button" 
              onClick={addRequirement}
              size="sm" 
              className="h-7 bg-[#ea580c] hover:bg-[#d97706] text-white font-bold text-[10px] uppercase tracking-wider px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Requirement
            </Button>
          </div>

          <div className="space-y-6">
            {requirements.map((req, idx) => (
              <div key={req.id} className="p-4 border border-slate-200/60 rounded-lg bg-slate-50/40 relative">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-[#ea580c] uppercase">Requirement #{idx + 1}</span>
                  {requirements.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeRequirement(req.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Field label="Project Name" required>
                    <input 
                      value={req.projectName} 
                      onChange={(e) => updateRequirement(req.id, "projectName", e.target.value)} 
                      placeholder="Project / Site name" 
                      className={inputCls} 
                    />
                  </Field>

                  <Field label="Locality" required>
                    <Select value={req.locality} onValueChange={(v) => updateRequirement(req.id, "locality", v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Locality 1", "Locality 2", "Locality 3", "Whitefield", "Marathahalli", "Yelahanka", "Electronic City", "Koramangala", "Indiranagar", "Jayanagar"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Source of Lead" required>
                    <Select value={req.sourceOfLead} onValueChange={(v) => updateRequirement(req.id, "sourceOfLead", v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Online", "Referral", "Walk-in", "Exhibition", "Cold Call", "Newspaper"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Material Type" required>
                    <Select value={req.materialType} onValueChange={(v) => updateRequirement(req.id, "materialType", v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["RMC", "Sand", "Aggregate", "Cement", "Steel"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Payment Terms" required>
                    <input 
                      value={req.paymentTerms} 
                      onChange={(e) => updateRequirement(req.id, "paymentTerms", e.target.value)} 
                      placeholder="e.g. 30 days" 
                      className={inputCls} 
                    />
                  </Field>

                  <Field label="Estimated Rate">
                    <input 
                      value={req.estimatedRate} 
                      onChange={(e) => updateRequirement(req.id, "estimatedRate", e.target.value)} 
                      placeholder="₹ per unit" 
                      className={inputCls} 
                    />
                  </Field>

                  <Field label="Stage of Construction" required>
                    <Select value={req.constructionStage} onValueChange={(v) => updateRequirement(req.id, "constructionStage", v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Foundation", "Slab", "Columns", "Beams", "Roof", "Plastering"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Estimated Quantity" required>
                    <input 
                      value={req.estimatedQty} 
                      onChange={(e) => updateRequirement(req.id, "estimatedQty", e.target.value)} 
                      placeholder="Qty amount" 
                      className={inputCls} 
                    />
                  </Field>

                  <Field label="Unit" required>
                    <Select value={req.unit} onValueChange={(v) => updateRequirement(req.id, "unit", v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Unit" /></SelectTrigger>
                      <SelectContent>
                        {["m³", "MT", "Bags", "Kilograms", "Tonnes"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Project Address" required span={3}>
                    <input 
                      value={req.projectAddress} 
                      onChange={(e) => updateRequirement(req.id, "projectAddress", e.target.value)} 
                      placeholder="Full project address" 
                      className={inputCls} 
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#ea580c] hover:bg-[#d97706] text-white font-bold h-10 px-8 uppercase text-[11px] tracking-wider"
          >
            {isSubmitting ? "Saving..." : <><Sparkles className="h-3.5 w-3.5 mr-2" /> Submit Enquiry</>}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 font-bold h-10 px-6 uppercase text-[11px] tracking-wider"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
