import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronRight, Plus, Save, Search, Ticket, X, Loader2, Trash2, 
  Pencil, Copy, Printer, Download, Eye, Undo 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useGetVehicles } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StoreLayout } from "@/components/store-layout";

export default function InventoryTicketPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  // Form & Editing States
  const [ticketNo, setTicketNo] = useState("");
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [vehicleNo, setVehicleNo] = useState("");
  const [weightType, setWeightType] = useState("Loaded Weight");
  const [weight, setWeight] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Listing, Search & Pagination States
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog & Print States
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [printTicket, setPrintTicket] = useState<any>(null);
  
  // Quick Add Vehicle Modal States
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicleReg, setNewVehicleReg] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // Load vehicles from react-query hook
  const { data: vehicles, refetch: refetchVehicles } = useGetVehicles();
  const availableVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles
      .map((v: any) => v.registrationNo || v.registrationNumber || v.vehicleNumber || v.regNo)
      .filter(Boolean);
  }, [vehicles]);

  // Generate random ticket number & Load tickets on mount
  useEffect(() => {
    generateNewTicketNo();
    fetchTickets();
  }, []);

  const generateNewTicketNo = () => {
    setTicketNo(`TKT1/2627/${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const data = await customFetch("/api/inventory-tickets");
      setTickets(data as any[]);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load inventory tickets.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Search filter
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.ticketNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.plant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.weightType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tickets]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIdx, startIdx + pageSize);
  }, [currentPage, pageSize, filteredTickets]);

  // Handle Save (Create or Update)
  const handleSave = async () => {
    if (!vehicleNo) {
      toast({ title: "Validation Error", description: "Please select a vehicle.", variant: "destructive" });
      return;
    }
    if (!weight || Number(weight) <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid weight.", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        ticketNo,
        plant,
        vehicleNo,
        weightType,
        weight: Number(weight)
      };

      if (editingId) {
        // Update Ticket
        await customFetch(`/api/inventory-tickets/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        toast({ title: "Success", description: `Inventory ticket ${ticketNo} updated successfully.` });
      } else {
        // Create Ticket
        await customFetch("/api/inventory-tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        toast({ title: "Success", description: `Inventory ticket ${ticketNo} saved to database.` });
      }

      // Reset form & Refresh list
      handleReset();
      fetchTickets();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save inventory ticket.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form / Cancel editing
  const handleReset = () => {
    setEditingId(null);
    setVehicleNo("");
    setWeight("");
    setWeightType("Loaded Weight");
    generateNewTicketNo();
  };

  // Enter edit mode
  const startEdit = (ticket: any) => {
    setEditingId(ticket._id || ticket.id);
    setTicketNo(ticket.ticketNo);
    setPlant(ticket.plant);
    setVehicleNo(ticket.vehicleNo);
    setWeightType(ticket.weightType);
    setWeight(String(ticket.weight));
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast({ title: "Edit Mode", description: `Now editing ticket: ${ticket.ticketNo}` });
  };

  // Delete ticket
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory ticket?")) return;
    try {
      await customFetch(`/api/inventory-tickets/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Inventory ticket deleted successfully." });
      fetchTickets();
      if (editingId === id) handleReset();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete ticket.", variant: "destructive" });
    }
  };

  // Print Ticket Slip
  const handlePrintSingle = (ticket: any) => {
    setPrintTicket(ticket);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Copy Ticket details
  const handleCopy = (ticket: any) => {
    const text = `Inventory Ticket Details:\nTicket No: ${ticket.ticketNo}\nVehicle No: ${ticket.vehicleNo}\nWeight Type: ${ticket.weightType}\nWeight: ${ticket.weight} KG\nPlant: ${ticket.plant}\nRecorded At: ${new Date(ticket.createdAt).toLocaleString()}\nCreated By: ${ticket.createdBy}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Ticket details copied to clipboard." });
  };

  // Export single ticket as CSV
  const handleExportCSV = (ticket: any) => {
    const headers = ["Ticket No", "Vehicle No", "Weight Type", "Weight (KG)", "Plant", "Date & Time", "Created By"];
    const row = [
      `"${ticket.ticketNo}"`,
      `"${ticket.vehicleNo}"`,
      `"${ticket.weightType}"`,
      `"${ticket.weight}"`,
      `"${ticket.plant}"`,
      `"${new Date(ticket.createdAt).toLocaleString()}"`,
      `"${ticket.createdBy || "Super Admin"}"`
    ];
    const csvContent = `${headers.join(",")}\n${row.join(",")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_ticket_${ticket.ticketNo.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exported", description: "CSV exported successfully." });
  };

  // Add new vehicle dynamically
  const handleAddVehicle = async () => {
    if (!newVehicleReg.trim()) {
      toast({ title: "Validation Error", description: "Please enter vehicle registration number.", variant: "destructive" });
      return;
    }

    try {
      setIsAddingVehicle(true);
      const vehicleData = {
        registrationNo: newVehicleReg.trim().toUpperCase(),
        model: "Raw Material Truck",
        capacity: 10,
        status: "active",
      };

      await customFetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      toast({ title: "Vehicle Added", description: `Vehicle ${vehicleData.registrationNo} saved to database.` });
      
      // Refresh list, select the vehicle, close modal
      await refetchVehicles();
      setVehicleNo(vehicleData.registrationNo);
      setNewVehicleReg("");
      setIsAddVehicleOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to add new vehicle.", variant: "destructive" });
    } finally {
      setIsAddingVehicle(false);
    }
  };

  return (
    <StoreLayout title="Inventory Tickets" breadcrumbs={[{ label: "Inventory Ticket" }]}>
      <div className="space-y-4 animate-in fade-in duration-500 print:bg-white print:p-0 print:m-0">
        <div className={`space-y-4 ${printTicket ? "print:hidden" : ""}`}>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Generate Ticket Form */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-xl border shadow-md">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Ticket className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  {editingId ? "Edit Ticket" : "Generate Ticket"}
                </h3>
              </div>

              <div className="space-y-5">
                {/* Ticket Number (ReadOnly) */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ticket No *</Label>
                  <Input 
                    value={ticketNo} 
                    readOnly 
                    className="h-10 text-sm font-semibold bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-mono shadow-inner" 
                  />
                </div>

                {/* Plant Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Plant *</Label>
                  <Select value={plant} onValueChange={setPlant}>
                    <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                      <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                      <SelectItem value="MARVAL RMC">MARVAL RMC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Selector + Quick Add */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Vehicle No *</Label>
                  <Select value={vehicleNo} onValueChange={setVehicleNo}>
                    <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                      <SelectValue placeholder="Choose Vehicle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700 max-h-[200px]">
                      {availableVehicles.map((v: string, idx: number) => (
                        <SelectItem key={idx} value={v}>{v}</SelectItem>
                      ))}
                      {availableVehicles.length === 0 && (
                        <SelectItem value="MOCK-VEHICLE-1" disabled>Loading vehicles...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <div>
                    <button 
                      onClick={() => setIsAddVehicleOpen(true)}
                      type="button" 
                      className="text-xs text-blue-600 font-bold hover:underline hover:text-blue-700 mt-1 block"
                    >
                      Add New Vehicle
                    </button>
                  </div>
                </div>

                {/* Weight Type */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Weight Type *</Label>
                  <Select value={weightType} onValueChange={setWeightType}>
                    <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                      <SelectItem value="Loaded Weight">Loaded Weight</SelectItem>
                      <SelectItem value="Empty Weight">Empty Weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recorded Weight */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Weight *</Label>
                  <Input 
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight in KG"
                    className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 font-mono shadow-sm focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-xs tracking-wider uppercase h-11 gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                    {editingId ? "Save Changes" : "Save Ticket"}
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    className="flex-1 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-extrabold text-xs tracking-wider uppercase h-11 gap-1.5 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer border-0"
                  >
                    {editingId ? <Undo className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {editingId ? "Cancel" : "Reset"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tickets Listing Table */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-white rounded-xl border shadow-md flex-1 flex flex-col overflow-hidden">
              
              {/* Table Toolbar Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                {/* Top-Left: Show entries dropdown */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Show</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20 h-8 bg-white border-slate-200 text-slate-600 text-xs font-bold shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black">entries</span>
                </div>

                {/* Top-Right: Search Input */}
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Search:</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input 
                      placeholder="Type search terms..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="f-input w-56 pl-8 bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto flex-1 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className={headerStyle}>Ticket NO</TableHead>
                      <TableHead className={headerStyle}>Vehicle No</TableHead>
                      <TableHead className={headerStyle}>Weight Type</TableHead>
                      <TableHead className={headerStyle}>Weight</TableHead>
                      <TableHead className={headerStyle}>Date & Time</TableHead>
                      <TableHead className={headerStyle}>Created By</TableHead>
                      <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter print:hidden">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Fetching DB Records...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                          No inventory tickets found in the database.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTickets.map((row, idx) => (
                        <TableRow key={row._id || row.id || idx} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                          
                          {/* Ticket No as Blue Link */}
                          <TableCell 
                            onClick={() => setSelectedTicket(row)} 
                            className="text-center py-3 text-blue-600 font-extrabold text-xs cursor-pointer hover:underline"
                          >
                            {row.ticketNo}
                          </TableCell>

                          <TableCell className="text-center py-3 text-slate-700 font-bold text-xs">{row.vehicleNo}</TableCell>
                          
                          {/* Weight Type Pill Badge */}
                          <TableCell className="text-center py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              row.weightType === "Empty Weight" 
                                ? "bg-amber-50 text-amber-600 border-amber-200" 
                                : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            }`}>
                              {row.weightType}
                            </span>
                          </TableCell>

                          <TableCell className="text-center py-3 text-slate-800 font-mono font-bold text-xs">{row.weight} KG</TableCell>
                          
                          <TableCell className="text-center py-3 text-slate-500 font-semibold text-[10px]">
                            {new Date(row.createdAt).toLocaleDateString("en-GB")} {new Date(row.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </TableCell>

                          <TableCell className="text-center py-3 text-slate-600 font-bold text-xs">{row.createdBy || "Super Admin"}</TableCell>
                          
                          {/* Actions Dropdown */}
                          <TableCell className="text-center py-3 print:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-12 p-0 font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                                >
                                  --
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-white border-slate-200 min-w-[150px] shadow-lg rounded-md">
                                <DropdownMenuItem 
                                  onClick={() => setSelectedTicket(row)} 
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => startEdit(row)} 
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handlePrintSingle(row)} 
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Printer className="h-3.5 w-3.5 text-red-500" />
                                  Print Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleExportCSV(row)} 
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                                  Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleCopy(row)} 
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Copy className="h-3.5 w-3.5 text-cyan-600" />
                                  Copy Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(row._id || row.id)} 
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                  Delete Customer
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

              {/* Table Pagination Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                  Showing {filteredTickets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTickets.length)} of {filteredTickets.length} entries
                </div>
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm"
                  >
                    Previous
                  </Button>
                  
                  {/* Current Page Indicator */}
                  <span className="h-7 w-7 flex items-center justify-center rounded text-[10px] font-black bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                    {currentPage}
                  </span>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">
              Inventory Ticket Details - {selectedTicket?.ticketNo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Ticket No:</span> 
                  <div className="font-bold text-slate-800 font-mono text-emerald-600">{selectedTicket?.ticketNo}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Plant Name:</span> 
                  <div className="font-semibold text-slate-800">{selectedTicket?.plant || "FORTUNE CONCRETE"}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No:</span> 
                  <div className="font-bold text-slate-800">{selectedTicket?.vehicleNo || "-"}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Weight Type:</span> 
                  <div className="font-bold text-slate-800 uppercase text-emerald-600">{selectedTicket?.weightType || "-"}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Recorded Weight:</span> 
                  <div className="font-black text-slate-800 text-lg font-mono">{selectedTicket?.weight || 0} KG</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Date Recorded:</span> 
                  <div className="font-semibold text-slate-800">
                    {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setSelectedTicket(null)} className="bg-slate-800 hover:bg-slate-900 text-white shadow-md font-bold px-5">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-lg border-b border-slate-100 pb-2">
              Quick Add Vehicle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Registration Number *</Label>
              <Input 
                value={newVehicleReg} 
                onChange={(e) => setNewVehicleReg(e.target.value)} 
                placeholder="e.g. KA22D1788" 
                className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 font-mono shadow-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button 
                onClick={() => setIsAddVehicleOpen(false)} 
                variant="outline" 
                className="bg-white border-slate-200 text-slate-600 font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddVehicle} 
                disabled={isAddingVehicle}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isAddingVehicle ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add & Select"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Single Ticket Print Slip (only visible in @media print) */}
      {printTicket && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#1e40af] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#1e40af] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">INVENTORY TICKET</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">GSTIN: 36AAAAF1234A1Z0</p>
              <p className="text-[9px] text-gray-400 font-medium">Ticket Date: {printTicket.createdAt ? new Date(printTicket.createdAt).toLocaleDateString("en-IN") : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Ticket Details</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Ticket Number: <span className="font-black text-gray-900">{printTicket.ticketNo}</span></p>
                <p className="text-xs font-bold text-gray-700">Date & Time: <span className="font-medium text-gray-900">{printTicket.createdAt ? new Date(printTicket.createdAt).toLocaleString() : "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Operating Plant: <span className="font-medium text-gray-900">{printTicket.plant || "FORTUNE CONCRETE"}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Vehicle & Operator</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Vehicle No: <span className="font-black text-gray-900">{printTicket.vehicleNo || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Recorded By: <span className="font-medium text-gray-900">{printTicket.createdBy || "Super Admin"}</span></p>
                <p className="text-xs font-bold text-gray-700">Weight Type: <span className="font-medium text-gray-900 font-bold uppercase text-blue-800">{printTicket.weightType || "-"}</span></p>
              </div>
            </div>
          </div>

          {/* Weighment Slip Table */}
          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2">Parameter Description</th>
                <th className="border p-2 text-right">Value (KG)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs font-bold text-[#1e40af]">
                <td className="border p-2">{printTicket.weightType} Value</td>
                <td className="border p-2 text-right">{printTicket.weight || 0} KG</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400">All weighment measurements verified using calibrated weighing instruments.</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Driver Signature</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-[#1e40af] tracking-wider">Authorized Operator</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </StoreLayout>
  );
}
