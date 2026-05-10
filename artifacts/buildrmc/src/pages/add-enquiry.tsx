import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardEdit, Plus, Sparkles, ListPlus, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
  "hover:border-[#1e40af] focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]/30";

const selectTriggerCls = "h-8 text-[13px] border-gray-200 rounded-md hover:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]/30";

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

export default function AddEnquiry() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Customer fields
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [altNumber, setAltNumber] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Requirement fields
  const [projectName, setProjectName] = useState("");
  const [locality, setLocality] = useState("");
  const [sourceOfLead, setSourceOfLead] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [estimatedRate, setEstimatedRate] = useState("");
  const [constructionStage, setConstructionStage] = useState("");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [unit, setUnit] = useState("");
  const [projectAddress, setProjectAddress] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson || !mobile || !designation) {
      toast({ title: "Please fill all required customer fields", variant: "destructive" });
      return;
    }
    if (!projectName || !locality || !sourceOfLead || !materialType || !paymentTerms) {
      toast({ title: "Please fill all required requirement fields", variant: "destructive" });
      return;
    }
    toast({ title: "Enquiry submitted!", description: `Saved for ${contactPerson}` });
    navigate("/sales/enquiry/list");
  };

  return (
    <div
      style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)", transition: "all 0.4s ease" }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Add Enquiry</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/sales" className="hover:text-[#1e40af] transition-colors">Sales</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Add Enquiry</span>
          </nav>
        </div>
        <Link href="/sales/enquiry/list">
          <Button variant="outline" size="sm" className="h-8 border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af] hover:text-white font-bold uppercase text-[10px] tracking-wider">
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
        <SectionCard title="Requirement Details" accent="#1e40af">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>Fill in the project requirement information</span>
            <Button 
              type="button" 
              size="sm" 
              className="h-7 bg-blue-500 hover:bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider px-3"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Another Requirement
            </Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <Field label="Project Name" required>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project / Site name" className={inputCls} />
            </Field>

            <Field label="Locality" required>
              <Select value={locality} onValueChange={setLocality}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Locality 1", "Locality 2", "Locality 3"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Source of Lead" required>
              <Select value={sourceOfLead} onValueChange={setSourceOfLead}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Online", "Referral", "Walk-in", "Exhibition"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Material Type" required>
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["RMC", "Sand", "Aggregate"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Payment Terms" required>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days" className={inputCls} />
            </Field>

            <Field label="Estimated Rate">
              <input value={estimatedRate} onChange={(e) => setEstimatedRate(e.target.value)} placeholder="₹ per unit" className={inputCls} />
            </Field>

            <Field label="Stage of Construction" required>
              <Select value={constructionStage} onValueChange={setConstructionStage}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Foundation", "Slab", "Columns", "Beams", "Roof"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Estimated Quantity" required>
              <input value={estimatedQty} onChange={(e) => setEstimatedQty(e.target.value)} placeholder="Qty amount" className={inputCls} />
            </Field>

            <Field label="Unit" required>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Unit" /></SelectTrigger>
                <SelectContent>
                  {["m³", "MT", "Bags"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Project Address" required span={3}>
              <input value={projectAddress} onChange={(e) => setProjectAddress(e.target.value)} placeholder="Full project address" className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <Button type="submit" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold h-10 px-8 uppercase text-[11px] tracking-wider">
            <Sparkles className="h-3.5 w-3.5 mr-2" /> Submit Enquiry
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700 font-bold h-10 px-6 uppercase text-[11px] tracking-wider"
            onClick={() => navigate("/sales/enquiry")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
