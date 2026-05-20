import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Link } from "wouter";
import {
  Plus,
  Search,
  RotateCcw,
  Copy,
  FileCode,
  FileText,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface SecurityData {
  _id?: string;
  id?: string;
  date: string;
  time: string;
  vehicleNo: string;
  driverName: string;
  gatePassNo: string;
  checkType: string;
  status: string;
}

export default function SecurityCheckList() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchReg, setSearchReg] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security-checks");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this log?")) return;
    try {
      const res = await fetch(`/api/security-checks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Log Removed",
          description: "Security check removed successfully.",
        });
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (type: "copy" | "csv" | "pdf") => {
    if (logs.length === 0) return;
    const csvContent = [
      ["Date", "Time", "Vehicle No", "Driver", "Gate Pass", "Type", "Status"].join(","),
      ...logs.map((l) => [l.date, l.time, l.vehicleNo, l.driverName, l.gatePassNo, l.checkType, l.status].join(",")),
    ].join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied to Clipboard" });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "security_check_logs.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    } else if (type === "pdf") {
      window.print();
    }
  };

  const filtered = useMemo(() => {
    return logs.filter((l) =>
      l.vehicleNo.toLowerCase().includes(searchReg.toLowerCase())
    );
  }, [logs, searchReg]);

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Security" }, { label: "Security Check List" }]}
      title="SECURITY GATE PASS CHECK LOGS"
      activePath="/transport/security/list"
    >
      <Card className="border shadow-sm bg-white flex-1 flex flex-col overflow-hidden">
        {/* Filters Panel */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4 shrink-0">
          <div className="space-y-1.5 min-w-[250px] flex-1">
            <Label className="text-xs font-black uppercase text-slate-700">Search Vehicle Registration</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={searchReg}
                onChange={(e) => setSearchReg(e.target.value)}
                placeholder="Enter Registration No"
                className="pl-9 h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/transport/security/new">
              <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black px-6 h-10 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" /> Log Gate Check
              </Button>
            </Link>
            <Button
              onClick={() => setSearchReg("")}
              variant="outline"
              className="h-10 w-10 p-0 border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/20 shrink-0">
          <div className="text-xs font-bold text-slate-500 uppercase">
            Showing {filtered.length} of {logs.length} check logs
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("copy")}
              className="h-8 text-xs font-bold bg-slate-500 hover:bg-slate-600 text-white border-none shadow-sm"
            >
              <Copy className="h-3 w-3 mr-1.5" /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="h-8 text-xs font-bold bg-slate-600 hover:bg-slate-700 text-white border-none shadow-sm"
            >
              <FileCode className="h-3 w-3 mr-1.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              className="h-8 text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white border-none shadow-sm"
            >
              <FileText className="h-3 w-3 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4">Check Date & Time</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle No</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Driver Name</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Gate Pass No</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-center">Type</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-center">Status</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Connecting to Security logs database...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No security check records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow
                    key={item._id || item.id}
                    className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                    }`}
                  >
                    <TableCell className="font-bold text-slate-600 text-xs py-3 px-4">
                      {item.date} at {item.time}
                    </TableCell>
                    <TableCell className="font-extrabold text-[#1e40af] text-xs px-3">{item.vehicleNo}</TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3">{item.driverName}</TableCell>
                    <TableCell className="font-black text-slate-800 text-xs px-3 uppercase">{item.gatePassNo}</TableCell>
                    <TableCell className="text-xs px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.checkType === "In"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        }`}
                      >
                        {item.checkType === "In" ? "Gate Entry (IN)" : "Gate Exit (OUT)"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === "verified"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : item.status === "hold"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item._id || item.id!)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </TransportLayout>
  );
}
