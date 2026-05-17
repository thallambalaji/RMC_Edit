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
  User,
} from "lucide-react";

interface DriverData {
  _id?: string;
  id?: string;
  name: string;
  licenseNo: string;
  phone: string;
  status: string;
}

export default function DriverList() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drivers");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this driver?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Driver Removed",
          description: "Driver removed successfully from database.",
        });
        fetchDrivers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (type: "copy" | "csv" | "pdf") => {
    if (drivers.length === 0) return;
    const csvContent = [
      ["Driver Name", "License No", "Phone", "Status"].join(","),
      ...drivers.map((d) => [d.name, d.licenseNo, d.phone, d.status].join(",")),
    ].join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied to Clipboard", description: "Driver list copied." });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "driver_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    } else if (type === "pdf") {
      window.print();
    }
  };

  const filtered = useMemo(() => {
    return drivers.filter((d) =>
      d.name.toLowerCase().includes(searchName.toLowerCase())
    );
  }, [drivers, searchName]);

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Driver" }, { label: "Driver List" }]}
      title="REGISTERED DRIVERS LIST"
      activePath="/transport/driver/list"
    >
      <Card className="border shadow-sm bg-white flex-1 flex flex-col overflow-hidden">
        {/* Filters Panel */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4 shrink-0">
          <div className="space-y-1.5 min-w-[250px] flex-1">
            <Label className="text-xs font-black uppercase text-slate-700">Search Driver Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter Driver Name"
                className="pl-9 h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/transport/driver/new">
              <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black px-6 h-10 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" /> Add Driver
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
            Showing {filtered.length} of {drivers.length} registered drivers
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
                <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4">Driver Name</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">License Number</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Phone Number</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-center">Duty Status</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Connecting to Drivers database...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No registered drivers found.
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
                      <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      {item.name}
                    </TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3 uppercase">{item.licenseNo}</TableCell>
                    <TableCell className="font-black text-slate-800 text-xs px-3">{item.phone}</TableCell>
                    <TableCell className="text-xs px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : item.status === "on-leave"
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
