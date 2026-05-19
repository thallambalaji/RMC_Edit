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
  Flame,
} from "lucide-react";

interface FuelData {
  _id?: string;
  id?: string;
  date: string;
  vehicleNo: string;
  litres: number;
  amount: number;
  pumpOperator: string;
}

export default function DieselList() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchReg, setSearchReg] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diesel-consumptions");
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
    if (!confirm("Are you sure you want to delete this fuel log?")) return;
    try {
      const res = await fetch(`/api/diesel-consumptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Log Deleted",
          description: "Fuel record deleted successfully.",
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
      ["Date", "Vehicle No", "Litres", "Amount (Rs)", "Operator"].join(","),
      ...logs.map((l) => [l.date, l.vehicleNo, l.litres, l.amount, l.pumpOperator].join(",")),
    ].join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied to Clipboard" });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "diesel_consumption_list.csv");
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
      breadcrumbs={[{ label: "Diesel Consumption" }, { label: "Consumption List" }]}
      title="DIESEL CONSUMPTION LOGS"
      activePath="/transport/diesel/list"
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
            <Link href="/transport/diesel/new">
              <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black px-6 h-10 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" /> Log Fuel Consumption
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
            Showing {filtered.length} of {logs.length} consumption logs
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
                <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4">Fueling Date</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle No</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">Quantity (Ltrs)</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">Amount (₹)</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Operator / Approved By</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Connecting to Fuel database...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No consumption logs found.
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
                    <TableCell className="font-bold text-slate-600 text-xs py-3 px-4">{item.date}</TableCell>
                    <TableCell className="font-extrabold text-[#1e40af] text-xs px-3">{item.vehicleNo}</TableCell>
                    <TableCell className="font-black text-slate-800 text-xs px-3 text-right">{item.litres.toFixed(2)} L</TableCell>
                    <TableCell className="font-black text-emerald-600 text-xs px-3 text-right">₹ {item.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3">{item.pumpOperator}</TableCell>
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
