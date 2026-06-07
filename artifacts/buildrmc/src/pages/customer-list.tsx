import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { 
  useGetCustomers, 
  useDeleteCustomer, 
  useUpdateCustomer,
  useGetMasters,
  useGetEmployees
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Filter,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(true);

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
  
  const { data: dbPlants } = useGetMasters("plant");
  const { data: employees } = useGetEmployees();

  const marketingStaff = useMemo(() => {
    if (!employees) return [];
    return (employees as any[]).map(e => e.name || e.fullName).filter(Boolean);
  }, [employees]);
  
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
    legalName: "",
    contact: "",
    email: "",
    address: "",
    gstNumber: "",
    creditTerms: "30 Days",
    state: "JAMMU AND KASHMIR",
    marketingPerson: "Fortune Concrete",
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    businessGroup: "READY MIX CONCRETE",
    contactPersonName: "",
    contactPersonPhone: "",
    sourceType: "direct",
    designation: "owner",
    plant: "All Plant",
    siteName: "",
    siteAddress: ""
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
Sales Person: ${c.marketingPerson || "—"}
Reg Date: ${c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Details Copied 📋", description: `${c.name}'s information saved to clipboard.` });
  };

  // Row CSV Action
  const handleCSVSingle = (c: any) => {
    if (!c) return;
    const headers = ["Customer Name", "Address", "Phone", "GSTIN No", "PAN No", "Sales Person", "Reg Date"];
    const row = [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${c.contact || ""}"`,
      `"${c.gstNumber || "—"}"`,
      `"${c.gstNumber ? c.gstNumber.substring(2, 12) : "—"}"`,
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
    const headers = ["Customer Name", "Address", "Phone", "GSTIN No", "PAN No", "Sales Person", "Reg Date"];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.address || "—",
      c.contact,
      c.gstNumber || "—",
      c.gstNumber ? c.gstNumber.substring(2, 12) : "—",
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
    const headers = ["Customer Name", "Address", "Phone", "GSTIN No", "PAN No", "Sales Person", "Reg Date"];
    const rows = filteredCustomers.map(c => [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${(c.contact || "").replace(/"/g, '""')}"`,
      `"${(c.gstNumber || "—").replace(/"/g, '""')}"`,
      `"${c.gstNumber ? c.gstNumber.substring(2, 12) : "—"}"`,
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
      legalName: customer.legalName || "",
      contact: customer.contact || "",
      email: customer.email || "",
      address: customer.address || "",
      gstNumber: customer.gstNumber || "",
      creditTerms: customer.creditTerms || "30 Days",
      state: customer.state || "JAMMU AND KASHMIR",
      marketingPerson: customer.marketingPerson || "",
      creditLimit: customer.creditLimit !== undefined && customer.creditLimit !== null ? String(customer.creditLimit) : "",
      creditDays: customer.creditDays !== undefined && customer.creditDays !== null ? String(customer.creditDays) : "",
      openingBalance: customer.openingBalance !== undefined && customer.openingBalance !== null ? String(customer.openingBalance) : "",
      businessGroup: customer.businessGroup || "READY MIX CONCRETE",
      contactPersonName: customer.contactPersonName || "",
      contactPersonPhone: customer.contactPersonPhone || "",
      sourceType: customer.sourceType || "direct",
      designation: customer.designation || "owner",
      plant: customer.plant || "",
      siteName: customer.siteName || "",
      siteAddress: customer.siteAddress || ""
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.contact.trim()) {
      toast({ title: "Validation Error", description: "Customer Name and Phone are required fields.", variant: "destructive" });
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      legalName: editForm.legalName.trim() || undefined,
      contact: editForm.contact.trim(),
      email: editForm.email.trim() || undefined,
      address: editForm.address.trim(),
      gstNumber: editForm.gstNumber.trim() || undefined,
      state: editForm.state || undefined,
      businessGroup: editForm.businessGroup || undefined,
      marketingPerson: editForm.marketingPerson || undefined,
      creditLimit: editForm.creditLimit ? parseFloat(editForm.creditLimit) : undefined,
      creditDays: editForm.creditDays ? parseInt(editForm.creditDays) : undefined,
      openingBalance: editForm.openingBalance ? parseFloat(editForm.openingBalance) : undefined,
      contactPersonName: editForm.contactPersonName.trim() || undefined,
      contactPersonPhone: editForm.contactPersonPhone.trim() || undefined,
      sourceType: editForm.sourceType || undefined,
      designation: editForm.designation || undefined,
      plant: editForm.plant || undefined,
      siteName: editForm.siteName.trim() || undefined,
      siteAddress: editForm.siteAddress.trim() || undefined,
      creditTerms: editForm.creditTerms || undefined,
    };

    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      data: payload
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

  const labelStyle = "text-[9px] font-extrabold text-slate-400 mb-0.5 block uppercase tracking-wider";
  const inputStyle = "h-7 text-[10px] border-slate-200 rounded-lg shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white";
  const headerStyle = "bg-slate-50/50 text-slate-500 font-extrabold py-2 px-4 text-left text-[9.5px] border-b border-slate-100 uppercase tracking-wider";

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
        <div className="flex items-center justify-between bg-white p-2.5 px-4 rounded-2xl border border-slate-100 shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">Customer Management</h2>
            <div className="h-4 w-px bg-slate-200" />
            <nav className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/customer-po" className="hover:text-[#ea580c] transition-colors">Customer & PO</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#ea580c]">Customer List</span>
            </nav>
          </div>
          <div className="flex gap-2">
            <Link href="/customer-po/customer/new">
              <Button size="sm" className="bg-[#ea580c] hover:bg-[#d97706] text-white font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Customer
              </Button>
            </Link>
            <Link href="/customer-po/customer/godowns">
              <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded-lg transition-colors">
                <Warehouse className="h-3.5 w-3.5" /> Manage Godowns
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                showFilters ? "bg-orange-50 border-orange-200 text-[#ea580c]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3 w-3" /> Filters
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-sm no-print">
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
              <div className="flex items-center gap-4 h-7 px-3 bg-white rounded-lg border border-slate-200">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    checked={statusFilter === "Active"} 
                    onChange={() => setStatusFilter("Active")}
                    className="h-3 w-3 text-[#ea580c] accent-[#ea580c] cursor-pointer" 
                  />
                  <span className="text-[10px] font-bold text-slate-750">Active</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    checked={statusFilter === "Deactivated"}
                    onChange={() => setStatusFilter("Deactivated")}
                    className="h-3 w-3 text-[#ea580c] accent-[#ea580c] cursor-pointer" 
                  />
                  <span className="text-[10px] font-bold text-slate-750">Deactivated</span>
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

            {/* Symmetrical buttons */}
            <div className="flex gap-1.5 h-7">
              <Button 
                type="button"
                onClick={handleSearch}
                className="bg-[#ea580c] hover:bg-[#d97706] text-white font-extrabold text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1 rounded-lg transition-colors"
              >
                <Search className="h-3 w-3" /> Search
              </Button>
              <Button 
                type="button"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[9px] h-full px-4 uppercase tracking-wider shadow-none border border-slate-200 cursor-pointer flex items-center justify-center gap-1 rounded-lg transition-colors"
                onClick={handleClear}
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </Button>
            </div>

          </div>
        </div>
        )}

        {/* Table Register Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
          <div className="p-3 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 no-print">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase">Show</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-14 h-6 bg-white border-slate-200 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
              </Select>
              <span className="text-[9px] font-black text-slate-400 uppercase">entries</span>
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
                <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading registered directories from MongoDB Atlas...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100 hover:bg-slate-50/50">
                    <TableHead className={headerStyle}>Customer Name</TableHead>
                    <TableHead className={headerStyle}>Address</TableHead>
                    <TableHead className={headerStyle}>Phone</TableHead>
                    <TableHead className={headerStyle}>GSTIN No</TableHead>
                    <TableHead className={headerStyle}>PAN No</TableHead>
                    <TableHead className={headerStyle}>Sales Person</TableHead>
                    <TableHead className={headerStyle}>Reg Date</TableHead>
                    <TableHead className="bg-slate-50/50 text-slate-500 font-extrabold py-2 px-3 text-center text-[9.5px] border-b border-slate-100 uppercase tracking-wider w-[70px]">OPTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-[10px] text-slate-400 font-bold italic uppercase">
                        No customer directories found in MongoDB Atlas.
                      </TableCell>
                     </TableRow>
                  ) : filteredCustomers.map((customer, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="text-left text-[10.5px] font-bold text-slate-800 hover:text-[#ea580c] py-2.5 px-4 transition-colors cursor-pointer">{customer.name}</TableCell>
                      <TableCell className="text-left text-[10px] text-slate-500 font-medium py-2.5 px-4 max-w-[200px] truncate" title={customer.address}>{customer.address || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] text-slate-650 font-semibold py-2.5 px-4">{customer.contact || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] text-slate-650 font-semibold py-2.5 px-4">{customer.gstNumber || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] text-slate-650 font-semibold py-2.5 px-4 whitespace-nowrap">
                        {customer.gstNumber && customer.gstNumber.length >= 12 ? customer.gstNumber.substring(2, 12) : "—"}
                      </TableCell>
                      <TableCell className="text-center text-[10px] font-bold text-[#ea580c] py-2.5 px-4">{customer.marketingPerson || "—"}</TableCell>
                      <TableCell className="text-center text-[10px] text-slate-500 font-semibold py-2.5 px-4 whitespace-nowrap">
                        {customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      
                      {/* Direct action buttons - 100% bug-free, ultra-premium colored buttons */}
                      <TableCell className="text-center py-1.5 px-3">
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
                          <DropdownMenuContent align="end" className="w-48 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                            <DropdownMenuItem onClick={() => setViewingCustomer(customer)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Eye className="h-3.5 w-3.5 text-[#ea580c]" />
                              <span>View Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartEdit(customer)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Edit2 className="h-3.5 w-3.5 text-[#ea580c]" />
                              <span>Edit Customer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPrintTarget(customer)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Printer className="h-3.5 w-3.5 text-red-500" />
                              <span>Print Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCSVSingle(customer)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Download className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Export CSV</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopySingle(customer)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                              <Copy className="h-3.5 w-3.5 text-[#ea580c]" />
                              <span>Copy Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(customer.id)} 
                              className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              <span>Delete Customer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border-t bg-white shrink-0 no-print">
            <div className="text-[9px] font-black text-slate-400 uppercase font-extrabold">Showing {filteredCustomers.length > 0 ? 1 : 0} to {filteredCustomers.length} of {filteredCustomers.length} entries</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-slate-200 text-slate-400" disabled><ChevronRight className="h-3 w-3 rotate-180" /></Button>
              <div className="h-6 px-2 flex items-center justify-center bg-[#ea580c] text-white text-[9px] font-black rounded-lg">1</div>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-slate-200 text-slate-400" disabled><ChevronRight className="h-3 w-3" /></Button>
            </div>
          </div>
        </div>
      </div>


      {/* View Customer Details Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="max-w-md p-5 bg-white rounded-lg border">
          <DialogHeader className="border-b pb-2 mb-3">
            <DialogTitle className="text-sm font-black text-[#ea580c] uppercase tracking-wider">Customer Profile Details</DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-3 text-xs">
              <div className="border p-2.5 rounded bg-slate-50/50">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                <p className="font-extrabold text-[#ea580c] text-sm">{viewingCustomer.name}</p>
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
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Sales Person</p>
                  <p className="font-bold text-slate-800">{viewingCustomer.marketingPerson || "—"}</p>
                </div>
              </div>
              <div className="border p-2.5 rounded bg-slate-50/50">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Registration Date</p>
                <p className="font-bold text-slate-800">
                  {viewingCustomer.createdAt ? format(new Date(viewingCustomer.createdAt), "dd/MM/yyyy") : "—"}
                </p>
              </div>
              <div className="border p-2.5 rounded bg-slate-50/50">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Registered Office Address</p>
                <p className="font-medium text-slate-700 leading-relaxed">{viewingCustomer.address || "—"}</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 border-t pt-2">
            <Button size="sm" onClick={() => setViewingCustomer(null)} className="bg-[#ea580c] hover:bg-[#d97706] text-white uppercase text-[9px] font-black h-7 px-4 shadow-none border-0 cursor-pointer">Close Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-4xl p-5 bg-white rounded-lg border">
          <DialogHeader className="border-b pb-2 mb-3">
            <DialogTitle className="text-sm font-black text-[#ea580c] uppercase tracking-wider">Update Customer Profile</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-gray-100">
            
            {/* Business Identity */}
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Business Identity</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Customer Name *</Label>
                  <Input 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Legal Name</Label>
                  <Input 
                    value={editForm.legalName} 
                    onChange={e => setEditForm({ ...editForm, legalName: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Customer Phone *</Label>
                  <Input 
                    value={editForm.contact} 
                    onChange={e => setEditForm({ ...editForm, contact: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Customer Email</Label>
                  <Input 
                    value={editForm.email} 
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label className={labelStyle}>Customer Address</Label>
                  <Input 
                    value={editForm.address} 
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>GSTIN Number</Label>
                  <Input 
                    value={editForm.gstNumber} 
                    onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>State</Label>
                  <Select value={editForm.state} onValueChange={v => setEditForm({ ...editForm, state: v })}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JAMMU AND KASHMIR" className="text-[10px] font-bold">JAMMU AND KASHMIR</SelectItem>
                      <SelectItem value="TELANGANA" className="text-[10px] font-bold">TELANGANA</SelectItem>
                      <SelectItem value="KARNATAKA" className="text-[10px] font-bold">KARNATAKA</SelectItem>
                      <SelectItem value="ANDHRA PRADESH" className="text-[10px] font-bold">ANDHRA PRADESH</SelectItem>
                      <SelectItem value="TAMIL NADU" className="text-[10px] font-bold">TAMIL NADU</SelectItem>
                      <SelectItem value="MAHARASHTRA" className="text-[10px] font-bold">MAHARASHTRA</SelectItem>
                      <SelectItem value="DELHI" className="text-[10px] font-bold">DELHI</SelectItem>
                      <SelectItem value="GUJARAT" className="text-[10px] font-bold">GUJARAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financial & Classification */}
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Financial & Classification</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Credit Limit</Label>
                  <Input 
                    type="number"
                    value={editForm.creditLimit} 
                    onChange={e => setEditForm({ ...editForm, creditLimit: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Credit Days</Label>
                  <Input 
                    type="number"
                    value={editForm.creditDays} 
                    onChange={e => setEditForm({ ...editForm, creditDays: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Opening Balance</Label>
                  <Input 
                    type="number"
                    value={editForm.openingBalance} 
                    onChange={e => setEditForm({ ...editForm, openingBalance: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Credit Terms</Label>
                  <Select value={editForm.creditTerms} onValueChange={v => setEditForm({ ...editForm, creditTerms: v })}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 Days" className="text-[10px] font-bold">30 Days</SelectItem>
                      <SelectItem value="45 Days" className="text-[10px] font-bold">45 Days</SelectItem>
                      <SelectItem value="60 Days" className="text-[10px] font-bold">60 Days</SelectItem>
                      <SelectItem value="COD" className="text-[10px] font-bold">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Business Group</Label>
                  <Select value={editForm.businessGroup} onValueChange={v => setEditForm({ ...editForm, businessGroup: v })}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="READY MIX CONCRETE" className="text-[10px] font-bold">READY MIX CONCRETE</SelectItem>
                      <SelectItem value="INFRASTRUCTURE BUILDERS" className="text-[10px] font-bold">INFRASTRUCTURE BUILDERS</SelectItem>
                      <SelectItem value="REAL ESTATE DEVELOPERS" className="text-[10px] font-bold">REAL ESTATE DEVELOPERS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Source Type</Label>
                  <Select value={editForm.sourceType} onValueChange={v => setEditForm({ ...editForm, sourceType: v })}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct" className="text-[10px] font-bold">Direct</SelectItem>
                      <SelectItem value="referral" className="text-[10px] font-bold">Referral</SelectItem>
                      <SelectItem value="campaign" className="text-[10px] font-bold">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Designation</Label>
                  <Select value={editForm.designation} onValueChange={v => setEditForm({ ...editForm, designation: v })}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner" className="text-[10px] font-bold">Owner</SelectItem>
                      <SelectItem value="manager" className="text-[10px] font-bold">Manager</SelectItem>
                      <SelectItem value="director" className="text-[10px] font-bold">Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5">
                  <Label className={labelStyle}>Marketing Person</Label>
                  <Select value={editForm.marketingPerson} onValueChange={v => setEditForm({ ...editForm, marketingPerson: v })}>
                    <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {marketingStaff.map((staffName: string) => (
                        <SelectItem key={staffName} value={staffName} className="text-[10px] font-bold">
                          {staffName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Person Details */}
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Contact Person Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Contact Person Name</Label>
                  <Input 
                    value={editForm.contactPersonName} 
                    onChange={e => setEditForm({ ...editForm, contactPersonName: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Contact Person Phone</Label>
                  <Input 
                    value={editForm.contactPersonPhone} 
                    onChange={e => setEditForm({ ...editForm, contactPersonPhone: e.target.value })} 
                    className={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Site Locations */}
            <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 border-b border-slate-200 pb-1.5">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Default Site Locations</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Site Name(s)</Label>
                  <Input 
                    value={editForm.siteName} 
                    onChange={e => setEditForm({ ...editForm, siteName: e.target.value })} 
                    className={inputStyle}
                    placeholder="Site A | Site B"
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className={labelStyle}>Site Address(es)</Label>
                  <Input 
                    value={editForm.siteAddress} 
                    onChange={e => setEditForm({ ...editForm, siteAddress: e.target.value })} 
                    className={inputStyle}
                    placeholder="Address A (PIN: 123456) | Address B (PIN: 654321)"
                  />
                </div>
              </div>
            </div>

          </div>
          <DialogFooter className="mt-4 border-t pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingCustomer(null)} className="h-7 uppercase text-[9px] font-black">Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={updateCustomerMutation.isPending} className="bg-[#ea580c] hover:bg-[#d97706] h-7 uppercase text-[9px] font-black text-white shadow-none border-0 cursor-pointer">
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
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#ea580c]">Customer Identity Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded">CUSTOMER DOSSIER</span>
            </div>
          </div>

          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-1.5 mb-4 text-[#ea580c]">Customer Identity Details</h2>

          <table className="w-full border collapse text-xs mb-6">
            <tbody>
              <tr className="border-b">
                <th className="p-3 bg-slate-50 text-left font-bold text-gray-600 w-1/3">Customer Name</th>
                <td className="p-3 font-black text-[#ea580c] text-sm">{printTarget.name}</td>
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
              <p className="font-black text-[#ea580c] uppercase mt-1">Fortune Concrete</p>
            </div>
          </div>
        </div>
      )}

      {/* Directory Summary Print Profile */}
      {!printTarget && (
        <div className="print-sheet hidden print:block bg-white p-6 text-black w-full font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#ea580c]">OFFICIAL REGISTERED CUSTOMERS DIRECTORY</h2>
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
                <th className="border p-2 text-center">Sales Executive</th>
                <th className="border p-2 text-center">Reg Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border p-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border p-2 font-bold text-[#ea580c]">{c.name}</td>
                  <td className="border p-2 text-gray-600 max-w-[150px] truncate">{c.address || "—"}</td>
                  <td className="border p-2 text-center font-semibold">{c.contact || "—"}</td>
                  <td className="border p-2 text-center uppercase">{c.gstNumber || "—"}</td>
                  <td className="border p-2 text-center uppercase">
                    {c.gstNumber && c.gstNumber.length >= 12 ? c.gstNumber.substring(2, 12) : "—"}
                  </td>
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
