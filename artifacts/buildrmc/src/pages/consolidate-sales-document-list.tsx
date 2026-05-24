import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetInvoices, useGetCustomers, useDeleteInvoice, getGetInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";

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
import { ChevronRight, Search, RotateCcw, Files, Printer, Download, Copy, Trash2, Pencil } from "lucide-react";

export default function ConsolidateSalesDocumentList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: invoices, isLoading } = useGetInvoices();
  const { data: customers } = useGetCustomers();
  const deleteInvoice = useDeleteInvoice();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [consolidateId, setConsolidateId] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewInv, setViewInv] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Reset viewInv after printing
  useEffect(() => {
    const handleAfterPrint = () => setViewInv(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setConsolidateId("");
    setCustomerFilter("all");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    let data = invoices || [];
    if (fromDate) {
      data = data.filter(i => i.invoiceDate && new Date(i.invoiceDate) >= new Date(fromDate));
    }
    if (toDate) {
      data = data.filter(i => i.invoiceDate && new Date(i.invoiceDate) <= new Date(toDate));
    }
    if (consolidateId) {
      data = data.filter(i => i.invoiceNumber.toLowerCase().includes(consolidateId.toLowerCase()));
    }
    if (customerFilter !== "all") {
      data = data.filter(i => String(i.customerId) === customerFilter);
    }
    return data;
  }, [invoices, fromDate, toDate, consolidateId, customerFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const currentData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopyRow = (inv: any) => {
    const text = `Invoice: ${inv.invoiceNumber}\nDate: ${inv.invoiceDate}\nCustomer: ${inv.customerName}\nPlant: ${inv.plant}\nAmount: ${inv.totalAmount}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleCSVRow = (inv: any) => {
    const rows = [
      ["Field", "Value"],
      ["Invoice ID", inv.invoiceNumber],
      ["Date", inv.invoiceDate],
      ["Customer", inv.customerName],
      ["Plant", inv.plant],
      ["Total Amount", inv.totalAmount]
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Invoice_${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const handleRowPrint = (inv: any) => {
    setViewInv(inv);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyReport = () => {
    const text = filteredData.map(inv => `${inv.invoiceNumber}\t${inv.customerName}\t${inv.invoiceDate}\t1\t${inv.plant}`).join("\n");
    navigator.clipboard.writeText(`Consolidate Invoice ID\tCustomer\tGenerate Date\tNo Of Invoice\tPlant Name\n${text}`);
    toast({ title: "Copied to clipboard" });
  };

  const handleCSVReport = () => {
    const rows = [["Consolidate Invoice ID", "Customer", "Generate Date", "No Of Invoice", "Plant Name"]];
    filteredData.forEach(inv => rows.push([inv.invoiceNumber, inv.customerName, inv.invoiceDate, "1", inv.plant || ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Consolidated_Invoices.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const handlePrintReport = () => {
    window.print();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteInvoice.mutateAsync({ id: deleteId });
      queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
      toast({ title: "Success", description: "Invoice deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <style>{`
        @page { margin: 12mm; size: A4 landscape; }
        @media print {
          html, body { margin: 0 !important; background: white; }
          .no-print { display: none !important; }
          .main-screen { display: none !important; }
          ${viewInv 
            ? `
               #print-root { display: block !important; width: 100%; }
               #global-print-root { display: none !important; }
              ` 
            : `
               #print-root { display: none !important; }
               #global-print-root { display: block !important; width: 100%; }
              `}
        }
        #print-root, #global-print-root { display: none; }
      `}</style>

      <div className="main-screen space-y-4">
      {/* Header with breadcrumbs */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Consolidate Sales Document List</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Sales Document</span>
          <ChevronRight className="h-3 w-3" />
          <span>Report</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Consolidate Sales Document List</span>
        </nav>
      </div>

      {/* Filters card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="fromDate" className="text-sm font-semibold">From Date <span className="text-cyan-500">*</span></Label>
            <Input
              id="fromDate"
              type="date"
              className="bg-gray-50 border-gray-200 h-10"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate" className="text-sm font-semibold">To Date <span className="text-cyan-500">*</span></Label>
            <Input
              id="toDate"
              type="date"
              className="bg-gray-50 border-gray-200 h-10"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consolidateId" className="text-sm font-semibold">Consolidate Invoice Id <span className="text-cyan-500">*</span></Label>
            <Input
              id="consolidateId"
              placeholder="Enter Invoice No.."
              className="bg-gray-50 border-gray-200 h-10"
              value={consolidateId}
              onChange={(e) => setConsolidateId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-sm font-semibold">Customer <span className="text-cyan-500">*</span></Label>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger id="customer" className="bg-gray-50 border-gray-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" className="bg-emerald-500 hover:bg-emerald-600 h-10 px-6 text-white font-medium flex-1">
              Search
            </Button>
            <Button type="button" className="bg-rose-500 hover:bg-rose-600 h-10 px-6 text-white font-medium flex-1" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
              <SelectTrigger className="w-20 h-9 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <ExportDropdown onCopy={handleCopyReport} onCSV={handleCSVReport} onPDF={handlePrintReport} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b border-gray-100">
                <TableHead className="text-gray-900 font-bold py-4 text-center">Consolidate Invoice ID</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Customer</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Generate Date</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">No Of Invoice</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Plant Name</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400 italic">Processing...</TableCell>
                </TableRow>
              ) : currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400 italic">No data available in table</TableCell>
                </TableRow>
              ) : (
                currentData.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50">
                    <TableCell className="text-center font-bold text-[#1e40af]">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-center text-slate-800">{inv.customerName}</TableCell>
                    <TableCell className="text-center text-slate-600">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell className="text-center text-slate-600">1</TableCell>
                    <TableCell className="text-center text-slate-600">{inv.plant || "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Print (Printer Icon) */}
                        <Button 
                          onClick={() => handleRowPrint(inv)}
                          title="Print PDF" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* 2. CSV (Download Icon) */}
                        <Button 
                          onClick={() => handleCSVRow(inv)}
                          title="Download CSV" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {/* 3. Copy (Copy Icon) */}
                        <Button 
                          onClick={() => handleCopyRow(inv)}
                          title="Copy Details" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        {/* 4. Edit (Pencil Icon) - opens viewInv details */}
                        <Button 
                          onClick={() => setViewInv(inv)}
                          title="Edit Document" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* 5. Delete (Trash Icon) */}
                        <Button 
                          onClick={() => setDeleteId(inv.id)}
                          title="Delete Document" 
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

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100 no-print">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-600" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="text-gray-600" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </div>
        </div>
        </div>
      </div>

      {/* ===== PRINT LAYOUT (MODAL) ===== */}
      <div id="print-root">
        {viewInv && (
          <div className="p-8 bg-white text-black">
            <PrintHeader />
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Consolidated Invoice Details</h2>
              <div className="text-right">
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded font-sans">CONSOLIDATED INVOICE</span>
              </div>
            </div>
            
            <table className="w-full text-left mb-6 border border-slate-200">
              <tbody>
                <tr className="border-b border-slate-200">
                  <th className="p-3 bg-slate-50 font-bold text-sm w-1/3">Invoice Number</th>
                  <td className="p-3 font-semibold text-sm">{viewInv.invoiceNumber}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="p-3 bg-slate-50 font-bold text-sm">Date</th>
                  <td className="p-3 text-sm">{viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="p-3 bg-slate-50 font-bold text-sm">Customer</th>
                  <td className="p-3 font-bold text-slate-800 text-sm">{viewInv.customerName}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="p-3 bg-slate-50 font-bold text-sm">Site</th>
                  <td className="p-3 text-sm">{viewInv.site || "—"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="p-3 bg-slate-50 font-bold text-sm">Plant Name</th>
                  <td className="p-3 text-sm">{viewInv.plant || "—"}</td>
                </tr>
                <tr>
                  <th className="p-3 bg-slate-50 font-bold text-sm">Net Amount</th>
                  <td className="p-3 font-black text-lg text-slate-900">₹{parseFloat(String(viewInv.totalAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-12 text-center text-sm text-slate-500 border-t pt-4">
              This is a computer generated document and requires no signature.
            </div>
          </div>
        )}
      </div>

      {/* ===== GLOBAL PRINT LAYOUT (LIST) ===== */}
      <div id="global-print-root">
        <div className="p-8 bg-white text-black">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Consolidate Sales Document List</h2>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-600">Printed Date: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-2 font-bold text-sm border-r border-slate-200">Consolidate Invoice ID</th>
                <th className="p-2 font-bold text-sm border-r border-slate-200">Customer</th>
                <th className="p-2 font-bold text-sm border-r border-slate-200">Generate Date</th>
                <th className="p-2 font-bold text-sm border-r border-slate-200 text-center">No Of Invoice</th>
                <th className="p-2 font-bold text-sm">Plant Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(inv => (
                <tr key={inv.id} className="border-b border-slate-200">
                  <td className="p-2 text-sm border-r border-slate-200 font-semibold">{inv.invoiceNumber}</td>
                  <td className="p-2 text-sm border-r border-slate-200">{inv.customerName}</td>
                  <td className="p-2 text-sm border-r border-slate-200">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-2 text-sm border-r border-slate-200 text-center">1</td>
                  <td className="p-2 text-sm">{inv.plant || "—"}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-slate-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="mt-8 text-center text-xs text-slate-500 border-t pt-4">
            This is a computer generated document and requires no signature.
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this invoice? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
