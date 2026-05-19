import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetDCs, useGetCustomers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Eye, Trash2, Copy, Download, ChevronLeft, Printer, Pencil, Home } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DCList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dcNo, setDcNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDC, setSelectedDC] = useState<any>(null);
  const [printDC, setPrintDC] = useState<any>(null);

  const { data: dcs, isLoading: dcsLoading } = useGetDCs();
  const { data: customers } = useGetCustomers();

  // Create mappings for fast lookup
  const customerMap = useMemo(() => {
    const map: Record<string, any> = {};
    customers?.forEach((c: any) => {
      map[String(c.id || c._id)] = c;
    });
    return map;
  }, [customers]);

  // Use ALL customers for the dropdown, not just those with DCs
  const availableCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.map((c: any) => ({
      id: String(c.id || c._id),
      name: c.name
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [customers]);

  // Combine sites from DCs and Customer addresses
  const availableSites = useMemo(() => {
    const siteSet = new Set<string>();
    dcs?.forEach((dc: any) => {
      if (dc.siteName) siteSet.add(dc.siteName);
    });
    customers?.forEach((c: any) => {
      if (c.address) siteSet.add(c.address);
    });
    return Array.from(siteSet).filter(Boolean).sort();
  }, [dcs, customers]);

  const handleClear = () => {
    setDcNo("");
    setFromDate("");
    setToDate("");
    setSelectedCustomer("all");
    setSelectedSite("all");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    if (!dcs) return [];
    let filtered = dcs.filter((dc: any) => {
      // DC Number filter
      if (dcNo && !dc.dcNumber?.toLowerCase().includes(dcNo.toLowerCase())) return false;

      // Date filter
      if (fromDate) {
        const from = new Date(fromDate);
        const dcDate = new Date(dc.dcDate);
        if (dcDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        const dcDate = new Date(dc.dcDate);
        if (dcDate > to) return false;
      }

      // Customer filter
      const dcCustomerId = String(dc.customerId?._id || dc.customerId);
      if (selectedCustomer !== "all" && dcCustomerId !== selectedCustomer) return false;

      // Site filter
      const siteName = dc.siteName || customerMap[dcCustomerId]?.address || "";
      if (selectedSite !== "all" && siteName !== selectedSite) return false;

      return true;
    });

    // Sort by newest first
    filtered.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return filtered;
  }, [dcs, dcNo, fromDate, toDate, selectedCustomer, selectedSite, customerMap]);

  const handleSearch = () => {
    if (!dcs) return;

    // Check if the DC Number entered actually exists in the whole DC list
    if (dcNo) {
      const exactMatchExists = dcs.some((dc: any) =>
        dc.dcNumber?.toLowerCase() === dcNo.toLowerCase()
      );
      const partialMatchExists = dcs.some((dc: any) =>
        dc.dcNumber?.toLowerCase().includes(dcNo.toLowerCase())
      );

      if (!exactMatchExists && !partialMatchExists) {
        toast({
          title: "Invalid DC Number",
          description: "Enter the correct DC no. No records found for the entered DC number.",
          variant: "destructive",
        });
        return; // Don't proceed to update page if completely invalid
      }
    }

    if (filteredData.length === 0) {
      toast({
        title: "No Records Found",
        description: "No Delivery Challans found for the selected filters.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Search Successful",
        description: `Found ${filteredData.length} records.`,
      });
    }

    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getExportData = () => {
    return filteredData.map((d: any) => ({
      dcNo: d.dcNumber || "-",
      customer: d.customerName || customerMap[String(d.customerId?._id || d.customerId)]?.name || "-",
      site: d.siteName || customerMap[String(d.customerId?._id || d.customerId)]?.address || "-",
      date: d.dcDate ? new Date(d.dcDate).toLocaleDateString("en-IN") : "-",
      time: d.dcTime || "-",
      grade: d.grade || "-",
      quantity: d.quantity || "0",
      rate: d.rate || "0",
      amount: d.netAmount || "0",
      vehicle: d.vehicleReg || "-",
      invoiceNo: d.invoiceNumber || "N/A",
      plant: d.plant || "-"
    }));
  };

  const handleCopy = () => {
    const data = getExportData();
    const headers = ["DC No", "Customer", "Site", "Date", "Quantity", "Vehicle"];
    const rows = data.map(d => [d.dcNo, d.customer, d.site, d.date, d.quantity, d.vehicle]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Data copied to clipboard successfully.",
    });
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const headers = ["DC No", "Customer", "Site", "Date", "Quantity", "Vehicle"];
    const rows = data.map(d => [
      `"${d.dcNo}"`, `"${d.customer}"`, `"${d.site}"`, `"${d.date}"`, `"${d.quantity}"`, `"${d.vehicle}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dc_list_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handlePrintSingleDC = (dc: any) => {
    setPrintDC(dc);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleEditDC = (dc: any) => {
    toast({
      title: "Edit restricted",
      description: `Delivery Challan ${dc.dcNumber} is marked as DELIVERED and locked in the ERP system. Please contact your administrator to modify closed invoices.`,
      variant: "destructive"
    });
  };

  const handleCopyRow = (dc: any) => {
    const custName = dc.customerName || customerMap[String(dc.customerId?._id || dc.customerId)]?.name || "-";
    const siteName = dc.siteName || customerMap[String(dc.customerId?._id || dc.customerId)]?.address || "-";
    const text = `DC No: ${dc.dcNumber}\nCustomer: ${custName}\nSite: ${siteName}\nDate: ${dc.dcDate ? new Date(dc.dcDate).toLocaleDateString("en-IN") : "-"}\nQuantity: ${dc.quantity}\nVehicle: ${dc.vehicleReg}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "DC Details copied to clipboard." });
  };

  const handleExportRowCSV = (dc: any) => {
    const custName = dc.customerName || customerMap[String(dc.customerId?._id || dc.customerId)]?.name || "-";
    const siteName = dc.siteName || customerMap[String(dc.customerId?._id || dc.customerId)]?.address || "-";
    const csvContent = `DC No,Customer,Site,Date,Quantity,Vehicle\n"${dc.dcNumber}","${custName}","${siteName}","${dc.dcDate ? new Date(dc.dcDate).toLocaleDateString("en-IN") : "-"}","${dc.quantity}","${dc.vehicleReg}"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dc_${dc.dcNumber?.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRowPDF = () => {
    setPrintDC(selectedDC);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this Delivery Challan?")) return;
    try {
      const res = await fetch(`/api/delivery-challans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete Delivery Challan");
      toast({ title: "Success", description: "Delivery Challan deleted successfully!" });
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Hide navigation and filters when printing */}
      <div className={`print:hidden space-y-4 ${printDC ? "print:hidden" : ""}`}>
        <div className="flex items-center justify-between bg-white py-3.5 px-5 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center">
            <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider select-none">
              Delivery Challan List
            </h2>
            <div className="h-4 w-px bg-slate-300 mx-4" />
            <nav className="text-[10px] text-slate-500 flex items-center uppercase font-bold tracking-widest select-none">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                <span>HOME</span>
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <Link href="/dc" className="hover:text-blue-600 transition-colors">
                DC
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <span className="text-blue-600 font-black">DC LIST</span>
            </nav>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-black text-slate-800 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 px-3 rounded shadow-xs"
              onClick={handleSearch}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-700"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">DC No</Label>
              <Input placeholder="Enter DC No" className="bg-gray-50 h-10 border-gray-200" value={dcNo} onChange={(e) => { setDcNo(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">From Date :</Label>
              <Input type="date" className="bg-gray-50 h-10 border-gray-200" value={fromDate} onChange={(e) => { setFromDate(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">To Date :</Label>
              <Input type="date" className="bg-gray-50 h-10 border-gray-200" value={toDate} onChange={(e) => { setToDate(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Customer :</Label>
              <Select value={selectedCustomer} onValueChange={(val) => { setSelectedCustomer(val); }}>
                <SelectTrigger className="bg-white h-10 border-gray-200 truncate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customer</SelectItem>
                  {availableCustomers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Site :</Label>
              <Select value={selectedSite} onValueChange={(val) => { setSelectedSite(val); }}>
                <SelectTrigger className="bg-white h-10 border-gray-200 truncate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Site</SelectItem>
                  {availableSites.map((s, i) => (
                    <SelectItem key={i} value={s as string}>{s as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 flex-1 font-medium" onClick={handleSearch}>Search</Button>
              <Button className="bg-rose-500 hover:bg-rose-600 text-white h-10 flex-1 font-medium" onClick={handleClear}>Clear</Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none ${printDC ? "print:hidden" : ""}`}>

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
              <h2 className="text-2xl font-bold text-[#1e40af] uppercase">Delivery Challan List</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Generated: {new Date().toLocaleDateString()}</p>
              {(fromDate || toDate) && (
                <p className="text-sm text-gray-500 font-medium">
                  Period: {fromDate || "Start"} to {toDate || "End"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-9 bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handleCopy}>Copy</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handleExportCSV}>CSV</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handlePrintPDF}>PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <Table className="print:text-[10px]">
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b-2 border-gray-300">
                <TableHead className="text-gray-900 font-bold py-4 px-4 whitespace-nowrap text-center print:py-2">DC No</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Customer</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Site</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Date</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Time</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Grade</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Quantity</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Rate</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Amount</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Vehicle</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center print:hidden">Invoice No</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center print:hidden">Plant</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center print:hidden">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dcsLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-10 text-gray-500">Loading Delivery Challans...</TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-10 text-gray-500">No matching Delivery Challans found.</TableCell>
                </TableRow>
              ) : (
                (document.body.classList.contains("print-mode") ? filteredData : paginatedData).map((row: any, idx: number) => {
                  const custName = row.customerName || customerMap[String(row.customerId?._id || row.customerId)]?.name || "-";
                  const siteName = row.siteName || customerMap[String(row.customerId?._id || row.customerId)]?.address || "-";

                  return (
                    <TableRow key={row.id || row._id || idx} className="hover:bg-gray-50/50 print:border-b print:border-gray-200">
                      <TableCell 
                        onClick={() => setSelectedDC(row)} 
                        className="text-center text-xs whitespace-nowrap border-r border-gray-100 font-semibold text-[#1e40af] print:text-black cursor-pointer hover:underline hover:text-blue-800"
                        title="Click to view details"
                      >
                        {row.dcNumber || "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs border-r border-gray-100 max-w-[150px] truncate print:max-w-none print:whitespace-normal" title={custName}>{custName}</TableCell>
                      <TableCell className="text-center text-xs border-r border-gray-100 max-w-[150px] truncate print:max-w-none print:whitespace-normal" title={siteName}>{siteName}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.dcDate ? new Date(row.dcDate).toLocaleDateString("en-IN") : "-"}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.dcTime || "-"}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 font-semibold">{row.grade || "-"}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 font-bold text-cyan-600 print:text-black">{Number(row.quantity || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{Number(row.rate || 0)}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 font-semibold">{Number(row.netAmount || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.vehicleReg || "-"}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 print:hidden">{row.invoiceNumber || "N/A"}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 print:hidden">{row.plant || "-"}</TableCell>
                      <TableCell className="text-center text-xs whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print (Printer Icon) */}
                          <Button 
                            onClick={() => handlePrintSingleDC(row)}
                            title="Print PDF with Letterhead" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* 2. CSV (Download Icon) */}
                          <Button 
                            onClick={() => handleExportRowCSV(row)}
                            title="Download CSV" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* 3. Copy (Copy Icon) */}
                          <Button 
                            onClick={() => handleCopyRow(row)}
                            title="Copy Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {/* 4. Edit (Pencil Icon) */}
                          <Button 
                            onClick={() => handleEditDC(row)}
                            title="Edit DC" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* 5. Delete (Trash Icon) */}
                          <Button 
                            onClick={() => handleDelete(row.id || row._id)}
                            title="Delete DC" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-rose-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Printable Footer (Only visible during print) */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-800">
          <div className="text-sm font-bold text-gray-600">
            Total Records: {filteredData.length} <br />
            Total Quantity: {filteredData.reduce((sum: number, dc: any) => sum + (Number(dc.quantity) || 0), 0).toFixed(2)} m³ <br />
            Total Amount: ₹{filteredData.reduce((sum: number, dc: any) => sum + (Number(dc.netAmount) || 0), 0).toLocaleString("en-IN")}
          </div>
          <div className="text-center space-y-8">
            <div className="w-48 border-b border-gray-400"></div>
            <p className="text-sm font-bold text-gray-800 uppercase">Authorized Signatory</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100 print:hidden">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={currentPage === 1 ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i + 1;
                // Simple logic to show pages around current page if there are many
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 ${currentPage === pageNum ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-0' : 'text-gray-600'}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className={currentPage >= totalPages || totalPages === 0 ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedDC} onOpenChange={(open) => !open && setSelectedDC(null)}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-full">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">DC Details - {selectedDC?.dcNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 print:mt-10">
            {/* Print Header inside modal */}
            <div className="hidden print:block mb-4 border-b border-gray-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1e40af] text-white flex items-center justify-center font-black text-xl rounded-lg">BM</div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">BuildRMC Enterprises</h1>
                  <p className="text-xs text-gray-600 font-medium">Delivery Challan Ticket: {selectedDC?.dcNumber}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100 print:border-none print:bg-white print:p-0">
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">DC Number:</span> <div className="font-medium text-slate-800">{selectedDC?.dcNumber}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Date & Time:</span> <div className="font-medium text-slate-800">{selectedDC?.dcDate ? new Date(selectedDC.dcDate).toLocaleDateString("en-IN") : "-"} {selectedDC?.dcTime || ""}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Customer:</span> <div className="font-medium text-slate-800">{selectedDC?.customerName || customerMap[String(selectedDC?.customerId?._id || selectedDC?.customerId)]?.name || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Site:</span> <div className="font-medium text-slate-800">{selectedDC?.siteName || customerMap[String(selectedDC?.customerId?._id || selectedDC?.customerId)]?.address || "-"}</div></div>
              </div>
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No:</span> <div className="font-medium text-slate-800">{selectedDC?.vehicleReg || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Grade & Qty:</span> <div className="font-medium text-slate-800">{selectedDC?.grade} - {selectedDC?.quantity} m³</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rate & Amount:</span> <div className="font-medium text-slate-800">₹{selectedDC?.rate || 0} (Net: ₹{Number(selectedDC?.netAmount || 0).toLocaleString("en-IN")})</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Plant:</span> <div className="font-medium text-slate-800">{selectedDC?.plant || "-"}</div></div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 print:hidden">
              <Button onClick={() => setSelectedDC(null)} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Single DC Sheet for Printing */}
      {printDC && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#1e40af] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#1e40af] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">DELIVERY CHALLAN</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">GSTIN: 36AAAAF1234A1Z0</p>
              <p className="text-[9px] text-gray-400 font-medium">Date: {printDC.dcDate ? new Date(printDC.dcDate).toLocaleDateString("en-IN") : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Challan Details</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">DC Number: <span className="font-black text-gray-900">{printDC.dcNumber}</span></p>
                <p className="text-xs font-bold text-gray-700">DC Date: <span className="font-medium text-gray-900">{printDC.dcDate ? new Date(printDC.dcDate).toLocaleDateString("en-IN") : "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">DC Time: <span className="font-medium text-gray-900">{printDC.dcTime || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Loaded Plant: <span className="font-medium text-gray-900">{printDC.plant || "-"}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Customer & Vehicle</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Customer: <span className="font-black text-gray-900">{printDC.customerName || customerMap[String(printDC.customerId?._id || printDC.customerId)]?.name || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Site Address: <span className="font-medium text-gray-900">{printDC.siteName || customerMap[String(printDC.customerId?._id || printDC.customerId)]?.address || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Vehicle: <span className="font-medium text-gray-900">{printDC.vehicleReg || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Driver Name: <span className="font-medium text-gray-900">{printDC.driverName || "-"}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2 text-center w-12">S/No</th>
                <th className="border p-2">Grade Type</th>
                <th className="border p-2 text-center">Quantity (m³)</th>
                <th className="border p-2 text-right">Unit Rate (₹)</th>
                <th className="border p-2 text-right">Net Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs">
                <td className="border p-2 text-center font-bold">1</td>
                <td className="border p-2 font-semibold text-gray-800">{printDC.grade || "-"}</td>
                <td className="border p-2 text-center font-medium">{Number(printDC.quantity || 0).toFixed(2)}</td>
                <td className="border p-2 text-right font-medium">₹{Number(printDC.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="border p-2 text-right font-bold text-[#1e40af]">₹{Number(printDC.netAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400">Received above material in good condition. Subject to local jurisdiction.</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Receiver Signature</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-[#1e40af] tracking-wider">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
