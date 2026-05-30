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
import { TransportLayout, useTransportFilters } from "@/components/transport-layout";
import { Link } from "wouter";
import {
  Plus,
  Trash2,
  Edit,
  Printer,
  Copy,
  Download,
} from "lucide-react";

interface EngineData {
  engineType: string;
  calculationType: string;
  opening: number;
  closing: number;
}

interface FuelData {
  _id?: string;
  id?: string;
  plant?: string;
  date: string;
  vehicleNo: string;
  driverName?: string;
  litres: number;
  takenFrom?: string;
  dieselRate?: number;
  amount: number;
  pumpOperator: string;
  engines?: EngineData[];
}

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
}

export default function DieselList() {
  const { toast } = useToast();
  const { showFilters } = useTransportFilters();
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";
  const [logs, setLogs] = useState<FuelData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("All Vehicle");

  // Pagination State
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
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

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedVehicle("All Vehicle");
    setCurrentPage(1);
  };

  // Helper date formatter: YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Active filters applied to logs
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (selectedVehicle !== "All Vehicle" && l.vehicleNo !== selectedVehicle) {
        return false;
      }
      if (fromDate) {
        const itemDate = new Date(l.date);
        const fDate = new Date(fromDate);
        if (itemDate < fDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(l.date);
        const tDate = new Date(toDate);
        if (itemDate > tDate) return false;
      }
      return true;
    });
  }, [logs, fromDate, toDate, selectedVehicle]);

  // Paginated records
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * entriesPerPage;
    return filtered.slice(startIdx, startIdx + entriesPerPage);
  }, [filtered, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;

  // Row actions logic
  const handleExportRow = (item: FuelData, index: number, type: "pdf" | "csv" | "copy") => {
    const sNo = index + 1;
    if (type === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const engineRows = item.engines && item.engines.length > 0 
        ? item.engines.map(eng => `
            <tr>
              <td style="padding: 8px; font-size: 11px;">${eng.engineType}</td>
              <td style="padding: 8px; font-size: 11px; text-align: center;">${eng.calculationType}</td>
              <td style="padding: 8px; font-size: 11px; text-align: right;">${eng.opening}</td>
              <td style="padding: 8px; font-size: 11px; text-align: right;">${eng.closing}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="4" style="padding: 8px; text-align: center; font-size: 11px; color: #94a3b8;">No Engine Reading Recorded</td></tr>`;

      const htmlContent = `
        <html>
          <head>
            <title>Diesel Receipt - Ref ${sNo}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; }
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00c0a5; padding-bottom: 20px; }
              .company-info h1 { margin: 0; font-size: 22px; font-weight: 900; color: #1e3a8a; }
              .company-info p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: bold; }
              .logo { height: 50px; width: 50px; }
              .title { text-align: center; font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 30px 0; color: #00c0a5; }
              .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 30px; }
              .info-group { display: flex; flex-direction: column; }
              .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
              .value { font-size: 12px; font-weight: 700; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f1f5f9; padding: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: left; border-bottom: 2px solid #cbd5e1; }
              td { border-bottom: 1px solid #e2e8f0; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="header">
              <div class="company-info">
                <h1>BUILD RMC CORPORATION</h1>
                <p>Plot No. 42, Ready Mix Compound, Industrial Zone</p>
                <p>Email: contact@buildrmc.in | Web: www.buildrmc.in</p>
              </div>
              <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="15" fill="#1e3a8a"/>
                <path d="M30 70V30H45C55 30 60 35 60 42C60 47 56 50 50 51C57 52 62 56 62 62C62 70 55 70 45 70H30ZM40 46H45C49 46 51 44 51 41C51 38 49 37 45 37H40V46ZM40 63H46C50 63 53 61 53 58C53 55 50 54 46 54H40V63Z" fill="#00c0a5"/>
              </svg>
            </div>
            <div class="title">Diesel Consumption Slip</div>
            <div class="grid-info">
              <div class="info-group"><span class="label">Vehicle No</span><span class="value">${item.vehicleNo}</span></div>
              <div class="info-group"><span class="label">Date</span><span class="value">${formatDate(item.date)}</span></div>
              <div class="info-group"><span class="label">Quantity Litres</span><span class="value">${item.litres} L</span></div>
              <div class="info-group"><span class="label">Added By</span><span class="value">${item.driverName || item.pumpOperator || "Super Admin"}</span></div>
              <div class="info-group"><span class="label">Taken From</span><span class="value">${item.takenFrom || "Stock"}</span></div>
              <div class="info-group"><span class="label">Plant</span><span class="value">${item.plant || "Fortune Concrete"}</span></div>
            </div>
            <h3>Engine Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Engine Type</th>
                  <th style="text-align: center;">Calculation Type</th>
                  <th style="text-align: right;">Opening</th>
                  <th style="text-align: right;">Closing</th>
                </tr>
              </thead>
              <tbody>
                ${engineRows}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else if (type === "csv") {
      const csvData = [
        ["Vehicle No", "Consumption Date", "Quantity (L)", "Added By", "Taken From", "Plant"].join(","),
        [`"${item.vehicleNo}"`, `"${formatDate(item.date)}"`, item.litres, `"${item.driverName || item.pumpOperator || "Super Admin"}"`, `"${item.takenFrom || "Stock"}"`, `"${item.plant || "Fortune Concrete"}"`].join(",")
      ].join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `diesel_log_${item.vehicleNo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    } else if (type === "copy") {
      const copyText = [
        ["Vehicle No", "Consumption Date", "Quantity (L)", "Added By", "Taken From", "Plant"].join("\t"),
        [item.vehicleNo, formatDate(item.date), item.litres, item.driverName || item.pumpOperator || "Super Admin", item.takenFrom || "Stock", item.plant || "Fortune Concrete"].join("\t")
      ].join("\n");
      navigator.clipboard.writeText(copyText);
      toast({ title: "Copied to Clipboard" });
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Diesel Consumption" }, { label: "Consumption List" }]}
      title="DIESEL CONSUMPTION LOGS"
      activePath="/transport/diesel/list"
    >
      <div className="w-full flex-1 flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden min-h-[calc(100vh-140px)]">
        
        {/* Advanced Filters Panel */}
        {showFilters && (
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4 shrink-0">
          <div className="space-y-1 w-44">
            <Label className="text-xs font-bold text-slate-700">From Date *</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 text-xs font-semibold bg-white border-slate-200 rounded focus:border-[#00c0a5] focus:ring-[#00c0a5]"
            />
          </div>

          <div className="space-y-1 w-44">
            <Label className="text-xs font-bold text-slate-700">To Date *</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 text-xs font-semibold bg-white border-slate-200 rounded focus:border-[#00c0a5] focus:ring-[#00c0a5]"
            />
          </div>

          <div className="space-y-1 w-52">
            <Label className="text-xs font-bold text-slate-700">Vehicle No *</Label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5] focus:ring-1 focus:ring-[#00c0a5]"
            >
              <option value="All Vehicle">All Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id || v._id} value={v.registrationNo}>
                  {v.registrationNo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={fetchLogs}
              className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-10 px-5 rounded border-none shadow-sm active:scale-95 transition-all"
            >
              Search
            </Button>
            <Button
              onClick={handleClearFilters}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-10 px-5 rounded border-none shadow-sm active:scale-95 transition-all"
            >
              Clear
            </Button>
            <Link href="/transport/diesel/new">
              <Button className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-10 px-5 rounded border-none shadow-sm active:scale-95 transition-all flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add Diesel Consumption
              </Button>
            </Link>
          </div>
        </div>
        )}

        {/* Entry page selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-650 font-bold select-none p-4 pb-0 bg-white">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>

        {/* Main List Table Container */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-[#1e40af] hover:bg-[#1e40af]">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle w-24`}>S/L No</TableHead>
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Vehicle No</TableHead>
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Consumption Date</TableHead>
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle text-right`}>Quantity</TableHead>
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Added By</TableHead>
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Taken From</TableHead>
                  <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Plant</TableHead>
                  <TableHead colSpan={4} className="bg-[#1e40af] text-white font-black py-1 px-2 text-center text-[9px] border-r border-white/10 uppercase tracking-tighter border-b border-white/10">Engine</TableHead>
                  <TableHead rowSpan={2} className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter align-middle w-[220px]">ACTION</TableHead>
                </TableRow>
                <TableRow className="border-0 hover:bg-transparent bg-[#1e40af]">
                  <TableHead className={headerStyle}>Engine Type</TableHead>
                  <TableHead className={headerStyle}>Type</TableHead>
                  <TableHead className={`${headerStyle} text-right`}>Opening</TableHead>
                  <TableHead className={`${headerStyle} text-right`}>Closing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                      Connecting to Diesel logs...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, idx) => (
                    <TableRow
                      key={item._id || item.id}
                      className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/10"
                      }`}
                    >
                      <TableCell className="font-bold text-slate-600 text-xs py-3 px-4">
                        {(currentPage - 1) * entriesPerPage + idx + 1}
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-700 text-xs px-3">
                        {item.vehicleNo}
                      </TableCell>
                      <TableCell className="font-bold text-slate-600 text-xs px-3">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="font-black text-slate-800 text-xs px-3 text-right">
                        {item.litres}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600 text-xs px-3">
                        {item.driverName || item.pumpOperator || "Super Admin"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600 text-xs px-3">
                        {item.takenFrom === "From Plant Stock" ? "Stock" : (item.takenFrom || "Stock")}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-650 text-xs px-3 font-bold uppercase">
                        {item.plant || "Fortune Concrete"}
                      </TableCell>

                      {/* Engine fields sub-grid span */}
                      <TableCell className="p-0" colSpan={4}>
                        {item.engines && item.engines.length > 0 ? (
                          item.engines.map((eng, eIdx) => (
                            <div
                              key={eIdx}
                              className={`grid grid-cols-4 text-xs font-semibold ${
                                eIdx > 0 ? "border-t border-slate-100" : ""
                              }`}
                            >
                              <div className="p-3 border-r border-slate-100 text-slate-650 font-bold">{eng.engineType}</div>
                              <div className="p-3 border-r border-slate-100 text-slate-500">{eng.calculationType}</div>
                              <div className="p-3 border-r border-slate-100 text-slate-700 text-right">{eng.opening}</div>
                              <div className="p-3 text-slate-700 text-right">{eng.closing}</div>
                            </div>
                          ))
                        ) : (
                          <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 p-3 text-center">
                            <div className="col-span-4">N/A</div>
                          </div>
                        )}
                      </TableCell>

                      {/* ACTION Column with exact PDF, Copy, CSV, Edit, Delete */}
                      <TableCell className="px-4 text-center">
                        <div className="flex items-center justify-center gap-1 select-none">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportRow(item, idx, "pdf")}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                            title="Print PDF"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportRow(item, idx, "copy")}
                            className="h-7 w-7 text-cyan-600 hover:bg-cyan-50 rounded border border-cyan-200"
                            title="Copy TSV"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportRow(item, idx, "csv")}
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200"
                            title="Download CSV"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/transport/diesel/edit/${item.id || item._id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item._id || item.id!)}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dynamic Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-white select-none shrink-0">
          <div className="text-xs font-bold text-slate-500 uppercase">
            Showing {filtered.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, filtered.length)} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="h-8 text-xs font-bold border-slate-200 text-slate-650 hover:bg-slate-50"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 text-xs font-bold ${
                    currentPage === pageNum
                      ? "bg-[#00c0a5] hover:bg-[#00a890] text-white border-none"
                      : "border-slate-200 text-slate-650 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="h-8 text-xs font-bold border-slate-200 text-slate-650 hover:bg-slate-50"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}
