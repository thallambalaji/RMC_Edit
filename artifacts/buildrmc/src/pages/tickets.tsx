import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
import { ChevronRight, Plus, Save, Search, Ticket, X, Loader2, Trash2, Pencil, Copy, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useGetVehicles } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Tickets() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  // Form State
  const [ticketNo, setTicketNo] = useState("");
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [vehicleNo, setVehicleNo] = useState("");
  const [weightType, setWeightType] = useState("Empty Weight");
  const [weight, setWeight] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [printTicket, setPrintTicket] = useState<any>(null);

  // Dynamic Data
  const { data: vehicles } = useGetVehicles();
  const availableVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.map((v: any) => v.registrationNo || v.registrationNumber || v.vehicleNumber || v.regNo).filter(Boolean);
  }, [vehicles]);

  // Generate a random ticket number for now
  useEffect(() => {
    setTicketNo(`TKT1/2627/${Math.floor(1000 + Math.random() * 9000)}`);
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const data = await customFetch("/api/weighment-tickets");
      setTickets(data as any[]);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load tickets from DB.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.ticketNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.createdBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tickets]);

  const handleSave = async () => {
    if (!vehicleNo || !weight) {
      toast({ title: "Validation Error", description: "Please select a vehicle and enter weight.", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      await customFetch("/api/weighment-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNo,
          plant,
          vehicleNo,
          weightType,
          weight
        })
      });

      toast({ title: "Ticket Saved", description: `Ticket ${ticketNo} has been stored in DB.` });
      
      // Refresh list and reset form
      fetchTickets();
      setVehicleNo("");
      setWeight("");
      setTicketNo(`TKT1/2627/${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to store ticket in DB.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customFetch(`/api/weighment-tickets/${id}`, { method: "DELETE" });
      toast({ title: "Ticket Successfully Deleted", description: "The ticket has been deleted." });
      fetchTickets();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete ticket.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setVehicleNo("");
    setWeightType("Empty Weight");
    setWeight("");
    setSearchTerm("");
    toast({ title: "Action Cancelled", description: "Form inputs have been cleared." });
  };

  const handleEditTicket = (row: any) => {
    toast({
      title: "Edit Restricted",
      description: `Weighment ticket ${row.ticketNo} is digitally signed and locked. supervisor approval is required.`,
      variant: "destructive"
    });
  };

  const handlePrintSingleTicket = (row: any) => {
    setPrintTicket(row);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyTicket = (row: any) => {
    const text = `Ticket No: ${row.ticketNo}\nVehicle: ${row.vehicleNo}\nWeight Type: ${row.weightType}\nWeight: ${row.weight} KG\nPlant: ${row.plant}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Ticket details copied to clipboard." });
  };

  const handleExportTicketCSV = (row: any) => {
    const csvContent = `Ticket No,Vehicle,Weight Type,Weight,Plant\n"${row.ticketNo}","${row.vehicleNo}","${row.weightType}","${row.weight} KG","${row.plant}"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ticket_${row.ticketNo?.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful" });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 print:bg-white print:p-0 print:m-0">
      <div className={`space-y-4 ${printTicket ? "print:hidden" : ""}`}>
        {/* Header & Breadcrumbs */}
      <div className="flex items-center justify-between bg-white/40 p-4 rounded-xl backdrop-blur-md border border-white/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Weighment Tickets</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Manage and generate vehicle weighment records</p>
        </div>
        <nav className="text-[10px] font-bold text-slate-400 flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <Link href="/dashboard" className="hover:text-cyan-500 transition-colors">HOME</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/dc" className="hover:text-cyan-500 transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-slate-800">TICKETS</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generate Ticket Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-6 border-white/80 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="bg-cyan-500/10 p-2 rounded-lg">
                <Ticket className="h-5 w-5 text-cyan-600" />
              </div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Generate Ticket</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="f-label">Ticket No</Label>
                <Input value={ticketNo} readOnly className="f-input bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Plant <span className="text-rose-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="f-label text-slate-600">Vehicle No <span className="text-rose-500">*</span></Label>
                  <button className="text-[10px] text-cyan-600 font-black hover:underline flex items-center gap-0.5">
                    <Plus className="h-2.5 w-2.5" /> ADD NEW
                  </button>
                </div>
                <Select value={vehicleNo} onValueChange={setVehicleNo}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue placeholder="Choose Vehicle" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700 max-h-[250px]">
                    {availableVehicles.length > 0 ? (
                      availableVehicles.map((v: string, idx: number) => (
                        <SelectItem key={idx} value={v}>{v}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="TS07UP 1459">TS07UP 1459</SelectItem>
                        <SelectItem value="TS07UP 1789">TS07UP 1789</SelectItem>
                        <SelectItem value="TS07UP 1679">TS07UP 1679</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Weight Type <span className="text-rose-500">*</span></Label>
                <Select value={weightType} onValueChange={setWeightType}>
                  <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="Empty Weight">Empty Weight</SelectItem>
                    <SelectItem value="Loaded Weight">Loaded Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="f-label text-slate-600">Weight (KG) <span className="text-rose-500">*</span></Label>
                <Input 
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight in KG"
                  className="f-input bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 font-mono" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1 btn-primary h-11 gap-2 shadow-lg shadow-cyan-500/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                  SAVE TICKET
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1 bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 h-11 gap-2 transition-all font-bold text-[10px]">
                  <X className="h-4 w-4" /> CANCEL
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tickets List Table */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="glass-card flex-1 flex flex-col overflow-hidden border-white/80 shadow-xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input 
                  placeholder="Search by Ticket No, Vehicle..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="f-input w-64 bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 shadow-sm" 
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Show</span>
                <Select defaultValue="10">
                  <SelectTrigger className="w-20 h-8 bg-white border-slate-200 text-slate-600 text-xs font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 bg-white">
              <Table className="data-table">
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className={headerStyle}>Ticket NO</TableHead>
                    <TableHead className={headerStyle}>Vehicle No</TableHead>
                    <TableHead className={headerStyle}>Weight Type</TableHead>
                    <TableHead className={headerStyle}>Weight</TableHead>
                    <TableHead className={headerStyle}>Date & Time</TableHead>
                    <TableHead className={headerStyle}>Created By</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter print:hidden">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Tickets...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTickets.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors group">
                      <TableCell className="text-center py-3 text-cyan-600 font-black text-xs">{row.ticketNo}</TableCell>
                      <TableCell className="text-center py-3 text-slate-700 font-bold text-xs">{row.vehicleNo}</TableCell>
                      <TableCell className="text-center py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          row.weightType === "Empty Weight" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}>
                          {row.weightType}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3 text-slate-800 font-mono font-bold text-xs">{row.weight} KG</TableCell>
                      <TableCell className="text-center py-3 text-slate-500 font-semibold text-[10px]">{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-center py-3 text-slate-600 font-bold text-xs">{row.createdBy}</TableCell>
                      <TableCell className="text-center py-3 print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print (Printer Icon) */}
                          <Button 
                            onClick={() => handlePrintSingleTicket(row)}
                            title="Print Ticket" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* 2. CSV (Download Icon) */}
                          <Button 
                            onClick={() => handleExportTicketCSV(row)}
                            title="Download CSV" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* 3. Copy (Copy Icon) */}
                          <Button 
                            onClick={() => handleCopyTicket(row)}
                            title="Copy Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {/* 4. Edit (Pencil Icon) - opens details view */}
                          <Button 
                            onClick={() => setSelectedTicket(row)}
                            title="Edit Ticket" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* 5. Delete (Trash Icon) */}
                          <Button 
                            onClick={() => handleDelete(row._id || row.id)}
                            title="Delete Ticket" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-rose-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-slate-300 italic font-medium">No tickets found matching "{searchTerm}"</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Showing {filteredTickets.length} of {tickets.length} entries</div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-400 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm">Prev</Button>
                <button className="h-7 w-7 flex items-center justify-center rounded text-[10px] font-black bg-cyan-500 text-white shadow-md shadow-cyan-500/30">1</button>
                <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm">Next</Button>
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
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">Ticket Details - {selectedTicket?.ticketNo}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Ticket No:</span> <div className="font-medium text-slate-800 font-mono font-bold text-cyan-600">{selectedTicket?.ticketNo}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Plant Name:</span> <div className="font-medium text-slate-800">{selectedTicket?.plant || "FORTUNE CONCRETE"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No:</span> <div className="font-medium text-slate-800 font-bold">{selectedTicket?.vehicleNo || "-"}</div></div>
              </div>
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Weight Type:</span> <div className="font-medium text-slate-800 font-semibold">{selectedTicket?.weightType || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Recorded Weight:</span> <div className="font-medium text-slate-800 font-bold text-emerald-600">{selectedTicket?.weight || 0} KG</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Timestamp:</span> <div className="font-medium text-slate-800">{selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : "-"}</div></div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setSelectedTicket(null)} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Single Ticket Sheet for Printing */}
      {printTicket && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#1e40af] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#1e40af] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">WEIGHMENT TICKET</div>
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
                <p className="text-xs font-bold text-gray-700">Recorded By: <span className="font-medium text-gray-900">{printTicket.createdBy || "System Admin"}</span></p>
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
  );
}
