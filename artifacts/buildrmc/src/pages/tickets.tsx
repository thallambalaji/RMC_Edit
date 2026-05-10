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
import { ChevronRight, MoreHorizontal, Plus, RotateCcw, Save, Search, Ticket, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Tickets() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  // Generate a random ticket number for now
  useEffect(() => {
    setTicketNo(`TKT1/2627/${Math.floor(1000 + Math.random() * 9000)}`);
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/weighment-tickets");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTickets(data);
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
      const res = await fetch("/api/weighment-tickets", {
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

      if (!res.ok) throw new Error("Failed to save");
      
      const newTicket = await res.json();
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

  const handleCancel = () => {
    setVehicleNo("");
    setWeightType("Empty Weight");
    setWeight("");
    setSearchTerm("");
    toast({ title: "Action Cancelled", description: "Form inputs have been cleared." });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
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
                  <SelectContent className="bg-white border-slate-200 text-slate-700">
                    <SelectItem value="TS07UP 1459">TS07UP 1459</SelectItem>
                    <SelectItem value="TS07UP 1789">TS07UP 1789</SelectItem>
                    <SelectItem value="TS07UP 1679">TS07UP 1679</SelectItem>
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
                  <TableRow className="bg-slate-900 hover:bg-slate-900 border-b border-slate-800">
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Ticket NO</TableHead>
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Vehicle No</TableHead>
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Weight Type</TableHead>
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Weight</TableHead>
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Date & Time</TableHead>
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Created By</TableHead>
                    <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Action</TableHead>
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
                      <TableCell className="text-center py-3">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
  );
}
