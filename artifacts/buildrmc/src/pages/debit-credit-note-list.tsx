import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useGetInvoices, useGetCustomers } from "@workspace/api-client-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  RotateCcw,
  Printer,
  Download,
  X,
  FileBarChart,
  Copy,
  Trash2,
  Plus,
  Sparkles,
  FileText,
  Pencil
} from "lucide-react";

interface NoteRecord {
  id: string;
  noteNo: string;
  invoiceNo: string;
  invoiceType: string;
  noteType: "Debit Note" | "Credit Note";
  date: string;
  item: string;
  quantity: number;
  bookedRate: number;
  currentRate: number;
  amount: number;
  tcsAmount: number;
  netAmount: number;
  customerName?: string;
}

export default function DebitCreditNoteList() {
  const { toast } = useToast();

  // Load live database invoices for matching
  const { data: invoices, isLoading: isLoadingInvoices } = useGetInvoices();
  const { data: customers } = useGetCustomers();

  // Search/Filter states
  const [noteNoFilter, setNoteNoFilter] = useState("");
  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalSearch, setGlobalSearch] = useState("");

  // Storage local notes array
  const [notes, setNotes] = useState<NoteRecord[]>([]);

  // Modal / Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  
  // New Note Form States
  const [formNoteNo, setFormNoteNo] = useState("");
  const [formNoteType, setFormNoteType] = useState<"Debit Note" | "Credit Note">("Debit Note");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formBookedRate, setFormBookedRate] = useState<number>(0);
  const [formCurrentRate, setFormCurrentRate] = useState<number>(0);
  const [formTcsAmount, setFormTcsAmount] = useState<number>(0);
  const [formItem, setFormItem] = useState("");

  const [viewNote, setViewNote] = useState<NoteRecord | null>(null);
  const [printNote, setPrintNote] = useState<NoteRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load from Local Persistence (Simulated Database Table)
  useEffect(() => {
    const saved = localStorage.getItem("buildrmc_debit_credit_notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        setNotes([]);
      }
    } else {
      // Mock starting seed record linked to live pattern for visualization
      const initialSeed: NoteRecord[] = [
        {
          id: "note_1",
          noteNo: "DN/2026/0491",
          invoiceNo: "INV/26-27/2949",
          invoiceType: "Sales Invoice",
          noteType: "Debit Note",
          date: "2026-05-11",
          item: "M25 Grade",
          quantity: 5.0,
          bookedRate: 2000,
          currentRate: 2360,
          amount: 1800,
          tcsAmount: 18,
          netAmount: 1818,
          customerName: "CLOUDSWOOD CONSTRUCTIONS PRIVATE LIMITED"
        }
      ];
      localStorage.setItem("buildrmc_debit_credit_notes", JSON.stringify(initialSeed));
      setNotes(initialSeed);
    }
  }, []);

  // Save to Local Persistence helper
  const saveNotesToStorage = (updatedList: NoteRecord[]) => {
    setNotes(updatedList);
    localStorage.setItem("buildrmc_debit_credit_notes", JSON.stringify(updatedList));
  };

  // Auto-generate note numbers
  const triggerAutoNoteNo = (type: "Debit Note" | "Credit Note") => {
    const prefix = type === "Debit Note" ? "DN" : "CN";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormNoteNo(`${prefix}/2026/${rand}`);
  };

  // Handle selected invoice changes to autopopulate quantities
  useEffect(() => {
    if (!selectedInvoiceId) return;
    const inv = invoices?.find((i) => String(i.id) === selectedInvoiceId);
    if (inv) {
      setFormItem(inv.grade || "M20 Grade");
      const qty = Number(inv.quantity || 0);
      setFormQuantity(qty);
      
      const totalAmt = Number(inv.totalAmount || 0);
      const booked = qty > 0 ? parseFloat((totalAmt / qty).toFixed(2)) : 0;
      setFormBookedRate(booked);
      setFormCurrentRate(booked); // start off equal
      setFormTcsAmount(0);
      triggerAutoNoteNo(formNoteType);
    }
  }, [selectedInvoiceId, formNoteType, invoices]);

  // Compute live totals inside Form
  const formComputedTotals = useMemo(() => {
    const diff = Math.abs(formCurrentRate - formBookedRate);
    const amt = parseFloat((formQuantity * diff).toFixed(2));
    const net = parseFloat((amt + formTcsAmount).toFixed(2));
    return { amt, net };
  }, [formQuantity, formBookedRate, formCurrentRate, formTcsAmount]);

  // Filters & Searching
  const filteredData = useMemo(() => {
    return notes.filter((n) => {
      if (noteNoFilter && !n.noteNo.toLowerCase().includes(noteNoFilter.toLowerCase())) return false;
      if (invoiceNoFilter && !n.invoiceNo.toLowerCase().includes(invoiceNoFilter.toLowerCase())) return false;
      if (fromDate && n.date < fromDate) return false;
      if (toDate && n.date > toDate) return false;
      if (globalSearch) {
        const query = globalSearch.toLowerCase();
        return (
          n.noteNo.toLowerCase().includes(query) ||
          n.invoiceNo.toLowerCase().includes(query) ||
          (n.item || "").toLowerCase().includes(query) ||
          (n.customerName || "").toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [notes, noteNoFilter, invoiceNoFilter, fromDate, toDate, globalSearch]);

  // Pagination parameters
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const pageRows = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, startIndex, pageSize]);

  // Filter Clear Handlers
  const handleClear = () => {
    setNoteNoFilter("");
    setInvoiceNoFilter("");
    setFromDate("");
    setToDate("");
    setGlobalSearch("");
    setCurrentPage(1);
    toast({ title: "Filters cleared" });
  };

  // Saving Note
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNoteNo) {
      toast({ title: "Note No Required", variant: "destructive" });
      return;
    }
    const matchedInv = invoices?.find((i) => String(i.id) === selectedInvoiceId);

    const newRecord: NoteRecord = {
      id: `note_${Date.now()}`,
      noteNo: formNoteNo,
      invoiceNo: matchedInv ? matchedInv.invoiceNumber : "MANUAL_INV",
      invoiceType: "Sales Invoice",
      noteType: formNoteType,
      date: formDate,
      item: formItem,
      quantity: formQuantity,
      bookedRate: formBookedRate,
      currentRate: formCurrentRate,
      amount: formComputedTotals.amt,
      tcsAmount: formTcsAmount,
      netAmount: formComputedTotals.net,
      customerName: matchedInv?.customerName || "General Customer"
    };

    const updated = [newRecord, ...notes];
    saveNotesToStorage(updated);
    setIsCreateOpen(false);
    
    // Clear form
    setSelectedInvoiceId("");
    setFormNoteNo("");
    setFormQuantity(0);
    setFormBookedRate(0);
    setFormCurrentRate(0);
    setFormTcsAmount(0);

    toast({
      title: "Note Created successfully",
      description: `${formNoteType} ${formNoteNo} stored in Atlas system database.`,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    const updated = notes.filter((n) => n.id !== deleteId);
    saveNotesToStorage(updated);
    setDeleteId(null);
    toast({ title: "Record Deleted Successfully" });
  };

  // Row Toolbar Export Handlers
  const handleRowCopy = (n: NoteRecord) => {
    const text = `Note No: ${n.noteNo}\nType: ${n.noteType}\nInv No: ${n.invoiceNo}\nItem: ${n.item}\nQty: ${n.quantity}\nNet Amt: ₹${n.netAmount}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied details to clipboard" });
  };

  const handleRowCSV = (n: NoteRecord) => {
    const headers = ["Note No", "Invoice No", "Note Type", "Date", "Item", "Quantity", "Net Amount"];
    const row = [n.noteNo, n.invoiceNo, n.noteType, n.date, n.item, n.quantity, n.netAmount];
    const csv = [headers, row].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Note_${n.noteNo}.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const handleRowPrint = (n: NoteRecord) => {
    setPrintNote(n);
    setTimeout(() => {
      const prev = document.title;
      document.title = `${n.noteType}_${n.noteNo}`;
      window.print();
      setTimeout(() => {
        document.title = prev;
        setPrintNote(null);
      }, 1000);
    }, 150);
  };

  // Top level toolbar handlers
  const handleCopyReport = () => {
    if (filteredData.length === 0) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Note No", "Invoice No", "Note Type", "Date", "Item", "Qty", "Booked Rate", "Current Rate", "Amount", "TCS", "Net Amount"];
    const rows = filteredData.map(n => [
      n.noteNo, n.invoiceNo, n.noteType, n.date, n.item, n.quantity, n.bookedRate, n.currentRate, n.amount, n.tcsAmount, n.netAmount
    ]);
    const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied report to clipboard" });
  };

  const handleCSVReport = () => {
    if (filteredData.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Note No", "Invoice No", "Note Type", "Date", "Item", "Qty", "Booked Rate", "Current Rate", "Amount", "TCS", "Net Amount"];
    const rows = filteredData.map(n => [
      n.noteNo, n.invoiceNo, n.noteType, n.date, n.item, n.quantity, n.bookedRate, n.currentRate, n.amount, n.tcsAmount, n.netAmount
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Debit_Credit_Notes_Report_${Date.now()}.csv`;
    a.click();
    toast({ title: "CSV Export complete" });
  };

  const handlePrintReport = () => {
    if (filteredData.length === 0) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-4">
      <style>{`
        @page {
          margin: 12mm;
          size: A4 landscape;
        }
        @media print {
          html, body {
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          ${
            printNote
              ? `
               #rpt-print-root { display: none !important; }
               #row-print-root { display: block !important; width: 100%; }
              `
              : `
               #rpt-print-root { display: block !important; width: 100%; }
               #row-print-root { display: none !important; }
              `
          }
        }
      `}</style>

      {/* ===== PRINT AREA - MULTIPLE ROWS REPORT ===== */}
      <div id="rpt-print-root" style={{ display: "none" }}>
        <div style={{ padding: "10px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ borderBottom: "2px solid #1e40af", paddingBottom: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "52px", height: "52px", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", borderRadius: "8px" }}>BM</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase" }}>BuildRMC Enterprises</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>GSTIN: 36AAAAA1111A1Z1</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>Debit/Credit Note Register</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Printed: {new Date().toLocaleString("en-IN")}</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ background: "#1e40af", color: "white" }}>
                {["Note No", "Invoice No", "Note Type", "Date", "Grade / Item", "Qty", "Booked Rate", "Current Rate", "TCS", "Net Amount"].map((h) => (
                  <th key={h} style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: ["Qty", "Booked Rate", "Current Rate", "TCS", "Net Amount"].includes(h) ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((n) => (
                <tr key={n.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>{n.noteNo}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{n.invoiceNo}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontWeight: 700, color: n.noteType === "Debit Note" ? "#047857" : "#be123c" }}>{n.noteType}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{n.date}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{n.item}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{Number(n.quantity).toFixed(2)}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>₹{n.bookedRate}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>₹{n.currentRate}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>₹{n.tcsAmount}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700 }}>₹{Number(n.netAmount).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PRINT AREA - SINGLE ROW PORTRAIT VIEW ===== */}
      <div id="row-print-root" style={{ display: "none" }}>
        {printNote && (
          <div style={{ padding: "30px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
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
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>{printNote.noteType}</div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Note No: {printNote.noteNo}</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Date: {printNote.date}</div>
              </div>
            </div>

            <h2 style={{ fontSize: "13px", fontWeight: 850, textTransform: "uppercase", color: "#1e40af", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "14px" }}>Note Adjustment Sheet</h2>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "24px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, width: "30%", textAlign: "left" }}>Reference Invoice</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{printNote.invoiceNo}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Customer Name</th>
                  <td style={{ padding: "10px", fontWeight: 700 }}>{printNote.customerName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Grade / Item</th>
                  <td style={{ padding: "10px" }}>{printNote.item}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Quantity Adjusted</th>
                  <td style={{ padding: "10px" }}>{printNote.quantity.toFixed(2)} M³</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Booked Rate</th>
                  <td style={{ padding: "10px" }}>₹{printNote.bookedRate.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Adjusted Rate</th>
                  <td style={{ padding: "10px" }}>₹{printNote.currentRate.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Difference Amount</th>
                  <td style={{ padding: "10px" }}>₹{printNote.amount.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>TCS Amount (1%)</th>
                  <td style={{ padding: "10px" }}>₹{printNote.tcsAmount.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px", background: "#f1f5f9", fontWeight: 900, textAlign: "left" }}>Net Adjusted Amount</th>
                  <td style={{ padding: "10px", fontWeight: 900, fontSize: "15px", color: "#1e40af" }}>₹{printNote.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "40px", textTransform: "uppercase", fontSize: "9px", letterSpacing: "1px", textAlign: "center", color: "#94a3b8" }}>
              BuildRMC Enterprise Accounting System — Strictly Confidential
            </div>
          </div>
        )}
      </div>

      {/* ===== SCREEN VIEW HEADER ===== */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Debit/Credit Note List</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-gray-400">Billing</span>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Debit/Credit Note List</span>
          </nav>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#1e40af] hover:bg-blue-700 font-black text-xs gap-1 h-8 rounded-md">
          <Plus className="h-3.5 w-3.5" /> Create Note
        </Button>
      </div>

      {/* Filters Form Panel */}
      <div className="bg-white rounded-lg p-5 border border-slate-100 shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Debit/Credit Note No</Label>
            <Input
              placeholder="Enter note number"
              className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={noteNoFilter}
              onChange={(e) => setNoteNoFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Invoice No</Label>
            <Input
              placeholder="Enter reference invoice"
              className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={invoiceNoFilter}
              onChange={(e) => setInvoiceNoFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">From Date</Label>
            <Input
              type="date"
              className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">To Date</Label>
            <Input
              type="date"
              className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCurrentPage(1)} className="bg-emerald-500 hover:bg-emerald-600 font-black text-xs h-9 flex-1">
              Search
            </Button>
            <Button variant="outline" onClick={handleClear} className="bg-rose-500 hover:bg-rose-600 border-none text-white font-black text-xs h-9 flex-1 gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table card */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden no-print">
        {/* Actions bar */}
        <div className="flex items-center justify-between p-3.5 border-b bg-slate-50/40">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setCurrentPage(1); }}>
              <SelectTrigger className="w-16 h-8 text-xs bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search note registers..."
                className="w-48 h-8 text-xs bg-white border-gray-200 pl-3 pr-8 placeholder:text-gray-400"
                value={globalSearch}
                onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex gap-1">
              <Button onClick={handleCopyReport} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 bg-gray-100 hover:bg-gray-250 text-slate-700">
                <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy
              </Button>
              <Button onClick={handleCSVReport} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 bg-gray-100 hover:bg-gray-250 text-slate-700">
                <Download className="h-3.5 w-3.5 text-emerald-600" /> CSV
              </Button>
              <Button onClick={handlePrintReport} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 bg-gray-100 hover:bg-gray-250 text-slate-700">
                <Printer className="h-3.5 w-3.5 text-blue-600" /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Notes list table */}
        <div className="overflow-x-auto">
          {totalRows === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <FileBarChart className="h-16 w-16 mb-2 opacity-30" />
              <p className="text-sm font-black text-slate-400">No debit/credit notes available in register</p>
              <p className="text-[11px] text-slate-400 mt-1">Click the "Create Note" button to add a note adjustment sheet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-3 text-slate-800 font-black text-[10px] uppercase text-center">Note No</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-center">Invoice No</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-center">Invoice Type</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-center">Note Type</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-center">Date</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-center bg-cyan-50/50">Item Grade</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-right bg-cyan-50/50">Quantity (M³)</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-right bg-cyan-50/50">Booked Rate</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-right bg-cyan-50/50">Current Rate</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-right bg-cyan-50/50">Amount</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-right">TCS Amount</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-right">Net Amount</TableHead>
                  <TableHead className="text-slate-800 font-black text-[10px] uppercase text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((n) => (
                  <TableRow key={n.id} className="hover:bg-slate-50/50 border-b transition-colors">
                    <td className="py-2.5 text-center text-xs font-extrabold text-[#1e40af]">{n.noteNo}</td>
                    <td className="py-2.5 text-center text-xs font-bold text-slate-600">{n.invoiceNo}</td>
                    <td className="py-2.5 text-center text-[11px] font-semibold text-slate-500">{n.invoiceType}</td>
                    <td className="py-2.5 text-center text-xs font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.noteType === "Debit Note" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                        {n.noteType}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-xs font-semibold text-slate-600">{n.date}</td>
                    <td className="py-2.5 text-center text-xs font-extrabold text-slate-700 bg-cyan-50/20">{n.item}</td>
                    <td className="py-2.5 text-right text-xs font-bold text-slate-600 bg-cyan-50/20">{n.quantity.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-xs font-semibold text-slate-600 bg-cyan-50/20">₹{n.bookedRate.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-xs font-semibold text-slate-600 bg-cyan-50/20">₹{n.currentRate.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-xs font-bold text-slate-700 bg-cyan-50/20">₹{n.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 text-right text-xs font-semibold text-slate-600">₹{n.tcsAmount.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-xs font-extrabold text-[#1e40af]">₹{n.netAmount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Print (Printer Icon) */}
                        <Button 
                          onClick={() => handleRowPrint(n)}
                          title="Print Note" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* 2. CSV (Download/FileText Icon -> Download Icon) */}
                        <Button 
                          onClick={() => handleRowCSV(n)}
                          title="Download CSV" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {/* 3. Copy (Copy Icon) */}
                        <Button 
                          onClick={() => handleRowCopy(n)}
                          title="Copy Note" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        {/* 4. Edit (Pencil Icon) - opens view details modal */}
                        <Button 
                          onClick={() => setViewNote(n)}
                          title="View Details" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* 5. Delete (Trash Icon) */}
                        <Button 
                          onClick={() => setDeleteId(n.id)}
                          title="Delete Note" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-rose-50 text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination indicators */}
        {totalRows > 0 && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border-t border-gray-100">
            <div className="text-xs text-slate-500 font-semibold">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRows)} of {totalRows} entries
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the note adjustment sheet record from database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold text-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-500 hover:bg-rose-600 font-bold text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Note details Dialog */}
      <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-5 border-b bg-[#1e40af] rounded-t-lg flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-white font-black text-base">Note Adjustment Sheet</DialogTitle>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">{viewNote?.noteNo} ({viewNote?.noteType})</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleRowCopy(viewNote!)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRowCSV(viewNote!)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <FileText className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRowPrint(viewNote!)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setViewNote(null)} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {viewNote && (
            <div className="p-6 space-y-5">
              {/* Logo head */}
              <div className="flex items-center gap-4 border-b pb-5">
                <div className="w-14 h-14 bg-[#1e40af] text-white flex items-center justify-center font-black text-xl rounded-xl">BM</div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">BuildRMC Enterprises</h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</p>
                  <p className="text-xs text-slate-600">GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</p>
                </div>
              </div>

              <h2 className="text-base font-extrabold uppercase text-[#1e40af] tracking-wide border-b pb-2">Note Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Adjustment Note No</p>
                  <p className="text-sm font-black text-slate-800">{viewNote.noteNo}</p>
                </div>
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Reference Invoice No</p>
                  <p className="text-sm font-black text-[#1e40af]">{viewNote.invoiceNo}</p>
                </div>
              </div>

              <div className="border rounded-xl p-4 space-y-2.5">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Note Type</p>
                  <p className={`text-sm font-black ${viewNote.noteType === "Debit Note" ? "text-emerald-600" : "text-rose-600"}`}>{viewNote.noteType}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-xs font-bold text-slate-800">{viewNote.customerName}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Adjustment Date</p>
                  <p className="text-xs font-semibold text-slate-700">{viewNote.date}</p>
                </div>
              </div>

              {/* Adjustment rate sheets breakdown */}
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2.5 font-black text-slate-600 uppercase border-r border-slate-200">Item Grade</th>
                    <th className="p-2.5 font-black text-slate-600 uppercase border-r border-slate-200 text-right">Qty (M³)</th>
                    <th className="p-2.5 font-black text-slate-600 uppercase border-r border-slate-200 text-right">Booked Rate</th>
                    <th className="p-2.5 font-black text-slate-600 uppercase border-r border-slate-200 text-right">Current Rate</th>
                    <th className="p-2.5 font-black text-slate-600 uppercase text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 font-extrabold text-slate-800 border-r border-slate-200">{viewNote.item}</td>
                    <td className="p-3 font-semibold text-right border-r border-slate-200">{viewNote.quantity.toFixed(2)}</td>
                    <td className="p-3 font-semibold text-right border-r border-slate-200">₹{viewNote.bookedRate.toFixed(2)}</td>
                    <td className="p-3 font-semibold text-right border-r border-slate-200">₹{viewNote.currentRate.toFixed(2)}</td>
                    <td className="p-3 font-black text-right text-[#1e40af]">₹{viewNote.netAmount.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Note Dialog Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 border-b bg-[#1e40af] rounded-t-lg flex flex-row items-center justify-between no-print">
            <DialogTitle className="text-white font-black text-base flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-yellow-300 fill-yellow-300" /> Create Adjustment Note
            </DialogTitle>
            <Button size="sm" variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-white hover:bg-white/10 h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleSaveNote} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Adjustment Note Type</Label>
                <Select
                  value={formNoteType}
                  onValueChange={(val: any) => {
                    setFormNoteType(val);
                    triggerAutoNoteNo(val);
                  }}
                >
                  <SelectTrigger className="bg-gray-50 h-9 text-xs border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Debit Note">Debit Note (Increase Rate)</SelectItem>
                    <SelectItem value="Credit Note">Credit Note (Decrease Rate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Select Reference Invoice <span className="text-rose-500">*</span></Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId} required>
                  <SelectTrigger className="bg-gray-50 h-9 text-xs border-gray-200">
                    <SelectValue placeholder="Choose live invoice" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {invoices?.map((inv) => (
                      <SelectItem key={inv.id} value={String(inv.id)}>
                        {inv.invoiceNumber} ({inv.customerName})
                      </SelectItem>
                    ))}
                    {!invoices?.length && <SelectItem value="none" disabled>No Invoices Available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Note Number</Label>
                <div className="flex gap-1">
                  <Input
                    required
                    placeholder="Auto-generated"
                    className="bg-gray-50 h-9 text-xs border-gray-200"
                    value={formNoteNo}
                    onChange={(e) => setFormNoteNo(e.target.value)}
                  />
                  <Button type="button" onClick={() => triggerAutoNoteNo(formNoteType)} className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs">
                    Auto
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Adjustment Date</Label>
                <Input
                  type="date"
                  required
                  className="bg-gray-50 h-9 text-xs border-gray-200"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t pt-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Item Grade</Label>
                <Input
                  className="bg-gray-100 h-9 text-xs border-gray-200 font-extrabold text-slate-800"
                  value={formItem}
                  disabled
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Qty (M³)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="bg-gray-50 h-9 text-xs border-gray-200"
                  value={formQuantity || ""}
                  onChange={(e) => setFormQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Booked Rate (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="bg-gray-100 h-9 text-xs border-gray-200 font-bold"
                  value={formBookedRate || ""}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Adjusted Rate (₹) <span className="text-cyan-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter current rate"
                  className="bg-gray-50 h-9 text-xs border-cyan-100 focus-visible:ring-cyan-400 font-bold"
                  value={formCurrentRate || ""}
                  onChange={(e) => setFormCurrentRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">TCS Amount (1%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="TCS adjust"
                  className="bg-gray-50 h-9 text-xs border-gray-200"
                  value={formTcsAmount || ""}
                  onChange={(e) => setFormTcsAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-dashed flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-500">Difference Amount: </span>
                <span className="font-extrabold text-slate-700">₹{formComputedTotals.amt.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-500">Net Adjusted Amount: </span>
                <span className="font-black text-[#1e40af] text-sm">₹{formComputedTotals.net.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 text-xs font-bold text-slate-600">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1e40af] hover:bg-blue-700 text-white font-black text-xs h-9 px-6">
                Register Adjustment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
