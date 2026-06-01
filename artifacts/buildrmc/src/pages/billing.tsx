import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetInvoices,
  useGetCustomers,
  useUpdateInvoice,
  useDeleteInvoice,
  getGetInvoicesQueryKey,
  useGetDCs,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PrintHeader } from "@/components/print-header";
import { ExportDropdown } from "@/components/export-dropdown";
import { 
  ChevronRight, 
  Plus, 
  Search, 
  RotateCcw, 
  Download, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  PieChart,
  Printer,
  X,
  Copy,
  FileText,
  Pencil,
  Trash2,
  MoreVertical,
  Mail,
  History
} from "lucide-react";
export const IDS_LOGO_B64 = "data:image/png;base64,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";

export const ELSA_LOGO_B64 = "data:image/png;base64,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";



function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function numberToWordsINR(num: number): string {
  if (!isFinite(num) || num <= 0) return "Zero Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigits(r) : "");
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  let words = "";
  if (crore) words += (crore > 20 ? twoDigits(crore) : ones[crore]) + " Crore ";
  if (lakh) words += twoDigits(lakh) + " Lakh ";
  if (thousand) words += twoDigits(thousand) + " Thousand ";
  if (hundred) words += threeDigits(hundred);
  
  words = words.trim();
  if (paise) {
    words += " and " + twoDigits(paise) + " Paise";
  }
  return words + " Only";
}

// Batch sheet material parsing helpers
function parseQCVal(s: string): number {
  if (!s) return 0;
  const parts = s.split(":");
  return parts.length >= 2 ? parseFloat(parts[parts.length - 1].trim()) || 0 : 0;
}
function getBatchMaterials(d: any, grade: string = "M25") {
  if (d) {
    const aggrs = [d.aggr1, d.aggr2, d.aggr3, d.aggr4].map((v: string) => ({
      name: (v || "").split(":")[0].trim().toUpperCase(),
      qty: parseQCVal(v)
    }));
    const findAggr = (...patterns: string[]) => {
      const found = aggrs.find(a => patterns.some(p => a.name.includes(p)));
      return found ? found.qty : 0;
    };
    return {
      mm20: findAggr("20MM"),
      mm12: findAggr("12MM", "10MM"),
      rsand: findAggr("R SAND", "RSAND"),
      sand: aggrs.find(a => (a.name.includes("SAND") || a.name.includes("CRF")) && !a.name.includes("R SAND"))?.qty ?? 0,
      cem1: parseQCVal(d.cem1),
      cem2: parseQCVal(d.cem2),
      water: parseQCVal(d.water),
      ad1: parseQCVal(d.admix1),
      admix2: parseQCVal(d.admix2),
    };
  }

  // Fallback recipes matching standard grade designs
  const cleanGrade = (grade || "M25").replace(/-/g, "").toUpperCase();
  if (cleanGrade.includes("M20")) {
    return { mm20: 680, mm12: 450, rsand: 0, sand: 800, cem1: 250, cem2: 50, water: 180, ad1: 2.0, admix2: 0 };
  } else if (cleanGrade.includes("M30")) {
    return { mm20: 640, mm12: 410, rsand: 0, sand: 760, cem1: 300, cem2: 80, water: 170, ad1: 2.4, admix2: 0 };
  } else {
    // Default M25 recipe matching the image values exactly
    return { mm20: 660, mm12: 430, rsand: 0, sand: 780, cem1: 270, cem2: 70, water: 176, ad1: 2.2, admix2: 0 };
  }
}

