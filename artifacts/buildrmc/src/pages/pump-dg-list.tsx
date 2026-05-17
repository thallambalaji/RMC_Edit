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
  Zap,
} from "lucide-react";

interface PumpDGData {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  capacity: string;
  status: string;
}

export default function PumpDgList() {
  const { toast } = useToast();
  const [items, setItems] = useState<PumpDGData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pump-dgs");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this equipment?")) return;
    try {
      const res = await fetch(`/api/pump-dgs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Asset Removed",
          description: "Asset deleted successfully from database.",
        });
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (type: "copy" | "csv" | "pdf") => {
    if (items.length === 0) return;
    const csvContent = [
      ["Asset Name", "Type", "Capacity", "Status"].join(","),
      ...items.map((i) => [i.name, i.type, i.capacity, i.status].join(",")),
    ].join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied to Clipboard" });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "pump_dg_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    } else if (type === "pdf") {
      window.print();
    }
  };

  const filtered = useMemo(() => {
    return items.filter((i) =>
      i.name.toLowerCase().includes(searchName.toLowerCase())
    );
  }, [items, searchName]);

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Pump&DG" }, { label: "Pump & DG List" }]}
      title="PUMP & DG ASSETS LIST"
      activePath="/transport/pump-dg/list"
    >
      <Card className="border shadow-sm bg-white flex-1 flex flex-col overflow-hidden">
        {/* Filters Panel */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4 shrink-0">
          <div className="space-y-1.5 min-w-[250px] flex-1">
            <Label className="text-xs font-black uppercase text-slate-700">Search Equipment Name / Code</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter Asset Name / Code"
                className="pl-9 h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/transport/pump-dg/new">
              <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black px-6 h-10 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" /> Add Pump & DG
              </Button>
            </Link>
            <Button
              onClick={() => setSearchName("")}
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
            Showing {filtered.length} of {items.length} registered assets
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
                <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4">Equipment Name / Code</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Equipment Type</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Capacity</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-center">Status</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Connecting to Assets database...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No assets found.
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
                    <TableCell className="font-extrabold text-[#1e40af] text-xs py-3 px-4 flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      {item.name}
                    </TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3">
                      {item.type === "Pump" ? "Concrete Pump" : "DG Generator"}
                    </TableCell>
                    <TableCell className="font-black text-slate-800 text-xs px-3">{item.capacity}</TableCell>
                    <TableCell className="text-xs px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : item.status === "idle"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
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
