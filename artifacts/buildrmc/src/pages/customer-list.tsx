import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { 
  useGetCustomers, 
  useDeleteCustomer, 
  useUpdateCustomer 
} from "@workspace/api-client-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ChevronRight, 
  Plus, 
  Loader2, 
  Warehouse,
  Eye,
  Printer,
  Download,
  Copy,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Input States
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");

  // Applied Search States
  const [appliedNameFilter, setAppliedNameFilter] = useState("");
  const [appliedPhoneFilter, setAppliedPhoneFilter] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("Active");

  // Fetching live customers from MongoDB Database
  const { data: customersData, isLoading } = useGetCustomers();
  const customers = customersData as any[];
  
  // Delete Customer mutation (Connected to live Atlas)
  const { mutate: deleteCustomer } = useDeleteCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer deleted successfully 🗑️", description: "The customer register record has been permanently removed." });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      },
      onError: (error: any) => {
        toast({ title: "Failed to delete customer", description: error.data?.error || "Error connecting to MongoDB.", variant: "destructive" });
      }
    }
  });

  // Live Atlas Update Customer mutation
  const updateCustomerMutation = useUpdateCustomer();

  // Dialog & Form states
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [printTarget, setPrintTarget] = useState<any | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    contact: "",
    address: "",
    gstNumber: "",
    plant: "",
    marketingPerson: ""
  });

  // Filter and Memoize customers lists against active search states
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => {
      const name = c.name || "";
      const contact = c.contact || "";
      const matchesName = name.toLowerCase().includes(appliedNameFilter.toLowerCase());
      const matchesPhone = contact.includes(appliedPhoneFilter);
      return matchesName && matchesPhone;
    });
  }, [customers, appliedNameFilter, appliedPhoneFilter]);

  const handleSearch = () => {
    setAppliedNameFilter(nameFilter);
    setAppliedPhoneFilter(phoneFilter);
    setAppliedStatusFilter(statusFilter);
    toast({ title: "Filters Applied 🔍", description: "Customer register directory updated." });
  };

  const handleClear = () => {
    setNameFilter("");
    setPhoneFilter("");
    setStatusFilter("Active");
    
    setAppliedNameFilter("");
    setAppliedPhoneFilter("");
    setAppliedStatusFilter("Active");
    toast({ title: "Filters Reset 🧹", description: "Showing all registered customers." });
  };

  // Trigger print after state update is fully loaded in print-root
  useEffect(() => {
    if (!printTarget) return;
    const timer = setTimeout(() => {
      window.print();
    }, 150);
    return () => clearTimeout(timer);
  }, [printTarget]);

  // Handle post-print dialog close
  useEffect(() => {
    const handleAfterPrint = () => setPrintTarget(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // Row Copy Action
  const handleCopySingle = (c: any) => {
    if (!c) return;
    const text = `Customer Name: ${c.name}
Address: ${c.address || "—"}
Phone: ${c.contact || "—"}
GSTIN No: ${c.gstNumber || "—"}
PAN No: ${c.gstNumber ? c.gstNumber.substring(2, 12) : "—"}
Plant: ${c.plant || "All Plant"}
Sales Person: ${c.marketingPerson || "—"}
Reg Date: ${c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Details Copied 📋", description: `${c.name}'s information saved to clipboard.` });
  };

  // Row CSV Action
  const handleCSVSingle = (c: any) => {
    if (!c) return;
    const headers = ["Customer Name", "Address", "Phone", "GSTIN No", "PAN No", "Plant", "Sales Person", "Reg Date"];
    const row = [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${c.contact || ""}"`,
      `"${c.gstNumber || "—"}"`,
      `"${c.gstNumber ? c.gstNumber.substring(2, 12) : "—"}"`,
      `"${c.plant || "All Plant"}"`,
      `"${c.marketingPerson || "—"}"`,
      `"${c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"}"`
    ];
    const csvContent = [headers, row].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${c.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_export.csv`;
    link.click();
    toast({ title: "CSV Downloaded 📊", description: `${c.name}'s customer file saved.` });
  };

  // Bulk Clipboard Copy
  const handleCopyAll = () => {
    if (!filteredCustomers.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Customer Name", "Address", "Phone", "GSTIN No", "PAN No", "Plant", "Sales Person", "Reg Date"];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.address || "—",
      c.contact,
      c.gstNumber || "—",
      c.gstNumber ? c.gstNumber.substring(2, 12) : "—",
      c.plant || "All Plant",
      c.marketingPerson || "—",
      c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"
    ]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Directory Copied 📋", description: "Complete table data saved to your clipboard." });
  };

  // Bulk CSV Export
  const handleExportCSVAll = () => {
    if (!filteredCustomers.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Customer Name", "Address", "Phone", "GSTIN No", "PAN No", "Plant", "Sales Person", "Reg Date"];
    const rows = filteredCustomers.map(c => [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${(c.contact || "").replace(/"/g, '""')}"`,
      `"${(c.gstNumber || "—").replace(/"/g, '""')}"`,
      `"${c.gstNumber ? c.gstNumber.substring(2, 12) : "—"}"`,
      `"${c.plant || "All Plant"}"`,
      `"${c.marketingPerson || "—"}"`,
      `"${c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customer_register_${format(new Date(), "dd_MM_yyyy")}.csv`;
    link.click();
    toast({ title: "Export Successful 📊", description: "Complete directory downloaded as CSV." });
  };

  const handleStartEdit = (customer: any) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      contact: customer.contact || "",
      address: customer.address || "",
      gstNumber: customer.gstNumber || "",
      plant: customer.plant || "",
      marketingPerson: customer.marketingPerson || ""
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.contact.trim()) {
      toast({ title: "Validation Error", description: "Customer Name and Phone are required fields.", variant: "destructive" });
      return;
    }

    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      data: editForm
    }, {
      onSuccess: () => {
        toast({ title: "Profile Updated ✨", description: "Customer details updated permanently in MongoDB Atlas." });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        setEditingCustomer(null);
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.data?.error || err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to permanently delete this customer from MongoDB? This action cannot be undone.")) {
      deleteCustomer({ id });
    }
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-2 bg-white";
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  return (
    <>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
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

      {/* Main Page Content */}
      <div className="space-y-3.5 main-screen">
        <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Customer Management</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/customer-po" className="hover:text-[#1e40af] transition-colors">Customer & PO</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#1e40af]">Customer List</span>
            </nav>
          </div>
          <div className="flex gap-2">
            <Link href="/customer-po/customer/new">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add Customer
              </Button>
            </Link>
            <Link href="/customer-po/customer/godowns">
              <Button size="sm" className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer">
                <Warehouse className="h-3.5 w-3.5" /> Manage Godowns
              </Button>
            </Link>
          </div>
        </div>

        {/* Robust, responsive wrapping flex container to prevent overflow/cutting */}
        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm no-print">
          <div className="flex flex-wrap gap-3 items-end">
            
            <div className="flex-1 min-w-[180px]">
              <Label className={labelStyle}>Customer Name</Label>
              <Input 
                placeholder="Type name here..." 
                className={inputStyle}
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="w-40">
              <Label className={labelStyle}>Customer Phone</Label>
              <Input 
                placeholder="Type phone no here..." 
                className={inputStyle}
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="w-52">
              <Label className={labelStyle}>Status</Label>
              <div className="flex items-center gap-4 h-7 px-3 bg-white rounded-md border border-gray-200">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    checked={statusFilter === "Active"} 
                    onChange={() => setStatusFilter("Active")}
                    className="h-3 w-3 text-[#1e40af] cursor-pointer" 
                  />
                  <span className="text-[10px] font-bold text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    checked={statusFilter === "Deactivated"}
                    onChange={() => setStatusFilter("Deactivated")}
                    className="h-3 w-3 text-[#1e40af] cursor-pointer" 
                  />
                  <span className="text-[10px] font-bold text-gray-700">Deactivated</span>
                </label>
              </div>
            </div>

            <div className="w-36">
              <Label className={labelStyle}>Alphabetic Wise</Label>
              <Select defaultValue="all">
                <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all" className="text-[10px] font-bold">All Customer</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="w-32">
              <Label className={labelStyle}>Date Sorting</Label>
              <Select defaultValue="na">
                <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="na" className="text-[10px] font-bold">N/A</SelectItem></SelectContent>
              </Select>
            </div>

            {/* Symmetrical search and clear button group - Always aligned and never clipped */}
            <div className="flex gap-1.5 h-7">
              <Button 
                type="button"
                onClick={handleSearch}
                className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
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

        {/* Table Register Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-slate-50/30 no-print">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-500 uppercase">Show</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-14 h-6 bg-white border-gray-200 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
              </Select>
              <span className="text-[9px] font-black text-gray-500 uppercase">entries</span>
            </div>
            <ExportDropdown
              onCopy={handleCopyAll}
              onCSV={handleExportCSVAll}
              onPDF={() => { setPrintTarget(null); setTimeout(() => window.print(), 100); }}
            />
          </div>

          <div className="overflow-x-auto min-h-[300px] no-print">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Loading registered directories from MongoDB Atlas...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-100">
                  <TableRow className="border-0 hover:bg-slate-100">
                    <TableHead className={headerStyle}>Customer Name</TableHead>
                    <TableHead className={headerStyle}>Address</TableHead>
                    <TableHead className={headerStyle}>Phone</TableHead>
                    <TableHead className={headerStyle}>GSTIN No</TableHead>
                    <TableHead className={headerStyle}>PAN No</TableHead>
                    <TableHead className={headerStyle}>Plant</TableHead>
                    <TableHead className={headerStyle}>Sales Person</TableHead>
                    <TableHead className={headerStyle}>Reg Date</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-[10px] text-gray-400 font-bold italic uppercase">
                        No customer directories found in MongoDB Atlas.
                      </TableCell>
                     </TableRow>
                  ) : filteredCustomers.map((customer, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="text-center text-[10px] font-black text-[#1e40af] py-2">{customer.name}</TableCell>
                      <TableCell className="text-left text-[10px] text-slate-700 font-semibold max-w-[180px] truncate" title={customer.address}>{customer.address || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] font-semibold">{customer.contact || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] font-semibold">{customer.gstNumber || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] font-semibold whitespace-nowrap">
                        {customer.gstNumber && customer.gstNumber.length >= 12 ? customer.gstNumber.substring(2, 12) : "—"}
                      </TableCell>
                      <TableCell className="text-center text-[10px] font-semibold">{customer.plant || "All Plant"}</TableCell>
                      <TableCell className="text-center text-[10px] font-bold text-indigo-600">{customer.marketingPerson || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] font-semibold whitespace-nowrap">
                        {customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      
                      {/* Direct action buttons - 100% bug-free, ultra-premium colored buttons */}
                      <TableCell className="text-center py-1.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          
                          <Button 
                            onClick={() => setViewingCustomer(customer)}
                            title="View Profile Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#1e40af]" />
                          </Button>

                          <Button 
                            onClick={() => handleStartEdit(customer)}
                            title="Edit Customer Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button 
                            onClick={() => setPrintTarget(customer)}
                            title="Print Customer Profile" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>

                          <Button 
                            onClick={() => handleCSVSingle(customer)}
                            title="Export CSV File" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>

                          <Button 
                            onClick={() => handleCopySingle(customer)}
                            title="Copy Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>

                          <Button 
                            onClick={() => handleDelete(customer.id)}
                            title="Delete Customer" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border-t bg-white shrink-0 no-print">
            <div className="text-[9px] font-black text-gray-500 uppercase">Showing {filteredCustomers.length > 0 ? 1 : 0} to {filteredCustomers.length} of {filteredCustomers.length} entries</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-400" disabled><ChevronRight className="h-3 w-3 rotate-180" /></Button>
              <div className="h-6 px-2 flex items-center justify-center bg-[#1e40af] text-white text-[9px] font-black rounded">1</div>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-400" disabled><ChevronRight className="h-3 w-3" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* View Customer Details Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="max-w-md p-5 bg-white rounded-lg border">
          <DialogHeader className="border-b pb-2 mb-3">
            <DialogTitle className="text-sm font-black text-[#1e40af] uppercase tracking-wider">Customer Profile Details</DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-3 text-xs">
              <div className="border p-2.5 rounded bg-slate-50/50">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                <p className="font-extrabold text-[#1e40af] text-sm">{viewingCustomer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border p-2.5 rounded bg-slate-50/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Phone Contact</p>
                  <p className="font-bold text-slate-800">{viewingCustomer.contact || "—"}</p>
                </div>
                <div className="border p-2.5 rounded bg-slate-50/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">GSTIN Number</p>
                  <p className="font-bold text-slate-800">{viewingCustomer.gstNumber || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border p-2.5 rounded bg-slate-50/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">PAN Identification</p>
                  <p className="font-bold text-slate-800">
                    {viewingCustomer.gstNumber && viewingCustomer.gstNumber.length >= 12 ? viewingCustomer.gstNumber.substring(2, 12) : "—"}
                  </p>
                </div>
                <div className="border p-2.5 rounded bg-slate-50/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Assigned Plant</p>
                  <p className="font-bold text-slate-800">{viewingCustomer.plant || "All Plant"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border p-2.5 rounded bg-slate-50/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Sales Person</p>
                  <p className="font-bold text-slate-800">{viewingCustomer.marketingPerson || "—"}</p>
                </div>
                <div className="border p-2.5 rounded bg-slate-50/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Registration Date</p>
                  <p className="font-bold text-slate-800">
                    {viewingCustomer.createdAt ? format(new Date(viewingCustomer.createdAt), "dd/MM/yyyy") : "—"}
                  </p>
                </div>
              </div>
              <div className="border p-2.5 rounded bg-slate-50/50">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Registered Office Address</p>
                <p className="font-medium text-slate-700 leading-relaxed">{viewingCustomer.address || "—"}</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 border-t pt-2">
            <Button size="sm" onClick={() => setViewingCustomer(null)} className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white uppercase text-[9px] font-black h-7 px-4 shadow-none border-0 cursor-pointer">Close Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-md p-5 bg-white rounded-lg border">
          <DialogHeader className="border-b pb-2 mb-3">
            <DialogTitle className="text-sm font-black text-[#1e40af] uppercase tracking-wider">Update Customer Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Customer Name</Label>
              <Input 
                value={editForm.name} 
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                className="h-8 text-xs border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Customer Phone</Label>
                <Input 
                  value={editForm.contact} 
                  onChange={e => setEditForm({ ...editForm, contact: e.target.value })} 
                  className="h-8 text-xs border-gray-200"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">GSTIN Number</Label>
                <Input 
                  value={editForm.gstNumber} 
                  onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value })} 
                  className="h-8 text-xs border-gray-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Assigned Plant</Label>
                <Input 
                  value={editForm.plant} 
                  onChange={e => setEditForm({ ...editForm, plant: e.target.value })} 
                  className="h-8 text-xs border-gray-200"
                  placeholder="e.g. Hyderabad Plant"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sales Person</Label>
                <Input 
                  value={editForm.marketingPerson} 
                  onChange={e => setEditForm({ ...editForm, marketingPerson: e.target.value })} 
                  className="h-8 text-xs border-gray-200"
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Address</Label>
              <textarea 
                value={editForm.address} 
                onChange={e => setEditForm({ ...editForm, address: e.target.value })} 
                className="w-full min-h-[60px] p-2 text-xs border rounded border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1e40af] font-medium text-slate-700"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingCustomer(null)} className="h-7 uppercase text-[9px] font-black">Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={updateCustomerMutation.isPending} className="bg-[#1e40af] hover:bg-[#1d4ed8] h-7 uppercase text-[9px] font-black text-white shadow-none border-0 cursor-pointer">
              {updateCustomerMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== LANDSCAPE CUSTOMER DUAL PRINT SHEETS ===== */}

      {/* Single Customer Print Profile (Branded letterhead) */}
      {printTarget && (
        <div className="print-sheet hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Customer Identity Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded">CUSTOMER DOSSIER</span>
            </div>
          </div>

          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-1.5 mb-4 text-[#1e40af]">Customer Identity Details</h2>

          <table className="w-full border collapse text-xs mb-6">
            <tbody>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600 w-1/3">Customer Name</th>
                <td className="p-3 font-black text-[#1e40af] text-sm">{printTarget.name}</td>
              </tr>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">Primary contact</th>
                <td className="p-3 font-bold text-gray-800">{printTarget.contact || "—"}</td>
              </tr>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">GSTIN Identification</th>
                <td className="p-3 font-semibold text-gray-800 uppercase">{printTarget.gstNumber || "—"}</td>
              </tr>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">Permanent Account Number (PAN)</th>
                <td className="p-3 font-semibold text-gray-800 uppercase">
                  {printTarget.gstNumber && printTarget.gstNumber.length >= 12 ? printTarget.gstNumber.substring(2, 12) : "—"}
                </td>
              </tr>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">Allocated Supply Plant</th>
                <td className="p-3 font-medium text-gray-800">{printTarget.plant || "All Plant"}</td>
              </tr>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">Responsible Sales Account Manager</th>
                <td className="p-3 font-bold text-indigo-600">{printTarget.marketingPerson || "—"}</td>
              </tr>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">Registration Date</th>
                <td className="p-3 font-medium text-gray-800">
                  {printTarget.createdAt ? format(new Date(printTarget.createdAt), "dd/MM/yyyy") : "—"}
                </td>
              </tr>
              <tr>
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600">Registered Office Address</th>
                <td className="p-3 font-medium text-gray-700 leading-relaxed">{printTarget.address || "—"}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-20 text-xs">
            <div>
              <div className="h-px bg-gray-300 w-44 mb-2" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Corporate Seal Verification</p>
            </div>
            <div className="text-right">
              <div className="h-px bg-gray-300 w-44 mb-2 ml-auto" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Authorized Registrar Signatory</p>
              <p className="font-black text-[#1e40af] uppercase mt-1">Fortune Concrete</p>
            </div>
          </div>
        </div>
      )}

      {/* Directory Summary Print Profile */}
      {!printTarget && (
        <div className="print-sheet hidden print:block bg-white p-6 text-black w-full font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">OFFICIAL REGISTERED CUSTOMERS DIRECTORY</h2>
            <p className="text-[10px] font-bold text-gray-600">Printed Date: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>

          <table className="w-full border-collapse border text-[9px] text-left">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase text-gray-800">
                <th className="border p-2 text-center w-12">S/No</th>
                <th className="border p-2">Customer Name</th>
                <th className="border p-2">Office Address</th>
                <th className="border p-2 text-center">Contact Phone</th>
                <th className="border p-2 text-center">GSTIN Identification</th>
                <th className="border p-2 text-center">PAN Code</th>
                <th className="border p-2 text-center">Assigned Plant</th>
                <th className="border p-2 text-center">Sales Executive</th>
                <th className="border p-2 text-center">Reg Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border p-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border p-2 font-bold text-[#1e40af]">{c.name}</td>
                  <td className="border p-2 text-gray-600 max-w-[150px] truncate">{c.address || "—"}</td>
                  <td className="border p-2 text-center font-semibold">{c.contact || "—"}</td>
                  <td className="border p-2 text-center uppercase">{c.gstNumber || "—"}</td>
                  <td className="border p-2 text-center uppercase">
                    {c.gstNumber && c.gstNumber.length >= 12 ? c.gstNumber.substring(2, 12) : "—"}
                  </td>
                  <td className="border p-2 text-center">{c.plant || "All Plant"}</td>
                  <td className="border p-2 text-center font-bold text-indigo-600">{c.marketingPerson || "—"}</td>
                  <td className="border p-2 text-center">
                    {c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
