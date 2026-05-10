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
import { ClipboardEdit, Plus, Sparkles, ListPlus, ChevronRight } from "lucide-react";

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
  "hover:border-[#3DB9C1] focus:border-[#3DB9C1] focus:ring-1 focus:ring-[#3DB9C1]/30";

const selectTriggerCls = "h-8 text-[13px] border-gray-200 rounded-md hover:border-[#3DB9C1] focus:ring-1 focus:ring-[#3DB9C1]/30";

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
      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "2px solid #e8f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ padding: "7px", borderRadius: "9px", background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 3px 10px rgba(16,185,129,0.3)" }}>
            <ClipboardEdit size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Add Enquiry Form</div>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>Capture new sales lead requirements</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>
            <Link href="/dashboard"><span className="hover:text-emerald-500 cursor-pointer transition-colors">Home</span></Link>
            <ChevronRight size={10} />
            <Link href="/sales"><span className="hover:text-emerald-500 cursor-pointer transition-colors">Sales</span></Link>
            <ChevronRight size={10} />
            <span style={{ color: "#374151" }}>Add Enquiry</span>
          </nav>
          <Link href="/sales/enquiry/list">
            <button className="btn-primary" style={{ background: "linear-gradient(135deg,#3DB9C1,#2299a6)" }}>
              <ListPlus size={12} /> Enquiry List
            </button>
          </Link>
        </div>
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
        <SectionCard title="Requirement Details" accent="#3DB9C1">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>Fill in the project requirement information</span>
            <button type="button" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", fontSize: "10px", fontWeight: 700, color: "#fff", background: "#3b82f6", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              <Plus size={10} /> Add Another Requirement
            </button>
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

        {/* ── Action Buttons ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
          <button type="submit" className="btn-primary" style={{ gap: "6px" }}>
            <Sparkles size={12} /> Submit Enquiry
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate("/sales/enquiry")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