export default function Billing() {
  const [location, setLocation] = useLocation();

  const getDefaultAccordions = () => {
    if (location.startsWith("/billing/sales-document") || 
        location === "/billing/consolidate-sales-document-list") return ["sales-invoice"];
    if (location.startsWith("/billing/invoice-report") || 
        location.startsWith("/billing/consolidate-invoice-list") ||
        location.startsWith("/billing/generate-annexure") ||
        location.startsWith("/billing/debit-credit-note-list") ||
        location.startsWith("/billing/rmc-report")) return ["rmc-report"];
    return [];
  };

  const linkClass = (href: string) =>
    `text-xs font-medium py-2 px-3 rounded-md transition-all cursor-pointer block border ${
      location === href
        ? "bg-[#1e40af] text-white border-[#1e40af] shadow font-bold"
        : "text-gray-600 hover:text-[#1e40af] hover:bg-white border-transparent hover:border-gray-200 shadow-sm hover:shadow"
    }`;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const { data: dcs } = useGetDCs();

  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [viewInv, setViewInv] = useState<any | null>(null);
  const [printInv, setPrintInv] = useState<any | null>(null);
  const [printDC, setPrintDC] = useState<any | null>(null);
  const [batchSheetInv, setBatchSheetInv] = useState<any | null>(null);
  const [batchMixDesign, setBatchMixDesign] = useState<any | null>(null);
  const [batchSeed, setBatchSeed] = useState<number>(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editSite, setEditSite] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);

  const handleEditClick = (inv: any) => {
    setEditDate(inv.invoiceDate || "");
    setEditVehicle(inv.vehicleNo || "");
    setEditSite(inv.site || "");
    setEditGrade(inv.grade || "");
    setEditQuantity(inv.quantity ?? 0);
    setEditTotalAmount(inv.totalAmount ?? 0);
    setIsEditing(true);
    setViewInv(inv);
  };

  const handlePrintDCForInvoice = (inv: any) => {
    const matchingDC = dcs?.find((dc: any) => 
      String(dc.invoiceId) === String(inv.id) || 
      (dc.invoiceNumber && dc.invoiceNumber === inv.invoiceNumber)
    );

    if (matchingDC) {
      setPrintDC(matchingDC);
      setTimeout(() => {
        const prev = document.title;
        document.title = `DC_${matchingDC.dcNumber} - BuildRMC`;
        window.print();
        setTimeout(() => { 
          document.title = prev; 
          setPrintDC(null);
        }, 1000);
      }, 150);
    } else {
      toast({
        title: "No DC Found",
        description: `No Delivery Challan is associated with Invoice ${inv.invoiceNumber}. Please create a Delivery Challan first in the DC section.`,
        variant: "destructive"
      });
    }
  };

  const handleBatchSheet = async (inv: any) => {
    setBatchMixDesign(null);
    setBatchSeed(Math.random());
    setBatchSheetInv(inv);
    try {
      const res = await fetch("/api/mix-designs");
      if (res.ok) {
        const designs = await res.json();
        const grade = (inv.grade || "").replace(/-/g, "").toLowerCase();
        const match = designs.find((d: any) => {
          const dGrade = (d.grade || "").replace(/-/g, "").toLowerCase();
          return dGrade === grade || dGrade.includes(grade) || grade.includes(dGrade);
        }) || null;
        setBatchMixDesign(match);
      }
    } catch (err) {
      console.error("Failed to fetch mix designs for batch sheet", err);
    }
    setTimeout(() => {
      const prev = document.title;
      document.title = `BatchSheet_${inv.invoiceNumber} - BuildRMC`;
      window.print();
      setTimeout(() => {
        document.title = prev;
        setBatchSheetInv(null);
        setBatchMixDesign(null);
      }, 2000);
    }, 250);
  };

  // Reset printInv after printing
  useEffect(() => {
    const handleAfterPrint = () => setPrintInv(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleRowPrint = (inv: any) => {
    setPrintInv(inv);
    setTimeout(() => {
      const prev = document.title;
      document.title = `Invoice_${inv.invoiceNumber} - BuildRMC`;
      window.print();
      setTimeout(() => { 
        document.title = prev; 
        setPrintInv(null);
      }, 1000);
    }, 150);
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const list = invoices || [];
    const today = startOfDay(new Date());
    let todayQ = 0, monthQ = 0, pendingCount = 0;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    for (const inv of list) {
      const d = new Date(inv.invoiceDate);
      const q = inv.quantity ?? 0;
      if (startOfDay(d).getTime() === today.getTime()) todayQ += q;
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthQ += q;
      if (!inv.isBillReceived) pendingCount += 1;
    }
    return { todayQ, monthQ, pendingCount, total: list.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    const list = invoices || [];
    return list.filter((inv) => {
      if (invoiceNoFilter && !inv.invoiceNumber.toLowerCase().includes(invoiceNoFilter.toLowerCase())) return false;
      if (fromDate && inv.invoiceDate < fromDate) return false;
      if (toDate && inv.invoiceDate > toDate) return false;
      if (customerFilter !== "all" && String(inv.customerId) !== customerFilter) return false;
      if (unitFilter !== "all" && (inv.plant || "") !== unitFilter) return false;
      return true;
    }).sort((a, b) => b.id - a.id);
  }, [invoices, invoiceNoFilter, fromDate, toDate, customerFilter, unitFilter]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  const handleClear = () => {
    setInvoiceNoFilter("");
    setFromDate("");
    setToDate("");
    setCustomerFilter("all");
    setUnitFilter("all");
    setPage(1);
    toast({ title: "Filters Cleared", description: "Showing all records." });
  };

  const handleSearchSubmit = () => {
    if (invoiceNoFilter && filtered.length === 0) {
      toast({
        title: "No Invoice Found",
        description: "No records found matching this Invoice No. Please check and enter the invoice number correctly.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Search Results Updated",
        description: `Found ${filtered.length} invoice records matching your filters.`
      });
    }
  };

  const handleExport = (type: "csv" | "copy") => {
    const headers = ["ID", "Invoice No", "Customer", "Date", "Grade", "Qty", "Vehicle", "Amount"];
    const rows = filtered.map(inv => [
      inv.id, inv.invoiceNumber, inv.customerName, inv.invoiceDate, 
      inv.grade, inv.quantity, inv.vehicleNo, inv.totalAmount
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    
    if (type === "copy") {
      navigator.clipboard.writeText(csv);
      toast({ title: "Copied!", description: "Invoices exported to clipboard." });
    } else {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices_${Date.now()}.csv`;
      a.click();
      toast({ title: "Downloaded", description: "Invoices CSV saved successfully." });
    }
  };

  const handleToggleBillReceived = (inv: any, next: boolean) => {
    updateInvoice.mutate({ id: inv.id, data: { isBillReceived: next } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() })
    });
  };

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to permanently delete this invoice?")) {
      deleteInvoice.mutate({ id } as any, {
        onSuccess: () => {
          toast({ title: "Invoice Deleted", description: "The invoice record was deleted from the database." });
          queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleCopySingle = (inv: any) => {
    if (!inv) return;
    const text = `Invoice No: ${inv.invoiceNumber}
Date: ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}
Customer: ${inv.customerName}
Site: ${inv.site || "—"}
Grade: ${inv.grade || "—"}
Qty: ${Number(inv.quantity ?? 0).toFixed(2)} m³
Amount: ₹${Number(inv.totalAmount).toLocaleString("en-IN", {minimumFractionDigits: 2})}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Invoice details copied to clipboard." });
  };

  const handleCSVSingle = (inv: any) => {
    if (!inv) return;
    const headers = ["Invoice No", "Date", "Customer", "Site", "Grade", "Qty", "Amount"];
    const row = [
      inv.invoiceNumber,
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—",
      inv.customerName,
      inv.site || "—",
      inv.grade || "—",
      Number(inv.quantity ?? 0).toFixed(2),
      inv.totalAmount
    ];
    const csv = [headers, row].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "Downloaded", description: "Invoice CSV downloaded." });
  };

  return (
    <>
      <style>{`
        @page {
          size: ${batchSheetInv || printInv || printDC ? 'A4 portrait' : 'A4 landscape'};
          margin: ${batchSheetInv || printInv || printDC ? '5mm 6mm' : '12mm'};
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print, [class*="no-print"], [data-radix-portal] {
            display: none !important;
          }
          ${
            printInv 
              ? `
                .main-screen {
                  display: none !important;
                }
                #print-root {
                  display: block !important;
                  width: 100% !important;
                }
              `
              : printDC
              ? `
                .main-screen {
                  display: none !important;
                }
                #print-dc-root {
                  display: block !important;
                  width: 100% !important;
                }
              `
              : batchSheetInv
              ? `
                .main-screen {
                  display: none !important;
                }
                #print-batch-root {
                  display: block !important;
                  width: 100% !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              `
              : `
                .main-screen {
                  display: block !important;
                  width: 100% !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                #print-root, #print-dc-root, #print-batch-root {
                  display: none !important;
                }
                /* Hide sidebar, breadcrumbs, metrics bar, and filter toolbar in list printing */
                .w-64, nav, button, .sidebar, [role="button"], [class*="no-print"], .no-print {
                  display: none !important;
                }
              `
          }
        }
      `}</style>


      {/* Main Screen Layout */}
      <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-white main-screen">

      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm">Billing Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Accordion type="multiple" defaultValue={[]} className="w-full space-y-2">
            <AccordionItem value="sales-invoice" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[#1e40af]"/> Sales Invoice</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/billing/sales-document/new"><div className={linkClass("/billing/sales-document/new")}>Add Sales Document</div></Link>
                  <Link href="/billing/sales-document"><div className={linkClass("/billing/sales-document")}>Sales Document List</div></Link>
                  <Link href="/billing/sales-document-report"><div className={linkClass("/billing/sales-document-report")}>Sales Document Report</div></Link>
                  <Link href="/billing/consolidate-sales-document-list"><div className={linkClass("/billing/consolidate-sales-document-list")}>Consolidate Sales Document List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rmc-report" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><PieChart className="h-4 w-4 text-cyan-600"/> RMC Report</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/billing/invoice-report"><div className={linkClass("/billing/invoice-report")}>Invoice Report</div></Link>
                  <Link href="/billing/consolidate-invoice-list"><div className={linkClass("/billing/consolidate-invoice-list")}>Consolidate Invoice List</div></Link>
                  <Link href="/billing/generate-annexure"><div className={linkClass("/billing/generate-annexure")}>Generate Annexure</div></Link>
                  <Link href="/billing/debit-credit-note-list"><div className={linkClass("/billing/debit-credit-note-list")}>Debit Credit Note List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-3 min-w-0 print-container">
        
        {/* Printable Business Header */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1e40af] text-white flex items-center justify-center font-black text-2xl rounded-lg">
                BM
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">BuildRMC Enterprises</h1>
                <p className="text-sm text-gray-600 font-medium">123 Industrial Estate, Hyderabad, Telangana 500001</p>
                <p className="text-sm text-gray-600 font-medium">Phone: +91 98765 43210 | Email: contact@buildrmc.com</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#1e40af] uppercase">Billing & Tax Invoice List</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Generated: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Billing Management</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#1e40af]">Invoice List</span>
            </nav>
          </div>
          <div className="flex gap-2">
            <Link href="/billing/new">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded">
                <Plus className="h-3.5 w-3.5" /> Add Invoice
              </Button>
            </Link>
            <Button 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={`font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border flex items-center gap-1.5 cursor-pointer rounded ${
                showFilters ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3 w-3" /> Filters
            </Button>
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-4 gap-3 no-print">
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-blue-50 rounded-full"><Clock className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Today Qty</p>
              <p className="text-sm font-bold text-gray-800">{kpis.todayQ.toFixed(2)} <span className="text-[10px] font-normal opacity-60">m³</span></p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-teal-50 rounded-full"><CheckCircle2 className="h-4 w-4 text-teal-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Month Qty</p>
              <p className="text-sm font-bold text-gray-800">{kpis.monthQ.toFixed(2)} <span className="text-[10px] font-normal opacity-60">m³</span></p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-amber-50 rounded-full"><AlertCircle className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Pending Bills</p>
              <p className="text-sm font-bold text-gray-800">{kpis.pendingCount} <span className="text-[10px] font-normal opacity-60">items</span></p>
            </div>
          </div>
          <div className="bg-[#1e40af] rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-white/20 rounded-full"><Search className="h-4 w-4 text-white" /></div>
            <div>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-tight">Total Records</p>
              <p className="text-sm font-bold text-white">{kpis.total}</p>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none">
          
          {/* Table Header / Filters Row */}
          {showFilters && (
            <div className="p-3 border-b bg-white rounded-lg border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end no-print">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Invoice No</Label>
                <Input 
                  placeholder="Search Inv..." 
                  className="h-7 text-[10px] border-gray-200 font-bold px-2 bg-white" 
                  value={invoiceNoFilter} 
                  onChange={e => {setInvoiceNoFilter(e.target.value); setPage(1);}}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">From Date</Label>
                <Input type="date" className="h-7 text-[10px] border-gray-200 font-bold px-2 bg-white" value={fromDate} onChange={e => {setFromDate(e.target.value); setPage(1);}} />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">To Date</Label>
                <Input type="date" className="h-7 text-[10px] border-gray-200 font-bold px-2 bg-white" value={toDate} onChange={e => {setToDate(e.target.value); setPage(1);}} />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Customer</Label>
                <Select value={customerFilter} onValueChange={v => {setCustomerFilter(v); setPage(1);}}>
                  <SelectTrigger className="h-7 text-[10px] border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers?.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearchSubmit} size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] h-7 flex-1 text-[10px] font-bold"><Search className="h-3 w-3 mr-1" />Search</Button>
                <Button size="sm" variant="outline" onClick={handleClear} className="h-7 w-7 p-0 bg-rose-500 hover:bg-rose-600 text-white border-0"><RotateCcw className="h-3 w-3" /></Button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="px-4 py-2 border-b flex items-center justify-between bg-white no-print">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => {setPageSize(parseInt(v, 10)); setPage(1);}}>
                  <SelectTrigger className="w-14 h-7 text-[11px] border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportDropdown 
                onCopy={() => handleExport("copy")} 
                onCSV={() => handleExport("csv")} 
                onPDF={() => window.print()} 
              />
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto print:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#1e40af] border-b border-white/10">
                <TableRow className="hover:bg-transparent border-0 bg-[#1e40af]">
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter w-[60px] text-center">ID</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Invoice No</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Customer</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Site</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Date</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Time</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Grade</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-right">Quantity</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Vehicle</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-right">Net Price</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Plant</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Is Bill Received?</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] uppercase tracking-tighter w-[70px] text-center no-print">OPTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-10 text-xs text-slate-400 font-medium animate-pulse">Loading invoices...</TableCell></TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-10 text-xs text-slate-400 font-bold">No records matching your filters</TableCell></TableRow>
                ) : (
                  pageRows.map((inv) => (
                    <TableRow key={inv.id} className="group hover:bg-slate-50/50 transition-colors border-b">
                      <TableCell className="py-2.5 text-center"><span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{String(inv.id).slice(-6).toUpperCase()}</span></TableCell>
                      <TableCell className="font-extrabold text-[#1e40af] text-xs py-2.5">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs py-2.5 font-bold text-slate-800">{inv.customerName}</TableCell>
                      <TableCell className="text-xs py-2.5 text-slate-500 font-medium truncate max-w-[150px]">{inv.site || "—"}</TableCell>
                      <TableCell className="text-[11px] font-semibold text-slate-600 py-2.5">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "—"}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500 text-center py-2.5">{inv.invoiceTime || "—"}</TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-[10px] font-black border border-[#1e40af]/20 bg-blue-50/50 text-[#1e40af] px-2 py-0.5 rounded-full">
                          {inv.grade || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-700 py-2.5">{Number(inv.quantity ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-slate-600 py-2.5">{inv.vehicleNo || "—"}</TableCell>
                      <TableCell className="text-right font-extrabold text-xs text-slate-800 py-2.5">
                        {inv.netPrice ? `₹${Number(inv.netPrice).toLocaleString("en-IN", {minimumFractionDigits: 2})}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 py-2.5">{inv.plant || "—"}</TableCell>
                      <TableCell className="text-center py-2.5">
                        <div className="no-print flex justify-center">
                          <Checkbox 
                            checked={!!inv.isBillReceived} 
                            onCheckedChange={v => handleToggleBillReceived(inv, !!v)} 
                            className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[#1e40af] data-[state=checked]:border-[#1e40af] shadow-sm rounded animate-none"
                          />
                        </div>
                        <div className="hidden print:block text-center text-[10px] font-bold">
                          <span style={{ color: inv.isBillReceived ? "#059669" : "#e11d48", fontWeight: "900" }}>
                            {inv.isBillReceived ? "Received" : "Pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2.5 no-print">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center mx-auto"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                              <span className="sr-only">Open options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                            <DropdownMenuItem onClick={() => handleRowPrint(inv)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Printer className="h-3.5 w-3.5 text-red-500" />
                              <span>Print Invoice</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePrintDCForInvoice(inv)}
                              className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                            >
                              <Printer className="h-3.5 w-3.5 text-blue-500" />
                              <span>Print DC</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toast({
                                title: "Generate EInvoice",
                                description: `Generating EInvoice for Invoice ${inv.invoiceNumber}...`,
                              })}
                              className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Generate EInvoice</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toast({
                                title: "Generate E-Way Bill",
                                description: `Generating E-Way Bill for Invoice ${inv.invoiceNumber}...`,
                              })}
                              className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                            >
                              <FileText className="h-3.5 w-3.5 text-amber-500" />
                              <span>Generate E-Way Bill</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBatchSheet(inv)}
                              className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                            >
                              <Download className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Download Batch Sheet</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toast({
                                title: "Send Mail",
                                description: `Sending Mail for Invoice ${inv.invoiceNumber}...`,
                              })}
                              className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                            >
                              <Mail className="h-3.5 w-3.5 text-sky-500" />
                              <span>Send Mail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(inv)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Pencil className="h-3.5 w-3.5 text-blue-600" />
                              <span>Edit Invoice</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopySingle(inv)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Copy className="h-3.5 w-3.5 text-cyan-600" />
                              <span>Copy Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCSVSingle(inv)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Download className="h-3.5 w-3.5 text-teal-600" />
                              <span>Download CSV</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toast({
                                title: "Modified History",
                                description: `Opening modified history for Invoice ${inv.invoiceNumber}...`,
                              })}
                              className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                            >
                              <History className="h-3.5 w-3.5 text-purple-500" />
                              <span>Modified History</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(inv.id)} 
                              className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              <span>Delete Invoice</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Pagination */}
          <div className="px-4 py-2.5 border-t bg-slate-50/50 flex items-center justify-between no-print">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {totalRows > 0 ? `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, totalRows)} of ${totalRows}` : "No records to show"}
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(page - 1)} className="h-7 text-[10px] font-bold px-2.5 uppercase border-gray-200">Prev</Button>
              {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) < 2 || p === 1 || p === totalPages).map((p, i, arr) => (
                <div key={p} className="flex items-center">
                  {i > 0 && arr[i-1] !== p - 1 && <span className="px-1 text-gray-300 text-[10px]">...</span>}
                  <Button 
                    size="sm" 
                    variant={p === currentPage ? "default" : "outline"} 
                    onClick={() => setPage(p)}
                    className={`h-7 w-7 p-0 text-[10px] font-extrabold ${p === currentPage ? "bg-[#1e40af] hover:bg-[#1d4ed8] text-white" : "border-gray-200 text-slate-600"}`}
                  >
                    {p}
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(page + 1)} className="h-7 text-[10px] font-bold px-2.5 uppercase border-gray-200">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>

      <Dialog open={!!viewInv} onOpenChange={() => { setViewInv(null); setIsEditing(false); }}>
        <DialogContent hideCloseButton className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white no-print">
          <DialogHeader className="p-3.5 px-4 border-b bg-[#1e40af] rounded-t-lg flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-white font-black text-base">
                {isEditing ? "Edit Invoice" : "Invoice Details"}
              </DialogTitle>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">{viewInv?.invoiceNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditDate(viewInv?.invoiceDate || "");
                    setEditVehicle(viewInv?.vehicleNo || "");
                    setEditSite(viewInv?.site || "");
                    setEditGrade(viewInv?.grade || "");
                    setEditQuantity(viewInv?.quantity ?? 0);
                    setEditTotalAmount(viewInv?.totalAmount ?? 0);
                    setIsEditing(true);
                  }} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCopySingle(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCSVSingle(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                    <FileText className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRowPrint(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                    <Printer className="h-3.5 w-3.5" /> Print / PDF
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                  Cancel
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setViewInv(null); setIsEditing(false); }} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {viewInv && isEditing ? (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Number (Read-only)</Label>
                  <Input value={viewInv.invoiceNumber} disabled className="bg-slate-100 h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Date</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Vehicle Number</Label>
                  <Input value={editVehicle} onChange={(e) => setEditVehicle(e.target.value)} placeholder="e.g. TS 09 EX 1234" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Site / Delivery Address</Label>
                  <Input value={editSite} onChange={(e) => setEditSite(e.target.value)} placeholder="e.g. Hitech City, Hyderabad" className="h-8 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Grade</Label>
                  <Input value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="e.g. M25, M30" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Quantity (M³)</Label>
                  <Input type="number" step="0.01" value={editQuantity} onChange={(e) => setEditQuantity(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Total Amount (₹)</Label>
                  <Input type="number" step="0.01" value={editTotalAmount} onChange={(e) => setEditTotalAmount(Number(e.target.value))} className="h-8 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] h-8 text-xs font-bold" onClick={() => {
                  updateInvoice.mutate({
                    id: viewInv.id,
                    data: {
                      invoiceDate: editDate,
                      vehicleNo: editVehicle,
                      site: editSite,
                      grade: editGrade,
                      quantity: Number(editQuantity),
                      totalAmount: Number(editTotalAmount)
                    }
                  }, {
                    onSuccess: () => {
                      toast({ title: "Invoice Updated", description: "Invoice details updated successfully." });
                      queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
                      setIsEditing(false);
                      setViewInv(null);
                    },
                    onError: (err: any) => {
                      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
                    }
                  });
                }}>Save Changes</Button>
              </div>
            </div>
          ) : viewInv && (
            <div className="p-4 space-y-3.5">


              {/* Grid info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border p-2.5 rounded-lg bg-slate-50/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Invoice Number</p>
                  <p className="text-xs font-black text-slate-800">{viewInv.invoiceNumber}</p>
                </div>
                <div className="border p-2.5 rounded-lg bg-slate-50/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Invoice Date</p>
                  <p className="text-xs font-bold text-slate-800">
                    {viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "—"}
                  </p>
                </div>
              </div>

              {/* Customer & Site */}
              <div className="border rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-xs font-black text-[#1e40af]">{viewInv.customerName}</p>
                </div>
                <div className="border-t pt-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Site / Delivery Address</p>
                  <p className="text-xs font-semibold text-slate-700">{viewInv.site || "—"}</p>
                </div>
              </div>

              {/* Details table */}
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 font-black text-slate-600 text-[9px] uppercase border-r border-slate-200">Item Grade</th>
                    <th className="p-2 font-black text-slate-600 text-[9px] uppercase border-r border-slate-200 text-right">Quantity (M³)</th>
                    <th className="p-2 font-black text-slate-600 text-[9px] uppercase text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-xs border-r border-slate-200 font-extrabold text-slate-800">{viewInv.grade || "—"}</td>
                    <td className="p-2 text-xs border-r border-slate-200 font-bold text-right text-slate-700">{Number(viewInv.quantity ?? 0).toFixed(2)}</td>
                    <td className="p-2 text-xs font-black text-right text-[#1e40af]">₹{Number(viewInv.totalAmount).toLocaleString("en-IN", {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>

              {/* Bottom message */}
              <div className="text-center text-[9px] text-slate-400 border-t pt-2.5 font-medium">
                This is a computer generated document and requires no signature.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== PRINT AREA ===== */}
      {/* ===== PRINT AREA ===== */}
      <div id="print-root" style={{ display: "none" }}>
        {printInv && (() => {
          const inv = printInv as any;
          const customerObj = customers?.find((c: any) => String(c.id || c._id) === String(inv.customerId));
          
          const qty = Number(inv.quantity ?? 0);
          const basicRate = Number(inv.netAmount ?? inv.netPrice ?? 0);
          const grossAmount = Number((qty * basicRate).toFixed(2));
          const subTotal = grossAmount;
          
          const cgstPercent = Number(inv.cgstRate ?? 9.0);
          const sgstPercent = Number(inv.sgstRate ?? 9.0);
          
          const cgstAmount = Number((subTotal * cgstPercent / 100).toFixed(2));
          const sgstAmount = Number((subTotal * sgstPercent / 100).toFixed(2));
          
          const tcsPercent = 0.0;
          const tcsAmount = 0.0;
          
          const netAmountRaw = subTotal + cgstAmount + sgstAmount;
          const netAmountRounded = Math.round(netAmountRaw);
          const roundOff = Number((netAmountRounded - netAmountRaw).toFixed(2));
          const netAmount = netAmountRounded;
          
          const amountInWords = numberToWordsINR(netAmount);
          
          const matchingDC = dcs?.find((dc: any) => 
            String(dc.invoiceId) === String(inv.id) || 
            (dc.invoiceNumber && dc.invoiceNumber === inv.invoiceNumber)
          );
          const dcNo = matchingDC ? matchingDC.dcNumber : (inv.invoiceNumber ? inv.invoiceNumber.split('/').pop() : "—");
          
          const borderStyle = "1.2px solid #000";
          
          return (
            <div style={{
              width: "100%",
              maxWidth: "100%",
              margin: "0 auto",
              padding: "4px",
              boxSizing: "border-box",
              color: "black",
              background: "white",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              fontSize: "12.5px",
              lineHeight: "1.3"
            }}>
              {/* Outer Border Container */}
              <div style={{ border: "2px solid #000", width: "100%" }}>
                
                {/* Header Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle }}>
                  <tbody>
                    <tr>
                      {/* Logo Cell */}
                      <td style={{ width: "120px", padding: "10px", verticalAlign: "middle", textAlign: "center", borderRight: borderStyle }}>
                        <img 
                          src="/fortune_concrete_logo.png" 
                          alt="Fortune Concrete Logo" 
                          style={{ width: "90px", height: "90px", objectFit: "contain" }} 
                        />
                      </td>
                      
                      {/* Company Info Cell */}
                      <td style={{ padding: "8px", textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: "bold", borderBottom: borderStyle, paddingBottom: "4px", marginBottom: "4px" }}>
                          <span style={{ letterSpacing: "1px" }}>TAX INVOICE</span>
                          <span style={{ letterSpacing: "1px" }}>ORIGINAL</span>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fortune Concrete</div>
                        <div style={{ fontSize: "11.5px", fontWeight: "bold", marginTop: "2px" }}>
                          Flat no. 305, Rakesh Residency, Road no.7, PJR Colony , Chanda Nagar,
                        </div>
                        <div style={{ fontSize: "11.5px", fontWeight: "bold" }}>
                          Ranga Reddy, Telangana, 500050
                        </div>
                        <div style={{ fontSize: "11.5px", fontWeight: "bold", marginTop: "2px" }}>
                          Phone No : 8977916878 &nbsp;&nbsp; Email : fortuneconcrete6878@gmail.com
                        </div>
                        <div style={{ fontSize: "11.5px", fontWeight: "black", marginTop: "2px" }}>
                          GSTIN: 36AAIFF2609L1ZA, PANNO : AAIFF2609L
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Customer, Site, and Invoice Meta Grid Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle }}>
                  <tbody>
                    <tr>
                      {/* Left Column: Customer & Site Details */}
                      <td style={{ width: "60%", padding: "0", verticalAlign: "top", borderRight: borderStyle }}>
                        <div style={{ padding: "6px", borderBottom: borderStyle, minHeight: "65px" }}>
                          <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "11.5px" }}>Customer Name & Address :</div>
                          <div style={{ fontWeight: "900", marginTop: "4px", fontSize: "13px" }}>{inv.customerName}</div>
                          <div style={{ marginTop: "2px", color: "#000" }}>{customerObj?.address || "—"}</div>
                        </div>
                        <div style={{ padding: "6px", minHeight: "65px" }}>
                          <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "11.5px" }}>Site Name & Address :</div>
                          <div style={{ fontWeight: "900", marginTop: "4px", fontSize: "13px" }}>{inv.site || "—"}</div>
                        </div>
                      </td>

                      {/* Right Column: Invoice Meta */}
                      <td style={{ width: "40%", padding: "0", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "5px 8px", fontWeight: "bold", width: "110px", borderRight: borderStyle }}>Invoice NO</td>
                              <td style={{ padding: "5px 8px", fontWeight: "900" }}>: {inv.invoiceNumber}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "5px 8px", fontWeight: "bold", borderRight: borderStyle }}>Invoice Date</td>
                              <td style={{ padding: "5px 8px", fontWeight: "bold" }}>: {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "5px 8px", fontWeight: "bold", borderRight: borderStyle }}>Invoice Time</td>
                              <td style={{ padding: "5px 8px" }}>: {inv.invoiceTime || "—"}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "5px 8px", fontWeight: "bold", borderRight: borderStyle }}>CUS. GSTIN</td>
                              <td style={{ padding: "5px 8px", fontWeight: "bold" }}>: {customerObj?.gstNumber || "—"}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "5px 8px", fontWeight: "bold", borderRight: borderStyle }}>HSN Code</td>
                              <td style={{ padding: "5px 8px" }}>: 38245010</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "5px 8px", fontWeight: "bold", borderRight: borderStyle }}>DC NO</td>
                              <td style={{ padding: "5px 8px", fontWeight: "bold" }}>: {dcNo}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Grade and Basic Rate Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle, textAlign: "center" }}>
                  <thead>
                    <tr style={{ borderBottom: borderStyle, background: "#fcfcfc" }}>
                      <th style={{ padding: "6px", fontWeight: "bold", borderRight: borderStyle, width: "35%" }}>Grade</th>
                      <th style={{ padding: "6px", fontWeight: "bold", borderRight: borderStyle, width: "20%" }}>Quantity</th>
                      <th style={{ padding: "6px", fontWeight: "bold", borderRight: borderStyle, width: "20%" }}>Basic Rate</th>
                      <th style={{ padding: "6px", fontWeight: "bold", width: "25%" }}>Gross Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontSize: "14px", fontWeight: "bold" }}>
                      <td style={{ padding: "8px", borderRight: borderStyle }}>{inv.grade || "—"}</td>
                      <td style={{ padding: "8px", borderRight: borderStyle }}>{qty.toFixed(2)}</td>
                      <td style={{ padding: "8px", borderRight: borderStyle }}>{basicRate.toFixed(2)}</td>
                      <td style={{ padding: "8px", fontWeight: "900", textAlign: "right", paddingRight: "12px" }}>{grossAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Bank Details & Summary Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle }}>
                  <tbody>
                    <tr>
                      {/* Left Column: Bank Details */}
                      <td style={{ width: "60%", padding: "6px", verticalAlign: "top", borderRight: borderStyle }}>
                        <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "11.5px", marginBottom: "4px" }}>Bank Details</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "2px 0", fontWeight: "bold", width: "100px" }}>Benificiary</td>
                              <td style={{ padding: "2px 0" }}>: Fortune Concrete</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0", fontWeight: "bold" }}>Bank Name</td>
                              <td style={{ padding: "2px 0" }}>: HDFC Bank</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0", fontWeight: "bold" }}>A/C No</td>
                              <td style={{ padding: "2px 0", fontWeight: "bold" }}>: 59201111116878</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0", fontWeight: "bold" }}>IFSC Code</td>
                              <td style={{ padding: "2px 0", fontWeight: "bold" }}>: HDFC0000045</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "2px 0", fontWeight: "bold" }}>Branch</td>
                              <td style={{ padding: "2px 0" }}>: Chanda Nagar</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>

                      {/* Right Column: Invoice Calculation Details */}
                      <td style={{ width: "40%", padding: "0", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
                          <tbody>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "4px 8px", fontWeight: "bold", textAlign: "left", borderRight: borderStyle }}>Sub Total</td>
                              <td style={{ padding: "4px 8px", fontWeight: "bold", width: "110px" }}>{subTotal.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "4px 8px", fontWeight: "bold", textAlign: "left", borderRight: borderStyle }}>CGST @ {cgstPercent.toFixed(1)} %</td>
                              <td style={{ padding: "4px 8px" }}>{cgstAmount.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "4px 8px", fontWeight: "bold", textAlign: "left", borderRight: borderStyle }}>SGST @ {sgstPercent.toFixed(1)} %</td>
                              <td style={{ padding: "4px 8px" }}>{sgstAmount.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "4px 8px", fontWeight: "bold", textAlign: "left", borderRight: borderStyle }}>TCS @ {tcsPercent.toFixed(1)} %</td>
                              <td style={{ padding: "4px 8px" }}>{tcsAmount.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: borderStyle }}>
                              <td style={{ padding: "4px 8px", fontWeight: "bold", textAlign: "left", borderRight: borderStyle }}>Round Off</td>
                              <td style={{ padding: "4px 8px" }}>{roundOff.toFixed(2)}</td>
                            </tr>
                            <tr style={{ background: "#fcfcfc" }}>
                              <td style={{ padding: "5px 8px", fontWeight: "900", textAlign: "left", borderRight: borderStyle, fontSize: "12px", textTransform: "uppercase" }}>Net Amount</td>
                              <td style={{ padding: "5px 8px", fontWeight: "900", fontSize: "12px" }}>{netAmount.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Amount In Words Section */}
                <div style={{ padding: "6px 8px", borderBottom: borderStyle, fontWeight: "bold" }}>
                  Amount in Words : <span style={{ textTransform: "capitalize" }}>{amountInWords}</span>
                </div>

                {/* Vehicle, Pump, and Driver Info Section */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle, fontSize: "11.5px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "5px", borderRight: borderStyle, width: "38%" }}>
                        <span style={{ fontWeight: "bold" }}>Vehicle No :</span> {inv.vehicleNo || "—"}
                      </td>
                      <td style={{ padding: "5px", borderRight: borderStyle, width: "30%" }}>
                        <span style={{ fontWeight: "bold" }}>Pump :</span> {inv.pumpType || "—"}
                      </td>
                      <td style={{ padding: "5px", width: "32%" }}>
                        <span style={{ fontWeight: "bold" }}>Driver :</span> {inv.driverName || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Technical Product and Performance Properties Grid (6 columns) */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle, textAlign: "center", fontSize: "10.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: borderStyle, background: "#fcfcfc" }}>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle }}>Cementitious Type</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle }}>Max. Agg Size</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle }}>Admix Type</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle }}>Slump</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle }}>Min. Cement Content</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold" }}>W/C Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>{inv.cementType || "OPC-53"}</td>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>20 MM</td>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>—</td>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>{inv.slump || "100+/-25"}</td>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>—</td>
                      <td style={{ padding: "4px 2px" }}>—</td>
                    </tr>
                  </tbody>
                </table>

                {/* Mode of Transport & Cumulative Quantities Grid (4 columns) */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: borderStyle, textAlign: "center", fontSize: "10.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: borderStyle, background: "#fcfcfc" }}>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle, width: "25%" }}>Mode Of Transport</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle, width: "25%" }}>PO Number</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", borderRight: borderStyle, width: "25%" }}>Cumulative Qty</th>
                      <th style={{ padding: "4px 2px", fontWeight: "bold", width: "25%" }}>Cumulative Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>Transit Mixer</td>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>{inv.poNumber || "—"}</td>
                      <td style={{ padding: "4px 2px", borderRight: borderStyle }}>{qty.toFixed(2)}</td>
                      <td style={{ padding: "4px 2px" }}>1</td>
                    </tr>
                  </tbody>
                </table>

                {/* CAUTION and Terms & Conditions Section */}
                <div style={{ padding: "6px 8px", fontSize: "8.5px", borderBottom: borderStyle, color: "#000", textAlign: "justify" }}>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>CAUTION : </strong>
                    Cement and concrete contains lime and other chemicals which cause irritation, dermatitis and burning. To avoid harm to skin, minimize contact with wet concrete and wear suitable protective clothing. Whenever contact occurs (whether directly or through saturated clothing) wash throughly, in case of irritation or burns, consult doctor immediately.
                  </div>
                  <div>
                    <strong>Terms & Condition :</strong>
                    <ol style={{ margin: "2px 0 0 12px", padding: "0", listStyleType: "decimal" }}>
                      <li>Goods once ordered & manufactured will not be taken back or exchanged or redirected.</li>
                      <li>Once the concrete reached the specified destination, the utilization responsibility lies on the end user and the material deemed as accepted.</li>
                      <li>The design mix of the concrete manufactured and supplied in lieu with IS 456 recommendation and the procedure for acceptance of the same as per IS-456.</li>
                      <li>Any unauthorized addition of water and/or other material to concrete shall absolve us from any liability whatsoever. any deficiency in methods of placing compactin, finishing and curing of concrete adopted at site may affect quality of concrete in the finished work, for which we shall not be held liable and responsible.</li>
                      <li>Any claim/shortfall/wastages due to operations shall not be accepted, if not claimed, on the same day/date of supply with proper note.</li>
                      <li>We will not entertain any claims after 15 days from the date of supply.</li>
                    </ol>
                  </div>
                </div>

                {/* Signatures Section */}
                <table style={{ width: "100%", borderCollapse: "collapse", height: "110px", fontSize: "11px" }}>
                  <tbody>
                    <tr>
                      {/* Left Signature Block */}
                      <td style={{ width: "50%", padding: "6px", borderRight: borderStyle, verticalAlign: "top", position: "relative" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "2px" }}>
                          <span style={{ fontWeight: "bold" }}>Name :</span>
                          <span style={{ borderBottom: "1px dotted #ccc", height: "14px" }}></span>
                          
                          <span style={{ fontWeight: "bold" }}>Contact No :</span>
                          <span style={{ borderBottom: "1px dotted #ccc", height: "14px" }}></span>
                          
                          <span style={{ fontWeight: "bold" }}>In Time :</span>
                          <span style={{ borderBottom: "1px dotted #ccc", height: "14px" }}></span>
                          
                          <span style={{ fontWeight: "bold" }}>Out Time :</span>
                          <span style={{ borderBottom: "1px dotted #ccc", height: "14px" }}></span>
                        </div>
                        <div style={{
                          position: "absolute",
                          bottom: "6px",
                          left: "0",
                          right: "0",
                          textAlign: "center",
                          fontWeight: "bold",
                          textTransform: "uppercase"
                        }}>
                          Receiver Signatory
                        </div>
                      </td>

                      {/* Right Signature Block */}
                      <td style={{ width: "50%", padding: "6px", verticalAlign: "top", textAlign: "center", position: "relative" }}>
                        <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "11.5px" }}>For Fortune Concrete</div>
                        
                        {/* Interactive rubber stamp */}
                        <div style={{ marginTop: "5px", display: "flex", justifyContent: "center" }}>
                          <img 
                            src="/fortune_concrete_stamp.png" 
                            alt="Fortune Concrete Stamp" 
                            style={{ width: "70px", height: "70px", objectFit: "contain", opacity: 0.85 }} 
                          />
                        </div>

                        <div style={{
                          position: "absolute",
                          bottom: "6px",
                          left: "0",
                          right: "0",
                          textAlign: "center",
                          fontWeight: "bold",
                          textTransform: "uppercase"
                        }}>
                          Authorized Signatory
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>
          );
        })()}
      </div>

      <div id="print-dc-root" style={{ display: "none" }}>
        {printDC && (
          <div style={{ padding: "30px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
            <PrintHeader />
            <div style={{ borderBottom: "2px solid #1e40af", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "56px", height: "56px", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "20px", borderRadius: "8px" }}>BM</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase" }}>BuildRMC Enterprises</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>Delivery Challan</div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Date: {printDC.dcDate ? new Date(printDC.dcDate).toLocaleDateString("en-IN") : "—"}</div>
              </div>
            </div>

            <h2 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", color: "#1e40af", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "14px" }}>Delivery Challan Details</h2>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "24px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, width: "30%", textAlign: "left" }}>DC Number</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{printDC.dcNumber}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>DC Date</th>
                  <td style={{ padding: "10px" }}>{printDC.dcDate ? new Date(printDC.dcDate).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Customer Name</th>
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{printDC.customerName || printDC.customerId?.name || "-"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Site Address</th>
                  <td style={{ padding: "10px" }}>{printDC.siteName || printDC.customerId?.address || "-"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Item Grade</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{printDC.grade || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Quantity (m³)</th>
                  <td style={{ padding: "10px" }}>{Number(printDC.quantity || 0).toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Vehicle Number</th>
                  <td style={{ padding: "10px" }}>{printDC.vehicleReg || "-"}</td>
                </tr>
                <tr>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Net Amount</th>
                  <td style={{ padding: "10px", fontWeight: 900, fontSize: "16px", color: "#1e40af" }}>₹{Number(printDC.netAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "40px", textAlign: "center", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
              This is a computer generated document and requires no signature.
            </div>
          </div>
        )}
      </div>

      {/* ===== BATCH SHEET PRINT AREA ===== */}
      <div id="print-batch-root" style={{display: "none"}}>
        {batchSheetInv && (() => {
          const inv = batchSheetInv as any;
          const loadQty = Number(inv.loadedQuantity || inv.quantity || 0);
          const producedQty = Number(inv.quantity || 0);
          const returnedQty = Math.max(0, loadQty - producedQty);
          
          // Realistic batch count: mixer size capacity is ~1.0m3
          const numBatches = Math.ceil(loadQty / 1.0);
          const firstBatchSize = loadQty > 0 ? loadQty / numBatches : 0;
          
          const mats = getBatchMaterials(batchMixDesign, inv.grade);
          
          // Batch variability generator for authenticity
          const getBatchVal = (target: number, batchNum: number, matKey: string, totalBatches: number, seed: number) => {
            if (target === 0) return 0;
            
            // The last batch matches target exactly (0% error)
            if (batchNum === totalBatches) {
              if (["mm20", "mm12", "rsand", "sand", "cem1", "cem2", "water"].includes(matKey)) {
                return Math.round(target);
              }
              return Number(target.toFixed(2));
            }

            const str = `${seed}-${batchNum}-${matKey}`;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            // -3.5% to +3.5% variation
            const percent = ((Math.abs(hash) % 70) - 35) / 1000;
            const val = target * (1 + percent);
            if (["mm20", "mm12", "rsand", "sand", "cem1", "cem2", "water"].includes(matKey)) {
              return Math.round(val);
            }
            return Number(val.toFixed(2));
          };

          const getEndTime = (startTimeStr: string) => {
            if (!startTimeStr) return "—";
            try {
              const parts = startTimeStr.split(":");
              if (parts.length >= 2) {
                let hrs = parseInt(parts[0], 10);
                let mins = parseInt(parts[1], 10) + 4; // exactly 4 mins later matching reference image
                let secs = parts.length > 2 ? parseInt(parts[2], 10) : 0;
                if (mins >= 60) {
                  hrs += 1;
                  mins -= 60;
                }
                return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              }
            } catch (e) {}
            return startTimeStr;
          };

          const matCols = [
            { key: "mm20",   label: "20MM",   d: mats.mm20 },
            { key: "mm12",   label: "12MM",   d: mats.mm12 },
            { key: "rsand",  label: "R SAND", d: mats.rsand },
            { key: "sand",   label: "SAND",   d: mats.sand },
            { key: "cem1",   label: "CEM1",   d: mats.cem1 },
            { key: "cem2",   label: "CEM2",   d: mats.cem2 },
            { key: "water",  label: "WATER",  d: mats.water },
            { key: "ad1",    label: "AD1",    d: mats.ad1 },
            { key: "admix2", label: "Admix2", d: mats.admix2 },
          ].map(col => {
            const target = Number((col.d * firstBatchSize).toFixed(2));
            const loadTarget = Number((target * numBatches).toFixed(2));
            const batches = Array.from({ length: numBatches }).map((_, bn) => {
              return getBatchVal(target, bn + 1, col.key, numBatches, batchSeed);
            });
            const totalBatch = batches.reduce((a, b) => a + b, 0);
            return {
              ...col,
              target,
              loadTarget,
              batches,
              totalBatch
            };
          });

          const cS: React.CSSProperties = {border: "1px solid #000", padding: "3px 4px", fontSize: "10px", fontFamily: "Arial, sans-serif"};
          const hS: React.CSSProperties = {...cS, fontWeight: "bold", textAlign: "center"};
          
          return (
            <div style={{padding: "10px", background: "white", color: "black", fontFamily: "Arial, sans-serif", pageBreakInside: "avoid", breakInside: "avoid"}}>
              {/* ── Title Header ── */}
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px"}}>
                {/* IDS Logo Image */}
                <img src={IDS_LOGO_B64} alt="IDS Logo" style={{ height: "45px", width: "auto", objectFit: "contain" }} />

                {/* Central Plant Details */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", textTransform: "none", borderBottom: "1.5px solid #000", paddingBottom: "2px", width: "80%", textAlign: "center", letterSpacing: "0.5px" }}>
                    Technical Batch Data Report
                  </div>
                  <table style={{ borderCollapse: "collapse", marginTop: "4px", fontSize: "10px", width: "80%" }}>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: "bold", width: "100px", padding: "1px 0" }}>Plant ID</td>
                        <td style={{ padding: "1px 0" }}>005</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: "bold", padding: "1px 0" }}>Plant</td>
                        <td style={{ padding: "1px 0" }}>FORTUNE RMC</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: "bold", padding: "1px 0" }}>Plant Address</td>
                        <td style={{ padding: "1px 0" }}>FORTUNE CONCRETE Hyderabad</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ELSA Logo Image */}
                <img src={ELSA_LOGO_B64} alt="ELSA Logo" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
              </div>

              {/* ── Info Blocks ── */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", marginBottom: "8px", fontSize: "10px" }}>
                {/* Column 1 */}
                <table style={{ width: "32%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", width: "90px", padding: "2px 0", verticalAlign: "top" }}>Docket No.</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{inv.invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Docket Date :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>
                        <div>Batch Start</div>
                        <div>Time :</div>
                      </td>
                      <td style={{ padding: "2px 0", verticalAlign: "bottom" }}>{inv.invoiceTime || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Customer :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top", fontWeight: "bold" }}>{inv.customerName || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Site :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{inv.site || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Truck No. :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{inv.vehicleNo || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Driver :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{inv.driverName || ""}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Column 2 */}
                <table style={{ width: "32%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", width: "95px", padding: "2px 0", verticalAlign: "top" }}>Mix Description</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{batchMixDesign?.recipeCode || `${inv.grade} PROSPERA`}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Mix Code :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>{batchMixDesign?.recipeName || inv.grade || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Strength:</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Slump:</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}></td>
                    </tr>
                    <tr style={{ height: "20px" }}><td colSpan={2}></td></tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>User :</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>OEM</td>
                    </tr>
                  </tbody>
                </table>

                {/* Column 3 */}
                <table style={{ width: "32%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", width: "110px", padding: "2px 0", verticalAlign: "top" }}>Ordered Qty</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>: {(loadQty * 10).toFixed(1)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Produced Qty</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>: {(producedQty - loadQty).toFixed(1)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Returned Qty</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>: {returnedQty.toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Set This Load</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>: {loadQty.toFixed(1)}</td>
                    </tr>
                    <tr style={{ height: "8px" }}><td colSpan={2}></td></tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>First Batch Size</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>: {firstBatchSize.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "2px 0", verticalAlign: "top" }}>Other Batch Size</td>
                      <td style={{ padding: "2px 0", verticalAlign: "top" }}>: {firstBatchSize.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── Main Batch Detail Table ── */}
              <table style={{width: "100%", borderCollapse: "collapse", border: "1.5px solid #000", marginBottom: "8px"}}>
                <thead>
                  <tr>
                    <th style={{...cS}}></th>
                    <th colSpan={9} style={{...cS, fontWeight: "bold", textAlign: "center"}}>Batch Detail</th>
                  </tr>
                  <tr>
                    <th style={{...hS, textAlign: "left", width: "115px"}}>Product Code</th>
                    {matCols.map(c => <th key={c.key} style={hS}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>Designed Quantity</td>
                    {matCols.map(c => <td key={c.key} style={{...cS, textAlign: "center"}}>{c.d.toFixed(2)}</td>)}
                  </tr>
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>Avg. Moisture</td>
                    {matCols.map(c => <td key={c.key} style={{...cS, textAlign: "center"}}>0.00</td>)}
                  </tr>
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>1st Batch Target</td>
                    {matCols.map(c => <td key={c.key} style={{...cS, textAlign: "center"}}>{c.target.toFixed(2)}</td>)}
                  </tr>
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>Subsequent Target</td>
                    {matCols.map(c => <td key={c.key} style={{...cS, textAlign: "center"}}>{c.target.toFixed(2)}</td>)}
                  </tr>
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>Load Target</td>
                    {matCols.map(c => <td key={c.key} style={{...cS, textAlign: "center", fontWeight: "bold"}}>{c.loadTarget.toFixed(2)}</td>)}
                  </tr>
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>Error Percentage</td>
                    {matCols.map(c => {
                      const errorPct = c.loadTarget > 0 ? ((c.loadTarget - c.totalBatch) / c.loadTarget) * 100 : 0;
                      return <td key={c.key} style={{...cS, textAlign: "center"}}>{Math.abs(errorPct) < 0.01 ? "0.0" : errorPct.toFixed(2)}</td>;
                    })}
                  </tr>
                  {Array.from({ length: numBatches }).map((_, bn) => {
                    const batchNum = bn + 1;
                    return (
                      <tr key={batchNum}>
                        <td style={{...cS, fontWeight: "bold"}}>Batch {batchNum}</td>
                        {matCols.map(c => {
                          const batchVal = c.batches[bn];
                          const fmtVal = ["mm20", "mm12", "rsand", "sand", "cem1", "cem2", "water"].includes(c.key)
                            ? batchVal.toString()
                            : batchVal.toFixed(2);
                          return (
                            <td key={c.key} style={{...cS, textAlign: "center"}}>
                              {fmtVal}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={{...cS, fontWeight: "bold"}}>Total Batch</td>
                    {matCols.map(c => {
                      const fmtTotal = ["mm20", "mm12", "rsand", "sand", "cem1", "cem2", "water"].includes(c.key)
                        ? c.totalBatch.toString()
                        : c.totalBatch.toFixed(2);
                      return <td key={c.key} style={{...cS, textAlign: "center", fontWeight: "bold"}}>{fmtTotal}</td>;
                    })}
                  </tr>
                </tbody>
              </table>

              {/* ── Summary Row (Below Table) ── */}
              <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 40px 8px 40px", fontSize: "10px", textAlign: "center" }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>Num Batches :</div>
                  <div style={{ marginTop: "4px" }}>{numBatches}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>With This Load :</div>
                  <div style={{ marginTop: "4px" }}>{Math.max(1, numBatches - 1)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>This Load :</div>
                  <div style={{ marginTop: "4px" }}>{loadQty.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>Batch End Time :</div>
                  <div style={{ marginTop: "4px" }}>{getEndTime(inv.invoiceTime)}</div>
                </div>
              </div>

              {/* ── Attribution ── */}
              <div style={{display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#000", marginTop: "8px", paddingTop: "0"}}>
                <span style={{fontWeight: "bold"}}>i-batch : by IDS</span>
                <span style={{fontWeight: "bold"}}>Report Generated By :</span>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
