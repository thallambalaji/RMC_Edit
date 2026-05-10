import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetSchedules,
  useGetCustomers,
  useDeleteSchedule,
  getGetSchedulesQueryKey,
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
  ChevronRight,
  Loader2,
  Search,
  RotateCcw,
  Trash2,
  CalendarClock,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, parseISO, parse } from "date-fns";

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
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("all");
  const [filterPlant, setFilterPlant] = useState("all");
  const [searchText, setSearchText] = useState("");

  const { data: schedules, isLoading } = useGetSchedules();
  const { data: customers } = useGetCustomers();
  const { mutate: deleteSchedule } = useDeleteSchedule();

  const today = new Date();

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
  }, [schedules, activeTab]);

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

  const handlePrintPDF = () => {
    if (!filtered.length) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    window.print();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this schedule?")) return;
    deleteSchedule(id, {
      onSuccess: () => toast({ title: "Schedule deleted successfully" }),
      onError: () => toast({ title: "Failed to delete schedule", variant: "destructive" }),
    });
  };

  const formatTime = (str?: string) => {
    if (!str) return "—";
    try { return new Date(str).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }); }
    catch { return str; }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
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
      <div className="flex justify-start">
        <Link href="/customer-po/scheduling/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-9">
            <Plus className="h-4 w-4" />
            Add New Scheduling
          </Button>
        </Link>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${tab.color} text-white px-4 py-2 rounded-sm h-14 flex flex-col items-center justify-center min-w-[130px] transition-all
              ${activeTab === tab.id ? "ring-2 ring-offset-1 ring-cyan-400 scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="font-bold text-xs leading-tight">{tab.label}</span>
            <span className="text-lg font-black leading-tight">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 border-gray-300" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 border-gray-300" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Customer</Label>
            <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
              <SelectTrigger className="h-9 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Plant</Label>
            <Select value={filterPlant} onValueChange={setFilterPlant}>
              <SelectTrigger className="h-9 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plant</SelectItem>
                <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                <SelectItem value="Plant B">Plant B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Search</Label>
            <Input
              placeholder="Customer / PO / Pump"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9 border-gray-300"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              type="button"
              className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white h-9 flex-1 font-bold text-sm"
            >
              <Search className="h-3.5 w-3.5 mr-1" /> Search
            </Button>
            <Button
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white h-9 flex-1 font-bold text-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-20 h-8 border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handleCopy}>Copy</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handleExportCSV}>CSV</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handlePrintPDF}>PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
              <p className="text-sm text-gray-500">Loading schedules...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  {["#", "Customer", "PO Number", "Plant", "Start Time", "End Time", "Pump 1", "Pump 2", "Strict", "Status", "Action"].map((h) => (
                    <TableHead key={h} className="text-gray-700 font-bold text-xs py-3 px-3 text-center whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-gray-400 italic">
                      No scheduling records found
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s, i) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/60 border-b border-gray-100">
                    <TableCell className="text-center text-xs px-3 py-2">{i + 1}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2 font-medium">{s.customerName ?? "—"}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2 font-semibold text-[#1e40af]">{s.poNumber ?? "—"}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2">{s.plant}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2 whitespace-nowrap">{formatTime(s.fromTime)}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2 whitespace-nowrap">{formatTime(s.toTime)}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2">{s.pump1}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2">{s.pump2 && s.pump2 !== "none" ? s.pump2 : "—"}</TableCell>
                    <TableCell className="text-center text-xs px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isStrict ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.isStrict ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs px-3 py-2">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                        {s.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-gray-300 hover:text-rose-500 transition-colors"
                        title="Delete schedule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing {filtered.length > 0 ? 1 : 0} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-gray-400" disabled>Previous</Button>
            <div className="bg-[#1e40af] text-white h-8 w-8 flex items-center justify-center rounded text-xs font-bold">1</div>
            <Button variant="outline" size="sm" className="h-8 text-gray-600">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
