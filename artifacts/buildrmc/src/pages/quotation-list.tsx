import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  RotateCcw,
  Plus,
  Copy,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Filter,
} from "lucide-react";
import { useGetQuotations, useDeleteQuotation, useGetEmployees } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, parseISO, parse, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function QuotationList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(true);

  // Input States
  const [quoteFilter, setQuoteFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");

  // Applied Search States
  const [appliedQuoteFilter, setAppliedQuoteFilter] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [appliedSalesPersonFilter, setAppliedSalesPersonFilter] = useState("all");

  // Selected Quotation state specifically for Single Proposal Printing
  const [printQuotation, setPrintQuotation] = useState<any | null>(null);

  const { data: quotations, isLoading } = useGetQuotations();
  const { data: employees } = useGetEmployees();

  const marketingStaff = useMemo(() => {
    if (!employees) return [];
    return (employees as any[]).map(e => e.name || e.fullName).filter(Boolean);
  }, [employees]);

  const filteredQuotes = useMemo(() => {
    if (!Array.isArray(quotations)) return [];
    return quotations.filter((q: any) => {
      const matchesNo = q.quotationNo.toLowerCase().includes(appliedQuoteFilter.toLowerCase()) ||
                        q.customerName.toLowerCase().includes(appliedQuoteFilter.toLowerCase());
      const matchesSales = appliedSalesPersonFilter === "all" || q.marketingPerson === appliedSalesPersonFilter;
      
      let matchesDate = true;
      if (appliedFromDate && appliedToDate) {
        try {
          const qDate = parse(q.date, 'dd/MM/yyyy', new Date());
          matchesDate = isWithinInterval(qDate, {
            start: parseISO(appliedFromDate),
            end: parseISO(appliedToDate)
          });
        } catch (e) { matchesDate = true; }
      }
      
      return matchesNo && matchesSales && matchesDate;
    });
  }, [quotations, appliedQuoteFilter, appliedFromDate, appliedToDate, appliedSalesPersonFilter]);

  // Hook up deleteQuotation mutation to live Atlas DB
  const { mutate: deleteQuotation } = (useDeleteQuotation as any)({
    mutation: {
      onSuccess: () => {
        toast({ title: "Quotation Deleted! 🗑️", description: "The customer quotation has been permanently removed." });
        queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      },
      onError: (err: any) => {
        toast({ title: "Deletion Failed", description: err.message || "Failed to remove quotation from MongoDB.", variant: "destructive" });
      }
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this Quotation? This action cannot be undone.")) {
      deleteQuotation(id);
    }
  };

  const handleSearch = () => {
    setAppliedQuoteFilter(quoteFilter);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedSalesPersonFilter(salesPersonFilter);
    toast({ title: "Filters Applied 🔍", description: "Matching quotations loaded successfully." });
  };

  const handleClear = () => {
    setQuoteFilter("");
    setFromDate("");
    setToDate("");
    setSalesPersonFilter("all");
    
    setAppliedQuoteFilter("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setAppliedSalesPersonFilter("all");
    toast({ title: "Filters Cleared 🧹", description: "Showing all records." });
  };

  // Copy full register
  const handleCopy = () => {
    if (!filteredQuotes.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Quotation No", "Date", "Customer", "Phone", "Site Address", "Sales Person", "Tax Inc?"];
    const rows = filteredQuotes.map((q: any) => [
      q.quotationNo,
      q.date,
      q.customerName,
      q.customerPhone,
      q.siteAddress,
      q.marketingPerson,
      q.rateIncludeTax ? "Yes" : "No"
    ]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard 📋", description: "Table data has been copied to your clipboard." });
  };

  const handleCopySingle = (q: any) => {
    const text = `Quotation No: ${q.quotationNo}\nDate: ${q.date}\nCustomer: ${q.customerName}\nPhone: ${q.customerPhone}\nAddress: ${q.siteAddress}\nSales Person: ${q.marketingPerson}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Details Copied 📋", description: "This quotation's details have been copied." });
  };

  // Export full list to CSV
  const handleExportCSV = () => {
    if (!filteredQuotes.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Quotation No", "Date", "Customer", "Phone", "Site Address", "Sales Person", "Tax Inc?"];
    const rows = filteredQuotes.map((q: any) => [
      `"${q.quotationNo}"`,
      `"${q.date}"`,
      `"${q.customerName}"`,
      `"${q.customerPhone}"`,
      `"${q.siteAddress}"`,
      `"${q.marketingPerson}"`,
      `"${q.rateIncludeTax ? "Yes" : "No"}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quotations_export_${format(new Date(), "dd_MM_yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful 📊", description: "Quotation list has been downloaded as CSV." });
  };

  const handleExportCSVSingle = (q: any) => {
    const headers = ["Quotation No", "Date", "Customer", "Grade", "Quantity", "Rate", "Cement Type"];
    const rows = q.items?.map((item: any) => [
      `"${q.quotationNo}"`,
      `"${q.date}"`,
      `"${q.customerName}"`,
      `"${item.grade}"`,
      `"${item.quantity}"`,
      `"${item.rate}"`,
      `"${item.cementType || "OPC"}"`
    ]) || [];
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quotation_${q.quotationNo.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded 📊", description: `Quotation spreadsheet generated.` });
  };

  const handlePrintPDF = () => {
    if (!filteredQuotes.length) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    setPrintQuotation(null); // Print master listing
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (q: any) => {
    setPrintQuotation(q);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white";
  const headerStyle = "bg-[#ea580c] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  return (
    <div className="space-y-4">
      {/* CSS Stylesheet wrapper inside JSX for full Print Layout Control */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-sheet, .print-sheet * {
            visibility: visible;
          }
          .print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Screen Path Header */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Quotation Management</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/customer-po" className="hover:text-[#ea580c] transition-colors">Customer & PO</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#ea580c]">Quotation List</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <Link href="/customer-po/quotation/new">
            <Button size="sm" className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add Quotation
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border flex items-center gap-1.5 cursor-pointer ${
              showFilters ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3 w-3" /> Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg border border-gray-100 shadow-sm no-print">
        {/* Search & Filter Section */}
        {showFilters && (
        <div className="p-3 border-b bg-white shrink-0 no-print">

        {/* Robust Flexbox Layout with Wrapped Spans to eliminate clipping / alignment errors */}
        <div className="flex flex-wrap gap-3 items-end">
          
          <div className="flex-1 min-w-[200px]">
            <Label className={labelStyle}>Quotation / Customer</Label>
            <Input 
              placeholder="Search Quotation No / Client Name..." 
              className={inputStyle} 
              value={quoteFilter}
              onChange={(e) => setQuoteFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="w-36">
            <Label className={labelStyle}>From Date</Label>
            <Input 
              type="date" 
              className={inputStyle} 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="w-36">
            <Label className={labelStyle}>To Date</Label>
            <Input 
              type="date" 
              className={inputStyle} 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="w-44">
            <Label className={labelStyle}>Marketing Person</Label>
            <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
              <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">All Sales Person</SelectItem>
                {marketingStaff.map((staffName: string) => (
                  <SelectItem key={staffName} value={staffName} className="text-[10px] font-bold">
                    {staffName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Symmetrical Action Buttons - Never Clipped, Never Misaligned */}
          <div className="flex gap-1.5 h-7">
            <Button 
              type="button"
              onClick={handleSearch}
              className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
            >
              <Search className="h-3 w-3" /> Search
            </Button>
            <Button 
              type="button"
              className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
              onClick={handleClear}
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* Table Toolbar */}
      <div className="px-3 py-2 flex items-center justify-between bg-slate-50/50 border-b shrink-0 no-print">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-500 uppercase">Show</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-14 h-6 bg-white border-gray-200 text-[10px] font-bold"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span className="text-[9px] font-black text-gray-500 uppercase">entries</span>
        </div>
        <ExportDropdown
          onCopy={handleCopy}
          onCSV={handleExportCSV}
          onPDF={handlePrintPDF}
        />
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-100 no-print">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Customer Quotations from Atlas...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className="border-0 hover:bg-slate-100">
                <TableHead className={headerStyle}>Quotation NO</TableHead>
                <TableHead className={headerStyle}>Date</TableHead>
                <TableHead className={`${headerStyle} text-left`}>Customer</TableHead>
                <TableHead className={headerStyle}>Phone</TableHead>
                <TableHead className={`${headerStyle} text-left`}>Site Address</TableHead>
                <TableHead className={`${headerStyle} text-left`}>Email</TableHead>
                <TableHead className={headerStyle}>Sales Person</TableHead>
                <TableHead className={headerStyle}>Tax Inc?</TableHead>
                <TableHead className={headerStyle}>Added By</TableHead>
                <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-[10px] text-gray-400 font-bold italic uppercase">
                    No quotations registered in MongoDB Database.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((q: any) => (
                  <TableRow key={q.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                    <TableCell className="text-center text-[10px] font-black text-[#ea580c] py-2">{q.quotationNo}</TableCell>
                    <TableCell className="text-center text-[10px] font-semibold">{q.date}</TableCell>
                    <TableCell className="text-left text-[10px] font-bold text-gray-800">{q.customerName}</TableCell>
                    <TableCell className="text-center text-[10px] font-semibold">{q.customerPhone}</TableCell>
                    <TableCell className="text-left text-[10px] text-gray-600 font-semibold max-w-[150px] truncate" title={q.siteAddress}>{q.siteAddress}</TableCell>
                    <TableCell className="text-left text-[10px] text-gray-500">{q.customerEmail || "--"}</TableCell>
                    <TableCell className="text-center text-[10px] font-bold text-indigo-600">{q.marketingPerson}</TableCell>
                    <TableCell className="text-center text-[10px] font-black uppercase text-gray-400">{q.rateIncludeTax ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-center text-[10px] text-gray-400">{q.createdBy || "Admin"}</TableCell>
                    
                    {/* Direct action buttons - 100% bug-free, ultra-premium colored buttons */}
                    <TableCell className="text-center py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        
                        <Button 
                          onClick={() => handlePrintSingle(q)}
                          title="Print PDF Proposal" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-indigo-50 text-indigo-600 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>

                        <Button 
                          onClick={() => handleExportCSVSingle(q)}
                          title="Export CSV" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </Button>

                        <Button 
                          onClick={() => handleCopySingle(q)}
                          title="Copy Details" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-orange-50/40 text-[#ea580c] cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <Button 
                          onClick={() => handleDelete(q.id)}
                          title="Delete Quotation" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="px-3 py-2 border-t bg-white flex items-center justify-between shrink-0 no-print">
        <div className="text-[9px] font-black text-gray-500 uppercase">Showing {filteredQuotes.length > 0 ? 1 : 0} to {filteredQuotes.length} of {filteredQuotes.length} entries</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-400" disabled><ChevronLeft className="h-3 w-3" /></Button>
          <div className="h-6 px-2 flex items-center justify-center bg-[#ea580c] text-white text-[9px] font-black rounded">1</div>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-400" disabled><ChevronRight className="h-3 w-3" /></Button>
        </div>
      </div>

      </div>

      {/* DUAL RENDER PRINTS */}

      {/* Print Option A: Branded Commercial Proposal & Quotation */}
      {printQuotation && (
        <div className="print-sheet hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#ea580c]">Proposal / Quotation Reference Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded font-sans">PROPOSAL / QUOTATION</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Quotation Reference</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Proposal Number: <span className="font-black text-gray-900 text-sm">{printQuotation.quotationNo}</span></p>
                <p className="text-xs font-bold text-gray-700">Issue Date: <span className="font-medium text-gray-900">{printQuotation.date}</span></p>
                <p className="text-xs font-bold text-gray-700">Valid Till: <span className="font-medium text-gray-900">30 days from date of issue</span></p>
                <p className="text-xs font-bold text-gray-700">Sales Person: <span className="font-bold text-indigo-700">{printQuotation.marketingPerson}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Customer Recipient</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Client Name: <span className="font-black text-gray-900">{printQuotation.customerName}</span></p>
                <p className="text-xs font-bold text-gray-700">Phone: <span className="font-medium text-gray-900">{printQuotation.customerPhone}</span></p>
                <p className="text-xs font-bold text-gray-700">Site Location: <span className="font-medium text-gray-900">{printQuotation.siteAddress}</span></p>
                <p className="text-xs font-bold text-gray-700">GSTIN No: <span className="font-medium text-gray-900 uppercase">{printQuotation.customerGstin || "N/A"}</span></p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-4 font-medium">Dear Sir/Madam,<br />We are pleased to submit our commercial proposal with pre-approved price tariffs for your ready-mix concrete requirements at the specified site delivery address:</p>

          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-[#ea580c] text-white text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2 text-center w-16">S/No</th>
                <th className="border p-2">Grade / Concrete Type</th>
                <th className="border p-2 text-center w-28">Quantity (m³)</th>
                <th className="border p-2 text-right w-32">Unit Rate (₹)</th>
                <th className="border p-2 text-right w-40">Total Value (₹)</th>
                <th className="border p-2 text-center w-28">Cement</th>
              </tr>
            </thead>
            <tbody>
              {printQuotation.items?.map((item: any, idx: number) => (
                <tr key={idx} className="text-xs">
                  <td className="border p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border p-2 font-black text-gray-800">{item.grade}</td>
                  <td className="border p-2 text-center font-medium">{item.quantity}</td>
                  <td className="border p-2 text-right font-semibold text-emerald-600">₹{(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border p-2 text-right font-black text-[#ea580c]">₹{(item.quantity * item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border p-2 text-center font-bold uppercase">{item.cementType || "OPC"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 p-4 rounded border text-xs">
              <h4 className="font-bold uppercase text-gray-700 mb-2">Delivery & Pump Charges</h4>
              <p className="text-gray-600 font-medium">Pump Hire Charges: <span className="font-bold text-gray-800">₹{printQuotation.pumpCharges || "0.00"}</span></p>
              <p className="text-gray-600 font-medium mt-1">Minimum Pump Quantity threshold: <span className="font-bold text-gray-800">{printQuotation.minPumpQty || "0"} m³</span></p>
              <p className="text-gray-600 font-medium mt-1">Payment Credit Terms window: <span className="font-bold text-gray-800 uppercase">{printQuotation.paymentTerms || "Immediate Cash / Credit"}</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded border text-right text-xs">
              <div className="flex justify-between py-1">
                <span className="font-bold text-gray-500">Tax Type:</span>
                <span className="font-semibold text-gray-800 uppercase">{printQuotation.rateIncludeTax ? "Inclusive of GST" : "Exclusive of GST"}</span>
              </div>
              <div className="flex justify-between py-1 border-t mt-2 pt-2 text-sm font-black text-gray-900">
                <span>Total Offer Sum:</span>
                <span className="text-lg text-[#ea580c]">₹{(printQuotation.items?.reduce((sum: number, it: any) => sum + (it.quantity * it.rate), 0) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {printQuotation.notes && printQuotation.notes.length > 0 && (
            <div className="border rounded p-4 mb-6">
              <h3 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-2 border-b pb-1">Terms, Notes & Site Pre-requisites</h3>
              <ul className="list-decimal pl-4 text-[11px] text-gray-600 space-y-1 font-medium">
                {printQuotation.notes.map((n: string, i: number) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center italic mt-12">Thank you for giving us an opportunity to bid for your concrete works. We look forward to a premium partnership.</p>

          <div className="flex justify-between items-end mt-16 text-xs">
            <div>
              <div className="h-px bg-gray-300 w-44 mb-2" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Client Acceptance Seal</p>
            </div>
            <div className="text-right">
              <div className="h-px bg-gray-300 w-44 mb-2 ml-auto" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Authorized Proposal Signatory</p>
              <p className="font-black text-[#ea580c] uppercase mt-1">Fortune Concrete</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Option B: Branded List Summary Sheet */}
      {!printQuotation && (
        <div className="print-sheet hidden print:block bg-white p-6 text-black w-full">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#ea580c]">OFFICIAL QUOTATION SUMMARY REGISTER</h2>
            <p className="text-[10px] font-bold text-gray-600">Printed Date: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>

          <table className="w-full border-collapse border text-[10px] text-left">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase text-gray-800">
                <th className="border p-2 text-center w-12">S/No</th>
                <th className="border p-2 text-center">Quotation No</th>
                <th className="border p-2 text-center">Issue Date</th>
                <th className="border p-2">Customer Name</th>
                <th className="border p-2 text-center">Contact Phone</th>
                <th className="border p-2">Site Address</th>
                <th className="border p-2 text-center">Sales Executive</th>
                <th className="border p-2 text-center">Tax Included</th>
                <th className="border p-2 text-right">Offer Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((q: any, idx: number) => {
                const totalValue = q.items?.reduce((sum: number, it: any) => sum + (it.quantity * it.rate), 0) || 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border p-2 text-center font-semibold">{idx + 1}</td>
                    <td className="border p-2 text-center font-bold text-indigo-700">{q.quotationNo}</td>
                    <td className="border p-2 text-center">{q.date}</td>
                    <td className="border p-2 font-bold">{q.customerName}</td>
                    <td className="border p-2 text-center">{q.customerPhone}</td>
                    <td className="border p-2 text-gray-600 max-w-[150px] truncate">{q.siteAddress}</td>
                    <td className="border p-2 text-center font-semibold">{q.marketingPerson}</td>
                    <td className="border p-2 text-center uppercase">{q.rateIncludeTax ? "Yes" : "No"}</td>
                    <td className="border p-2 text-right font-bold">₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
