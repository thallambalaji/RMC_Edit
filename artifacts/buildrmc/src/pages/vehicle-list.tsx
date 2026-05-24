import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
import { Plus, Trash2, Edit, Printer, Copy, Download } from "lucide-react";

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
  model: string;
  capacity?: number;
  status?: string;
  driverName?: string;
  vehicleType?: string;
  vehicleCategory?: string;
  transporter?: string;
}

export default function VehicleList() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { showFilters } = useTransportFilters();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vehicle?")) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Vehicle Deleted",
          description: "Vehicle removed successfully.",
        });
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (v: VehicleData) => {
    const id = v._id || v.id;
    if (id) {
      setLocation(`/transport/vehicle/edit/${id}`);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return vehicles.filter((v) =>
      v.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vehicles, searchQuery]);

  // Paginated List
  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Individual Row Actions logic
  const handleExportRow = (item: VehicleData, index: number, type: "pdf" | "csv" | "copy") => {
    const sNo = index + 1;
    if (type === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const htmlContent = `
        <html>
          <head>
            <title>Vehicle Card - ${item.registrationNo}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; }
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00c0a5; padding-bottom: 20px; }
              .company-info h1 { margin: 0; font-size: 22px; font-weight: 900; color: #1e3a8a; }
              .company-info p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: bold; }
              .logo { height: 50px; width: 50px; }
              .title { text-align: center; font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 30px 0; color: #00c0a5; }
              .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
              .info-group { display: flex; flex-direction: column; }
              .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
              .value { font-size: 12px; font-weight: 700; color: #0f172a; }
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
            <div class="title">Vehicle Fleet Identification</div>
            <div class="grid-info">
              <div class="info-group"><span class="label">S.No</span><span class="value">${sNo}</span></div>
              <div class="info-group"><span class="label">Vehicle No</span><span class="value">${item.registrationNo}</span></div>
              <div class="info-group"><span class="label">Vehicle Name</span><span class="value">${item.model}</span></div>
              <div class="info-group"><span class="label">Transporter Name</span><span class="value">${item.transporter || "N/A"}</span></div>
              <div class="info-group"><span class="label">Vehicle Type</span><span class="value">${item.vehicleType || "own"}</span></div>
              <div class="info-group"><span class="label">Vehicle Category</span><span class="value">${item.vehicleCategory || "km"}</span></div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else if (type === "csv") {
      const csvData = [
        ["S.No", "Vehicle No", "Vehicle Name", "Transporter Name", "Vehicle Type", "Vehicle Category"].join(","),
        [sNo, `"${item.registrationNo}"`, `"${item.model}"`, `"${item.transporter || "N/A"}"`, `"${item.vehicleType || "own"}"`, `"${item.vehicleCategory || "km"}"`].join(",")
      ].join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `vehicle_${item.registrationNo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    } else if (type === "copy") {
      const tsvContent = [
        ["S.No", "Vehicle No", "Vehicle Name", "Transporter Name", "Vehicle Type", "Vehicle Category"].join("\t"),
        [sNo, item.registrationNo, item.model, item.transporter || "N/A", item.vehicleType || "own", item.vehicleCategory || "km"].join("\t")
      ].join("\n");
      navigator.clipboard.writeText(tsvContent);
      toast({ title: "Copied to Clipboard" });
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Transport Master" }, { label: "Vehicles" }]}
      title="VEHICLES LIST"
      activePath="/transport/vehicle/list"
    >
      <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-auto hide-scrollbar">
        {/* Cyan Horizontal Document Status Header matching exact color theme in screenshot */}
        <div className="grid grid-cols-6 border border-cyan-500 bg-[#00c0a5] rounded-md shadow-sm shrink-0 overflow-hidden text-center divide-x divide-cyan-600/35">
          <div className="py-2.5 px-1 hover:bg-[#00b49c] transition-colors cursor-pointer">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">Insurance Exp.</span>
          </div>
          <div className="py-2.5 px-1 hover:bg-[#00b49c] transition-colors cursor-pointer">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">RC Exp.</span>
          </div>
          <div className="py-2.5 px-1 hover:bg-[#00b49c] transition-colors cursor-pointer">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">Tax Exp.</span>
          </div>
          <div className="py-2.5 px-1 hover:bg-[#00b49c] transition-colors cursor-pointer">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">Pollution Exp.</span>
          </div>
          <div className="py-2.5 px-1 hover:bg-[#00b49c] transition-colors cursor-pointer">
            <span className="text-[10px] font-black uppercase text-white tracking-widest">Fitness Exp.</span>
          </div>
          <div className="py-2.5 px-1 hover:bg-[#00b49c] transition-colors cursor-pointer">
            <span className="text-[10px] font-black uppercase text-white tracking-widest font-extrabold text-yellow-200">Document Required</span>
          </div>
        </div>

        {/* Clean full screen width container list table */}
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden flex flex-col flex-1 min-h-0 w-full">
          {/* Header Panel */}
          {showFilters && (
          <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-xs font-bold text-slate-500 uppercase">entries</span>
              </div>

              {/* Add New Vehicle Button */}
              <Link href="/transport/vehicle/new">
                <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-extrabold px-5 h-8 text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Vehicle
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Search:</span>
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search registered vehicles..."
                className="h-8 w-56 text-xs font-semibold border-slate-300 bg-white"
              />
            </div>
          </div>
          )}

          {/* Datatable Scroll Container */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4">S/L No</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle No</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle Name</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Transporter Name</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle Type</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle Category</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                      Connecting to Fleet database...
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No registered vehicles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item, idx) => {
                    const slNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <TableRow
                        key={item._id || item.id}
                        className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-bold text-slate-600 text-xs py-3 px-4">{slNo}</TableCell>
                        <TableCell className="font-extrabold text-[#1e40af] text-xs px-3">{item.registrationNo}</TableCell>
                        
                        {/* Exact matching design: Peach color background cell exactly like in the screenshot! */}
                        <TableCell className="font-extrabold text-slate-800 text-xs px-3 bg-[#ffedd5]/70 border-x border-[#fed7aa]/35">
                          {item.model}
                        </TableCell>

                        <TableCell className="font-medium text-slate-600 text-xs px-3">{item.transporter || "N/A"}</TableCell>
                        <TableCell className="font-semibold text-slate-700 text-xs px-3 lowercase">{item.vehicleType || "own"}</TableCell>
                        <TableCell className="font-semibold text-slate-700 text-xs px-3 lowercase">{item.vehicleCategory || "km"}</TableCell>
                        <TableCell className="px-4 py-2.5 text-center">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteVehicle(item._id || item.id!)}
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Datatable Footer Pagination Panel */}
          <div className="p-4 bg-slate-50/50 border-t flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              Showing {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} entries
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs font-extrabold uppercase px-3"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, pIdx) => (
                <Button
                  key={pIdx}
                  variant={currentPage === pIdx + 1 ? "default" : "outline"}
                  onClick={() => setCurrentPage(pIdx + 1)}
                  className={`h-8 w-8 text-xs font-extrabold ${
                    currentPage === pIdx + 1 ? "bg-[#00c0a5] hover:bg-[#00a991] text-white" : ""
                  }`}
                >
                  {pIdx + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs font-extrabold uppercase px-3"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </TransportLayout>
  );
}
