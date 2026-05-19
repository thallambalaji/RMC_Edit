import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, ListPlus, Search, RotateCcw, Copy, Download, Trash2, Printer, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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

export default function EnquiryList() {
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchId, setSearchId] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/enquiries");
      if (!res.ok) throw new Error("Failed to fetch enquiries");
      const data = await res.json();
      setEnquiries(data);
      setFiltered(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load enquiries", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleSearch = () => {
    let result = enquiries;
    if (searchId) {
      result = result.filter(e => e.enquiryId?.toLowerCase().includes(searchId.toLowerCase()));
    }
    if (searchContact) {
      const q = searchContact.toLowerCase();
      result = result.filter(e => 
        e.contactPerson?.toLowerCase().includes(q) ||
        e.mobile?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.companyName?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: `Found ${result.length} matching entries.` });
  };

  const handleClear = () => {
    setSearchId("");
    setSearchContact("");
    setFiltered(enquiries);
    setCurrentPage(1);
    toast({ title: "Filters Cleared", description: "Showing all records." });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this sales enquiry?")) return;
    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete the record");
      toast({ title: "Success", description: "Enquiry successfully deleted!" });
      fetchEnquiries();
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
    const headers = ["Enquiry ID", "Name", "Date & Time", "Phone", "Email", "Address", "Company", "Requirements", "Status"];
    const rows = filtered.map(e => [
      e.enquiryId,
      e.contactPerson,
      e.enquiryDate || "",
      e.mobile,
      e.email || "",
      e.customerAddress,
      e.companyName || "",
      e.requirements?.length || 0,
      e.status
    ]);
    const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Enquiry records copied to clipboard." });
  };

  const handleExportCSV = () => {
    const headers = ["Enquiry ID", "Name", "Date & Time", "Phone", "Email", "Address", "Company", "Requirements", "Status"];
    const rows = filtered.map(e => [
      `"${e.enquiryId}"`,
      `"${e.contactPerson}"`,
      `"${e.enquiryDate || ""}"`,
      `"${e.mobile}"`,
      `"${e.email || ""}"`,
      `"${e.customerAddress}"`,
      `"${e.companyName || ""}"`,
      e.requirements?.length || 0,
      `"${e.status}"`
    ]);
    const content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sales_enquiries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: "Sales enquiries spreadsheet saved." });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handlePrintSingle = (e: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html>
        <head>
          <title>Enquiry Details - ${e.enquiryId}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>Enquiry details: ${e.enquiryId}</h1>
          <div class="field"><span class="label">Contact Person:</span> ${e.contactPerson}</div>
          <div class="field"><span class="label">Company Name:</span> ${e.companyName || "N/A"}</div>
          <div class="field"><span class="label">Mobile:</span> ${e.mobile}</div>
          <div class="field"><span class="label">Email:</span> ${e.email || "N/A"}</div>
          <div class="field"><span class="label">Address:</span> ${e.customerAddress}</div>
          <div class="field"><span class="label">Designation:</span> ${e.designation}</div>
          <div class="field"><span class="label">Status:</span> ${e.status || "pending"}</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCSVSingle = (e: any) => {
    const headers = ["Enquiry ID", "Name", "Phone", "Email", "Address", "Company", "Status"];
    const row = [e.enquiryId, e.contactPerson, e.mobile, e.email || "", e.customerAddress, e.companyName || "", e.status || "pending"];
    const content = [headers.join(","), row.map(val => `"${val}"`).join(",")].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `enquiry_${e.enquiryId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: `Enquiry ${e.enquiryId} CSV file generated.` });
  };

  const handleCopySingle = (e: any) => {
    const text = `Enquiry ID: ${e.enquiryId}\nName: ${e.contactPerson}\nPhone: ${e.mobile}\nEmail: ${e.email || ""}\nAddress: ${e.customerAddress}\nCompany: ${e.companyName || ""}\nStatus: ${e.status}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Enquiry details copied to clipboard." });
  };

  return (
    <div className="space-y-4 pb-4 print:p-0">
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 mb-4 print:hidden">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Enquiry List</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/sales" className="hover:text-[#1e40af] transition-colors">Sales</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Enquiry List</span>
          </nav>
        </div>
        <Link href="/sales/enquiry/new">
          <Button className="h-8 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold uppercase text-[10px] tracking-wider gap-1.5 shadow-md shadow-[#1e40af]/10">
            <ListPlus className="h-4 w-4" /> Add Enquiry
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 print:border-none print:shadow-none">
        {/* Printable Header (Only visible during print) */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Placeholder for Logo */}
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
              <h2 className="text-2xl font-bold text-[#1e40af] uppercase">Sales Enquiry Report</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Generated: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 items-end print:hidden bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enquiry ID</Label>
            <Input 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Enquiry ID" 
              className="bg-white h-8 text-xs border-gray-200" 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Name / Phone / Email</Label>
            <Input 
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              placeholder="Name / Phone / Email / Company" 
              className="bg-white h-8 text-xs border-gray-200" 
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} size="sm" className="bg-[#1e40af] hover:bg-blue-800 text-white font-bold h-8 flex-1 gap-1.5 uppercase text-[10px] tracking-wide">
              <Search className="h-3 w-3" /> Search
            </Button>
            <Button onClick={handleClear} size="sm" variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-100 font-bold h-8 flex-1 gap-1.5 uppercase text-[10px] tracking-wide">
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>

        {/* Toolbar */}
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
          <div className="flex gap-1.5">
            <Button onClick={handleExportCopy} variant="outline" size="sm" className="h-7 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase gap-1.5">
              <Copy className="h-3.5 w-3.5 text-blue-600" /> Copy
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="h-7 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase gap-1.5">
              <Download className="h-3.5 w-3.5 text-emerald-600" /> CSV
            </Button>
            <Button onClick={handlePrintPDF} variant="outline" size="sm" className="h-7 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase gap-1.5">
              <Printer className="h-3.5 w-3.5 text-rose-600" /> PDF
            </Button>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm print:border-none print:shadow-none print:overflow-visible">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase py-3 text-center">Enquiry ID</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase">Contact Name</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase">Date & Time</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase">Phone</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase">Designation</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase text-center">Requirements</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase text-center">Status</TableHead>
                <TableHead className="text-slate-800 font-bold text-[10px] uppercase text-center print:hidden">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400 font-medium">
                    Loading sales enquiries...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    No sales enquiries found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((enq) => (
                  <TableRow key={enq.id} className="hover:bg-slate-50/50 transition-colors border-b">
                    <TableCell className="text-center py-2.5 font-bold text-[#1e40af] text-xs">
                      {enq.enquiryId}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs">
                      {enq.contactPerson}
                      {enq.companyName && <div className="text-[10px] text-gray-400 font-normal">{enq.companyName}</div>}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {enq.enquiryDate || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">
                      {enq.mobile}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {enq.designation}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-bold bg-blue-50 text-[#1e40af] px-2 py-0.5 rounded-full border border-blue-100">
                        {enq.requirements?.length || 0} reqs
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                        {enq.status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Print (Printer Icon) */}
                        <Button 
                          onClick={() => handlePrintSingle(enq)}
                          title="Print PDF" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* 2. CSV (Download Icon) */}
                        <Button 
                          onClick={() => handleExportCSVSingle(enq)}
                          title="Download CSV" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {/* 3. Copy (Copy Icon) */}
                        <Button 
                          onClick={() => handleCopySingle(enq)}
                          title="Copy Details" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        {/* 4. Edit (Pencil Icon) - opens Enquiry detail modal to view/manage */}
                        <Button 
                          onClick={() => setSelectedEnquiry(enq)}
                          title="Edit Enquiry" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* 5. Delete (Trash Icon) */}
                        <Button 
                          onClick={() => handleDelete(enq.id)}
                          title="Delete Enquiry" 
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

        {/* Pagination controls */}
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

      {/* Enquiry Detail Dialog Modal */}
      <Dialog open={!!selectedEnquiry} onOpenChange={(open) => !open && setSelectedEnquiry(null)}>
        <DialogContent className="max-w-3xl bg-white border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">
              Sales Enquiry Details - {selectedEnquiry?.enquiryId}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Customer Details Block */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-2.5">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Contact Person / designation:</span>
                  <div className="font-bold text-slate-800 text-sm">{selectedEnquiry?.contactPerson} ({selectedEnquiry?.designation})</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Company / Business Name:</span>
                  <div className="font-semibold text-slate-700 text-xs">{selectedEnquiry?.companyName || "N/A"}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Customer Address:</span>
                  <div className="font-medium text-slate-600 text-xs">{selectedEnquiry?.customerAddress}</div>
                </div>
              </div>
              
              <div className="space-y-2.5 border-l border-slate-100 pl-4">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Mobile Number:</span>
                  <div className="font-bold text-slate-800 text-sm">{selectedEnquiry?.mobile}</div>
                </div>
                {selectedEnquiry?.altNumber && (
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Alternative Phone:</span>
                    <div className="font-medium text-slate-700 text-xs">{selectedEnquiry?.altNumber}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Email Address:</span>
                  <div className="font-medium text-slate-700 text-xs">{selectedEnquiry?.email || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 border-b pb-1">
                Project Requirements List ({selectedEnquiry?.requirements?.length || 0})
              </h4>
              <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-800">Project Name</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-800">Locality</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-800">Material</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-800 text-right">Quantity</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-800 text-right">Est. Rate</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-800 text-center">Stage of Construction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEnquiry?.requirements?.map((req: any, idx: number) => (
                      <TableRow key={idx} className="border-b last:border-0 hover:bg-slate-50/20">
                        <TableCell className="font-semibold text-slate-800 text-xs py-2">
                          {req.projectName}
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">{req.projectAddress}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-600 py-2">{req.locality}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-700 py-2">{req.materialType}</TableCell>
                        <TableCell className="text-right font-bold text-xs text-[#1e40af] py-2">{req.estimatedQty} {req.unit}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-slate-700 py-2">
                          {req.estimatedRate ? `₹${req.estimatedRate}` : "-"}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {req.constructionStage}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
