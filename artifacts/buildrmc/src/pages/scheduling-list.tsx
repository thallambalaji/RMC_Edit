import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetSchedules,
  useGetCustomers,
  useDeleteSchedule,
  useUpdateSchedule,
  getSchedulesQueryKey,
} from "@workspace/api-client-react";
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
import {
  ChevronRight,
  Loader2,
  Search,
  RotateCcw,
  Trash2,
  CalendarClock,
  Plus,
  MoreHorizontal,
  Printer,
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, parseISO, parse, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

type TabId = "today" | "today-gen" | "tomorrow" | "this-week" | "next-week" | "new";

function isSameDay(dateStr: string, target: Date) {
  try {
    const d = new Date(dateStr);
    const t = new Date(target);
    return (
      d.getDate() === t.getDate() &&
      d.getMonth() === t.getMonth() &&
      d.getFullYear() === t.getFullYear()
    );
  } catch { return false; }
}

function isTomorrow(dateStr: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(dateStr, tomorrow);
}

function isThisWeek(dateStr: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  try {
    const d = new Date(dateStr);
    return d >= startOfWeek && d <= endOfWeek;
  } catch { return false; }
}

function isNextWeek(dateStr: string) {
  const now = new Date();
  const startOfNextWeek = new Date(now);
  startOfNextWeek.setDate(now.getDate() - now.getDay() + 7);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  try {
    const d = new Date(dateStr);
    return d >= startOfNextWeek && d <= endOfNextWeek;
  } catch { return false; }
}

export default function SchedulingList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("all");
  const [filterPlant, setFilterPlant] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Print layout tracking state
  const [printSchedule, setPrintSchedule] = useState<any | null>(null);

  const { data: schedules, isLoading } = useGetSchedules();
  const { data: customers } = useGetCustomers();

  // Hook up update mutation
  const { mutate: updateSchedule } = useUpdateSchedule({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status Updated! ✅", description: "The scheduling status has been updated in database." });
        queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.message || "Failed to modify scheduling status.", variant: "destructive" });
      }
    }
  });

  const handleToggleStatus = (sch: any) => {
    const nextStatus = sch.status === "completed" ? "scheduled" : "completed";
    updateSchedule({
      id: sch.id,
      data: { status: nextStatus }
    });
  };

  const { mutate: deleteSchedule } = useDeleteSchedule();

  const today = useMemo(() => new Date(), []);

  // Count per tab
  const counts = useMemo(() => {
    if (!schedules) return { today: 0, "today-gen": 0, tomorrow: 0, "this-week": 0, "next-week": 0, new: 0 };
    return {
      today: schedules.filter((s) => isSameDay(s.fromTime, today)).length,
      "today-gen": schedules.filter((s) => isSameDay(s.createdAt || s.fromTime, today)).length,
      tomorrow: schedules.filter((s) => isTomorrow(s.fromTime)).length,
      "this-week": schedules.filter((s) => isThisWeek(s.fromTime)).length,
      "next-week": schedules.filter((s) => isNextWeek(s.fromTime)).length,
      new: schedules.filter((s) => s.status === "scheduled").length,
    };
  }, [schedules, today]);

  const tabs: { id: TabId; label: string; color: string }[] = [
    { id: "today", label: "Today Scheduled", color: "bg-[#1e40af] hover:bg-[#1d4ed8]" },
    { id: "today-gen", label: "Today Generated", color: "bg-[#1e40af] hover:bg-[#1d4ed8]" },
    { id: "tomorrow", label: "Tomorrow Scheduled", color: "bg-[#1e40af] hover:bg-[#1d4ed8]" },
    { id: "this-week", label: "This Week Scheduled", color: "bg-[#1e40af] hover:bg-[#1d4ed8]" },
    { id: "next-week", label: "Next Week Scheduled", color: "bg-[#1e40af] hover:bg-[#1d4ed8]" },
    { id: "new", label: "New Scheduling", color: "bg-emerald-500 hover:bg-emerald-600" },
  ];

  // Filter by active tab
  const tabFiltered = useMemo(() => {
    if (!schedules) return [];
    switch (activeTab) {
      case "today":     return schedules.filter((s) => isSameDay(s.fromTime, today));
      case "today-gen": return schedules.filter((s) => isSameDay(s.createdAt || s.fromTime, today));
      case "tomorrow":  return schedules.filter((s) => isTomorrow(s.fromTime));
      case "this-week": return schedules.filter((s) => isThisWeek(s.fromTime));
      case "next-week": return schedules.filter((s) => isNextWeek(s.fromTime));
      case "new":       return schedules.filter((s) => s.status === "scheduled");
      default:          return schedules;
    }
  }, [schedules, activeTab, today]);

  // Apply additional filters
  const filtered = useMemo(() => {
    return tabFiltered.filter((s) => {
      const matchesCustomer =
        filterCustomerId === "all" || s.customerId === filterCustomerId;
      const matchesPlant =
        filterPlant === "all" || s.plant === filterPlant;
      const matchesSearch =
        !searchText ||
        (s.customerName ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
        (s.poNumber ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
        s.pump1.toLowerCase().includes(searchText.toLowerCase());

      let matchesDate = true;
      if (fromDate && toDate) {
        try {
          const d = new Date(s.fromTime);
          matchesDate = isWithinInterval(d, {
            start: parseISO(fromDate),
            end: parseISO(toDate),
          });
        } catch { matchesDate = true; }
      }

      return matchesCustomer && matchesPlant && matchesSearch && matchesDate;
    });
  }, [tabFiltered, filterCustomerId, filterPlant, searchText, fromDate, toDate]);

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setFilterCustomerId("all");
    setFilterPlant("all");
    setSearchText("");
    toast({ title: "Filters Cleared" });
  };

  const handleCopy = () => {
    if (!filtered.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Customer", "PO Number", "Plant", "Start Time", "End Time", "Pump 1", "Status"];
    const rows = filtered.map(s => [
      s.customerName || "—",
      s.poNumber || "—",
      s.plant,
      formatTime(s.fromTime),
      formatTime(s.toTime),
      s.pump1,
      s.status
    ]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: "Table data has been copied to your clipboard." });
  };

  const handleCopySingle = (s: any) => {
    const text = `Customer: ${s.customerName || "—"}\nPO Number: ${s.poNumber || "—"}\nPlant: ${s.plant}\nTime: ${formatTime(s.fromTime)} - ${formatTime(s.toTime)}\nPumps: ${s.pump1}${s.pump2 ? ', ' + s.pump2 : ''}\nStatus: ${s.status}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Details Copied", description: "This schedule's details have been copied." });
  };

  const handleExportCSV = () => {
    if (!filtered.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Customer", "PO Number", "Plant", "Start Time", "End Time", "Pump 1", "Status"];
    const rows = filtered.map(s => [
      `"${s.customerName || "—"}"`,
      `"${s.poNumber || "—"}"`,
      `"${s.plant}"`,
      `"${formatTime(s.fromTime)}"`,
      `"${formatTime(s.toTime)}"`,
      `"${s.pump1}"`,
      `"${s.status}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scheduling_export_${format(new Date(), "dd_MM_yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Scheduling list has been downloaded as CSV." });
  };

  const handleExportCSVSingle = (s: any) => {
    const headers = ["Customer", "PO Number", "Plant", "Start Time", "End Time", "Pump 1", "Pump 2", "Strict", "Status"];
    const row = [
      `"${s.customerName || "—"}"`,
      `"${s.poNumber || "—"}"`,
      `"${s.plant}"`,
      `"${formatTime(s.fromTime)}"`,
      `"${formatTime(s.toTime)}"`,
      `"${s.pump1}"`,
      `"${s.pump2 || '—'}"`,
      `"${s.isStrict ? 'Yes' : 'No'}"`,
      `"${s.status}"`
    ];
    const csvContent = [headers, row].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `schedule_${s.poNumber || s.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: `Schedule report generated.` });
  };

  const handlePrintPDF = () => {
    if (!filtered.length) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    setPrintSchedule(null); // Print master listing
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (s: any) => {
    setPrintSchedule(s);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this Scheduling item?")) return;
    deleteSchedule(id, {
      onSuccess: () => {
        toast({ title: "Deleted Successfully", description: "The schedule has been permanently removed." });
        queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      },
      onError: () => toast({ title: "Deletion Failed", description: "Failed to remove schedule from MongoDB.", variant: "destructive" }),
    });
  };

  const formatTime = (str?: string) => {
    if (!str) return "—";
    try { return new Date(str).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }); }
    catch { return str; }
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-8 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-2 bg-white";

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

      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
        <div className="bg-[#1e40af]/10 p-1 rounded">
           <CalendarClock className="h-4 w-4 text-[#1e40af]" />
        </div>
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Scheduling Management List</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/customer-po" className="hover:text-[#1e40af] transition-colors">Customer & PO</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Scheduling List</span>
        </nav>
      </div>

      {/* Add button */}
      <div className="flex justify-start no-print">
        <Link href="/customer-po/scheduling/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 h-8 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-none">
            <Plus className="h-3.5 w-3.5" />
            Add New Scheduling
          </Button>
        </Link>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1 no-print">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${tab.color} text-white px-3 py-1.5 rounded h-12 flex flex-col items-center justify-center min-w-[125px] transition-all cursor-pointer
              ${activeTab === tab.id ? "ring-2 ring-offset-1 ring-cyan-400 scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="font-bold text-[10px] uppercase tracking-wider leading-tight">{tab.label}</span>
            <span className="text-sm font-black leading-tight mt-0.5">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Filter bar - Corrected to use a perfect 12-column grid to align Search/Clear */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
          
          <div className="lg:col-span-2">
            <Label className={labelStyle}>From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputStyle} />
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputStyle} />
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>Customer</Label>
            <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
              <SelectTrigger className="h-8 text-[10px] border-gray-200 rounded font-bold px-2 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">All Customer</SelectItem>
                {customers?.map((c) => <SelectItem key={c.id} value={String(c.id)} className="text-[10px] font-bold">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>Plant</Label>
            <Select value={filterPlant} onValueChange={setFilterPlant}>
              <SelectTrigger className="h-8 text-[10px] border-gray-200 rounded font-bold px-2 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">All Plant</SelectItem>
                <SelectItem value="FORTUNE CONCRETE" className="text-[10px] font-bold">FORTUNE CONCRETE</SelectItem>
                <SelectItem value="Plant B" className="text-[10px] font-bold">Plant B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>Search</Label>
            <Input
              placeholder="Customer / PO / Pump"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* Symmetrical Search and Clear action buttons: Clean, aligned, beautifully formatted */}
          <div className="lg:col-span-2 flex gap-1.5 h-8">
            <Button 
              type="button"
              className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-[10px] font-black uppercase tracking-wider flex-1 h-full px-1 flex items-center justify-center gap-1 shadow-none border-0 cursor-pointer"
            >
              <Search className="h-3 w-3" /> Search
            </Button>
            <Button
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex-1 h-full px-1 flex items-center justify-center gap-1 shadow-none border-0 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-16 h-8 bg-white border-gray-200 text-[10px] font-bold"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-7 text-[10px] font-bold px-3 cursor-pointer uppercase tracking-wider" onClick={handleCopy}>Copy</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-7 text-[10px] font-bold px-3 cursor-pointer uppercase tracking-wider" onClick={handleExportCSV}>CSV</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-7 text-[10px] font-bold px-3 cursor-pointer uppercase tracking-wider" onClick={handlePrintPDF}>PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading schedules...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e40af] hover:bg-[#1e40af]">
                  <TableHead className="text-white font-bold py-3 px-2 text-center border-r border-white/10 text-[10px] uppercase">S/L<br/>No</TableHead>
                  <TableHead className="text-white font-bold px-2 text-left border-r border-white/10 text-[10px] uppercase">Customer</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">PO Number</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Plant</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Start Time</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">End Time</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Pump 1</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Pump 2</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Strict</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">STATUS</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center text-[10px] uppercase">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px]">
                      No scheduling records found
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s, i) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/60 border-b border-gray-100">
                    <TableCell className="text-center text-[10px] font-bold border-r border-gray-100 py-2">{i + 1}</TableCell>
                    <TableCell className="text-left text-[10px] font-bold border-r border-gray-100 py-2 max-w-[180px] truncate">{s.customerName ?? "—"}</TableCell>
                    <TableCell className="text-center text-[10px] font-black text-[#1e40af] border-r border-gray-100 py-2">{s.poNumber ?? "—"}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 py-2">{s.plant}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100 py-2 font-bold">{formatTime(s.fromTime)}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100 py-2 font-bold">{formatTime(s.toTime)}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 py-2 font-semibold text-gray-600">{s.pump1}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 py-2">{s.pump2 && s.pump2 !== "none" ? s.pump2 : "—"}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 py-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.isStrict ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-500 border"}`}>
                        {s.isStrict ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    
                    {/* Live interactive toggle badge */}
                    <TableCell className="text-center border-r border-gray-100 py-2">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer hover:opacity-80 border ${
                          s.status === 'completed' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-cyan-50 text-cyan-600 border-cyan-100"
                        }`}
                        title="Click to toggle status"
                      >
                        {s.status}
                      </button>
                    </TableCell>

                    <TableCell className="text-center py-2">
                      {/* Fully updated Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white font-bold text-xs p-1">
                          
                          <DropdownMenuItem onClick={() => handleToggleStatus(s)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                            {s.status === 'completed' ? (
                              <>
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                <span>Mark Scheduled</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Mark Completed</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <div className="h-px bg-slate-100 my-1" />

                          <DropdownMenuItem onClick={() => handlePrintSingle(s)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                            <Printer className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Print PDF</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleExportCSVSingle(s)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Export CSV</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleCopySingle(s)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                            <Copy className="h-3.5 w-3.5 text-cyan-500" />
                            <span>Copy Details</span>
                          </DropdownMenuItem>

                          <div className="h-px bg-slate-100 my-1" />

                          <DropdownMenuItem onClick={() => handleDelete(s.id)} className="flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer rounded">
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            <span>Delete Schedule</span>
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

        {/* Pagination footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100 no-print">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Showing {filtered.length > 0 ? 1 : 0} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-gray-400" disabled>Previous</Button>
            <div className="bg-[#1e40af] text-white h-8 w-8 flex items-center justify-center rounded text-xs font-bold">1</div>
            <Button variant="outline" size="sm" className="h-8 text-gray-600">Next</Button>
          </div>
        </div>
      </div>

      {/* DUAL RENDER PRINTS */}

      {/* Print Option A: Branded Single Scheduling Docket */}
      {printSchedule && (
        <div className="print-sheet hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          {/* Company details banner */}
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#1e40af] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#1e40af] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1 font-sans">SCHEDULING DOCKET</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">GSTIN: 36AAAAF1234A1Z0</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Docket Allocations</h3>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-700">Client Customer: <span className="font-black text-gray-900">{printSchedule.customerName}</span></p>
                <p className="text-xs font-bold text-gray-700">Associated PO: <span className="font-black text-[#1e40af]">{printSchedule.poNumber || "N/A"}</span></p>
                <p className="text-xs font-bold text-gray-700">Production Plant: <span className="font-medium text-gray-900">{printSchedule.plant}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Transit & Logistics</h3>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-700">Primary Dispatch Pump: <span className="font-black text-gray-900">{printSchedule.pump1}</span></p>
                <p className="text-xs font-bold text-gray-700">Secondary Pump: <span className="font-medium text-gray-900">{printSchedule.pump2 && printSchedule.pump2 !== "none" ? printSchedule.pump2 : "None Allocated"}</span></p>
                <p className="text-xs font-bold text-gray-700">Strict Schedule Window: <span className="font-bold text-indigo-700 uppercase">{printSchedule.isStrict ? "Strict Window active" : "Flexible Window"}</span></p>
              </div>
            </div>
          </div>

          <div className="border rounded p-4 mb-6">
            <h3 className="font-bold text-gray-700 text-xs uppercase mb-3 border-b pb-1.5">Scheduled Delivery Window</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase text-[9px]">Start Delivery</p>
                <p className="text-base font-black text-gray-900 mt-1">{formatTime(printSchedule.fromTime)}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase text-[9px]">End Delivery Target</p>
                <p className="text-base font-black text-gray-900 mt-1">{formatTime(printSchedule.toTime)}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-start text-xs text-gray-500">
            <div className="max-w-md">
              <p className="font-bold uppercase text-gray-700 mb-1">Logistics Note:</p>
              <p>Our fleet will depart the facility exactly 30 minutes prior to the start delivery target. Any adjustments to start times must be updated in our dispatch portal at least 4 hours in advance.</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-400 uppercase text-[9px]">Current Docket Status</p>
              <p className="text-lg font-black text-emerald-600 uppercase mt-1">{printSchedule.status}</p>
            </div>
          </div>

          <div className="flex justify-between items-end mt-20 text-xs">
            <div>
              <div className="h-px bg-gray-300 w-44 mb-2" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Site Engineer Signature</p>
            </div>
            <div className="text-right">
              <div className="h-px bg-gray-300 w-44 mb-2 ml-auto" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Authorized Dispatch Officer</p>
              <p className="font-black text-[#1e40af] uppercase mt-1">Fortune Concrete</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Option B: Full Landscape Daily Register */}
      {!printSchedule && (
        <div className="print-sheet hidden print:block bg-white p-6 text-black w-full">
          <div className="border-b-2 border-gray-800 pb-4 mb-4">
            <h1 className="text-2xl font-black text-[#1e40af] uppercase tracking-tight">FORTUNE CONCRETE</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Premium Ready Mix Concrete Solutions</p>
            <p className="text-[9px] text-gray-400">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            <div className="mt-3 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">DAILY SCHEDULING REGISTER</h2>
              <p className="text-xs font-bold text-gray-600">Printed Date: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>

          <table className="w-full border-collapse border text-[10px] text-left">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase text-gray-800">
                <th className="border p-2 text-center">S/No</th>
                <th className="border p-2">Customer Name</th>
                <th className="border p-2 text-center">PO Number</th>
                <th className="border p-2">Plant</th>
                <th className="border p-2 text-center">Start Time</th>
                <th className="border p-2 text-center">End Time</th>
                <th className="border p-2 text-center">Pump 1</th>
                <th className="border p-2 text-center">Pump 2</th>
                <th className="border p-2 text-center">Strict?</th>
                <th className="border p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border p-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border p-2 font-bold">{s.customerName ?? "—"}</td>
                  <td className="border p-2 text-center font-bold text-indigo-700">{s.poNumber ?? "—"}</td>
                  <td className="border p-2">{s.plant}</td>
                  <td className="border p-2 text-center">{formatTime(s.fromTime)}</td>
                  <td className="border p-2 text-center">{formatTime(s.toTime)}</td>
                  <td className="border p-2 text-center font-semibold">{s.pump1}</td>
                  <td className="border p-2 text-center">{s.pump2 && s.pump2 !== "none" ? s.pump2 : "—"}</td>
                  <td className="border p-2 text-center uppercase">{s.isStrict ? "Yes" : "No"}</td>
                  <td className="border p-2 text-center uppercase font-bold text-emerald-600">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
