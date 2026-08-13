import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, ListPlus, Search, RotateCcw, Copy, Download, Trash2, Printer, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PaymentFollowUpList() {
  const { toast } = useToast();
  const [followups, setFollowups] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchId, setSearchId] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedFollowup, setSelectedFollowup] = useState<any | null>(null);

  const fetchFollowups = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/payment-follow-ups");
      if (!res.ok) throw new Error("Failed to fetch payment follow-ups");
      const data = await res.json();
      setFollowups(data);
      setFiltered(data);
    } catch (err: any) {
      toast({
        title: "Error loading follow-ups",
        description: err.message || "Failed to load database entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleSearch = () => {
    let result = followups;
    if (searchId) {
      result = result.filter(f => f.followupId?.toLowerCase().includes(searchId.toLowerCase()));
    }
    if (searchCustomer) {
      const q = searchCustomer.toLowerCase();
      result = result.filter(f => 
        f.customerName?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.status?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: `Found ${result.length} matching entries.` });
  };

  const handleClear = () => {
    setSearchId("");
    setSearchCustomer("");
    setFiltered(followups);
    setCurrentPage(1);
    toast({ title: "Filters Cleared", description: "Showing all records." });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this follow-up record?")) return;
    try {
      const res = await fetch(`/api/payment-follow-ups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      toast({ title: "Success", description: "Payment follow-up record deleted!" });
      fetchFollowups();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Exports
  const handleExportCopy = () => {
    const headers = ["FollowUp ID", "Customer Name", "Date & Time", "Next FollowUp", "Description", "Status", "Created By"];
    const rows = filtered.map(f => [
      f.followupId,
      f.customerName,
      `${f.followupDate} ${f.followupTime}`,
      f.nextDate ? `${f.nextDate} ${f.nextTime || ""}` : "N/A",
      f.description || "",
      f.status,
      f.createdBy || "Admin"
    ]);
    const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Follow-up records copied to clipboard." });
  };

  const handleExportCSV = () => {
    const headers = ["FollowUp ID", "Customer Name", "Date & Time", "Next FollowUp", "Description", "Status", "Created By"];
    const rows = filtered.map(f => [
      `"${f.followupId}"`,
      `"${f.customerName}"`,
      `"${f.followupDate} ${f.followupTime}"`,
      `"${f.nextDate ? `${f.nextDate} ${f.nextTime || ""}` : "N/A"}"`,
      `"${f.description || ""}"`,
      `"${f.status}"`,
      `"${f.createdBy || "Admin"}"`
    ]);
    const content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payment_followups_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: "Follow-up records CSV exported." });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handlePrintSingle = (f: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html>
        <head>
          <title>Payment Follow-Up - ${f.followupId}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #ea580c; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>Payment Follow-Up: ${f.followupId}</h1>
          <div class="field"><span class="label">Customer Name:</span> ${f.customerName}</div>
          <div class="field"><span class="label">Date:</span> ${f.followupDate} at ${f.followupTime}</div>
          <div class="field"><span class="label">Next FollowUp:</span> ${f.nextDate ? `${f.nextDate} ${f.nextTime || ""}` : "N/A"}</div>
          <div class="field"><span class="label">Description:</span> ${f.description || "N/A"}</div>
          <div class="field"><span class="label">Status:</span> ${f.status || "pending"}</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCopySingle = (f: any) => {
    const text = `Follow-Up ID: ${f.followupId}\nCustomer: ${f.customerName}\nDate: ${f.followupDate} ${f.followupTime}\nNext Date: ${f.nextDate || "N/A"}\nDescription: ${f.description || "N/A"}\nStatus: ${f.status || "pending"}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Follow-up details copied to clipboard." });
  };

  const handleExportSingleCSV = (f: any) => {
    const headers = ["FollowUp ID", "Customer Name", "Date & Time", "Next FollowUp", "Description", "Status"];
    const row = [f.followupId, f.customerName, `${f.followupDate} ${f.followupTime}`, f.nextDate || "N/A", f.description || "", f.status || "pending"];
    const content = `${headers.join(",")}\n${row.map(v => `"${v}"`).join(",")}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `followup_${f.followupId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: "Follow-up record CSV exported." });
  };

  return (
    <div className="flex-1 flex flex-col space-y-3 min-w-0 print:p-0">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Payment FollowUp List</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/sales" className="hover:text-[#ea580c] transition-colors">Sales</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#ea580c]">Payment FollowUp List</span>
          </nav>
        </div>
        <Link href="/sales/payment-follow-up/new">
          <Button className="h-7 bg-[#ea580c] hover:bg-[#d97706] text-white font-bold uppercase text-[9px] tracking-wider px-3 gap-1.5 shadow-none border-0 rounded cursor-pointer">
            <ListPlus className="h-3.5 w-3.5" /> Add Payment FollowUp
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden p-4 print:border-none print:shadow-none">
        {/* Printable Header */}
        <div className="hidden print:block mb-6">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase">Payment Follow-Up Report</h2>
            <p className="text-xs text-gray-500 font-semibold">Generated: {new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 items-end print:hidden bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FollowUp ID</Label>
            <Input 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter FollowUp ID" 
              className="bg-white h-8 text-xs border-gray-200" 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Parameters</Label>
            <Input 
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder="Customer Name / Status / Description" 
              className="bg-white h-8 text-xs border-gray-200" 
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} size="sm" className="bg-[#ea580c] hover:bg-[#ea580c] text-white font-bold h-8 flex-1 gap-1.5 uppercase text-[10px] tracking-wide">
              <Search className="h-3 w-3" /> Search
            </Button>
            <Button onClick={handleClear} size="sm" variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-100 font-bold h-8 flex-1 gap-1.5 uppercase text-[10px] tracking-wide">
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-16 h-7 text-[11px] bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <ExportDropdown onCopy={handleExportCopy} onCSV={handleExportCSV} onPDF={handlePrintPDF} />
        </div>

        {/* Table Data */}
        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm print:border-none print:shadow-none print:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[#ea580c] border-b border-white/10">
              <TableRow className="hover:bg-transparent border-0 bg-[#ea580c]">
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">FollowUp ID</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Customer Name</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">FollowUp Date & Time</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Next FollowUp Date</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Description</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Created By</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Status</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] uppercase tracking-tighter text-center print:hidden">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400 font-medium animate-pulse">
                    Loading payment follow ups...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    No payment follow up records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((f) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/50 transition-colors border-b">
                    <TableCell className="text-center py-2.5 font-bold text-[#ea580c] text-xs">
                      {f.followupId}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs">
                      {f.customerName}
                      {f.customerBalance && <div className="text-[10px] text-rose-500 font-bold mt-0.5">Bal: {f.customerBalance}</div>}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {f.followupDate} at {f.followupTime}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {f.nextDate ? `${f.nextDate} ${f.nextTime || ""}` : "N/A"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                      {f.description || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 text-center font-medium">
                      {f.createdBy || "Admin"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        f.status?.toLowerCase() === "success" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : f.status?.toLowerCase() === "closed"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-orange-50/40 text-[#ea580c] border-orange-100/50"
                      }`}>
                        {f.status || "pending"}
                      </span>
                    </TableCell>
                     <TableCell className="text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Print (Printer Icon) */}
                        <Button 
                          onClick={() => handlePrintSingle(f)}
                          title="Print PDF" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* 2. CSV (Download Icon) */}
                        <Button 
                          onClick={() => handleExportSingleCSV(f)}
                          title="Download CSV" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {/* 3. Copy (Copy Icon) */}
                        <Button 
                          onClick={() => handleCopySingle(f)}
                          title="Copy Details" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-orange-50/40 text-[#ea580c] hover:text-[#ea580c] cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        {/* 4. Edit (Pencil Icon) - opens followup detail modal */}
                        <Button 
                          onClick={() => setSelectedFollowup(f)}
                          title="Edit FollowUp" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-orange-50/40 text-[#ea580c] hover:text-[#ea580c] cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* 5. Delete (Trash Icon) */}
                        <Button 
                          onClick={() => handleDelete(f.id)}
                          title="Delete Entry" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-rose-50 text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 print:hidden">
          <div className="text-xs text-gray-500 font-medium">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs font-bold uppercase text-slate-500 border-slate-200" 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs font-bold uppercase text-slate-500 border-slate-200" 
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* FollowUp Detail Dialog Modal */}
      <Dialog open={!!selectedFollowup} onOpenChange={(open) => !open && setSelectedFollowup(null)}>
        <DialogContent className="max-w-md bg-white border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-lg border-b border-slate-100 pb-2 uppercase tracking-wide">
              Follow-Up Details - {selectedFollowup?.followupId}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Customer Name:</span>
                <div className="font-extrabold text-slate-800 text-sm">{selectedFollowup?.customerName}</div>
              </div>

              <div className="border-t border-slate-200/60 my-2 pt-2 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">FollowUp Date & Time:</span>
                  <div className="font-bold text-[#ea580c]">{selectedFollowup?.followupDate} at {selectedFollowup?.followupTime}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Next FollowUp Date:</span>
                  <div className="font-bold text-orange-600">{selectedFollowup?.nextDate ? `${selectedFollowup?.nextDate} ${selectedFollowup?.nextTime || ""}` : "N/A"}</div>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Status:</span>
                  <div className="font-bold text-emerald-600 mt-0.5">{selectedFollowup?.status}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Created By:</span>
                  <div className="font-bold text-slate-600 mt-0.5">{selectedFollowup?.createdBy || "Admin"}</div>
                </div>
              </div>

              {selectedFollowup?.customerBalance && (
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Outstanding Balance:</span>
                  <div className="font-extrabold text-red-600 text-sm">{selectedFollowup.customerBalance}</div>
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Follow-Up Description:</span>
              <div className="bg-orange-50/40/30 p-3 rounded-lg border border-blue-50 text-slate-700 text-xs leading-relaxed font-medium">
                {selectedFollowup?.description || "No description / notes entered."}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
