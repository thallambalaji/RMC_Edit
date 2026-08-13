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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportDropdown } from "@/components/export-dropdown";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout, useTransportFilters } from "@/components/transport-layout";
import { Plus, Trash2, Edit, Printer, Copy, Download, MoreVertical, ChevronRight } from "lucide-react";

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
  insuranceExp?: string;
  rcExp?: string;
  taxExp?: string;
  pollutionExp?: string;
  fitnessExp?: string;
  documentRequired?: string;
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
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 20px; }
              .company-info h1 { margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; }
              .company-info p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: bold; }
              .logo { height: 50px; width: 50px; }
              .title { text-align: center; font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 30px 0; color: #ea580c; }
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
                <rect width="100" height="100" rx="15" fill="#0f172a"/>
                <path d="M30 70V30H45C55 30 60 35 60 42C60 47 56 50 50 51C57 52 62 56 62 62C62 70 55 70 45 70H30ZM40 46H45C49 46 51 44 51 41C51 38 49 37 45 37H40V46ZM40 63H46C50 63 53 61 53 58C53 55 50 54 46 54H40V63Z" fill="#ea580c"/>
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
      breadcrumbs={[{ label: "Vehicles" }]}
      title="VEHICLES LIST"
      activePath="/transport/vehicle/list"
    >
      <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-auto hide-scrollbar">

        {/* Filter Card Matching Customer & PO */}
        {showFilters && (
        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm shrink-0">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter">Search Vehicles</Label>
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by registration or model..."
                className="h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white"
              />
            </div>
            
            <div className="flex gap-1.5 h-7">
              <Button 
                onClick={() => setCurrentPage(1)} 
                className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
              >
                Search
              </Button>
              <Button 
                onClick={() => setSearchQuery("")} 
                className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Clean full screen width container list table */}
        <Card className="border shadow-md bg-white rounded-lg overflow-hidden flex flex-col flex-1 min-h-0 w-full">
          {/* Table Toolbar Header */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-500 uppercase">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-14 h-6 bg-white border border-gray-200 text-[10px] font-bold rounded"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-[9px] font-black text-gray-500 uppercase">entries</span>
            </div>
            <ExportDropdown
              onCopy={() => {}}
              onCSV={() => {}}
              onPDF={() => window.print()}
            />
          </div>

          {/* Datatable Scroll Container */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#ea580c]">
                <TableRow className="hover:bg-transparent border-0 bg-[#ea580c]">
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">S/L No</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Vehicle No</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Vehicle Name</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Vehicle Type</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Insurance Exp.</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">RC Exp.</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Tax Exp.</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Pollution Exp.</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Fitness Exp.</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left">Doc. Required</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter w-[70px]">OPTIONS</TableHead>
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
                        <TableCell className="font-extrabold text-[#ea580c] text-xs px-3 whitespace-nowrap">{item.registrationNo}</TableCell>
                        <TableCell className="font-extrabold text-slate-800 text-xs px-3 bg-[#ffedd5]/70 border-x border-[#fed7aa]/35 whitespace-nowrap">{item.model}</TableCell>
                        <TableCell className="font-semibold text-slate-700 text-xs px-3">{item.vehicleType || "Own"}</TableCell>
                        <TableCell className="text-xs px-3 text-slate-600">{item.insuranceExp ? new Date(item.insuranceExp).toLocaleDateString("en-IN") : "—"}</TableCell>
                        <TableCell className="text-xs px-3 text-slate-600">{item.rcExp ? new Date(item.rcExp).toLocaleDateString("en-IN") : "—"}</TableCell>
                        <TableCell className="text-xs px-3 text-slate-600">{item.taxExp ? new Date(item.taxExp).toLocaleDateString("en-IN") : "—"}</TableCell>
                        <TableCell className="text-xs px-3 text-slate-600">{item.pollutionExp ? new Date(item.pollutionExp).toLocaleDateString("en-IN") : "—"}</TableCell>
                        <TableCell className="text-xs px-3 text-slate-600">{item.fitnessExp ? new Date(item.fitnessExp).toLocaleDateString("en-IN") : "—"}</TableCell>
                        <TableCell className="text-xs px-3 text-slate-600">{item.documentRequired || "—"}</TableCell>
                        <TableCell className="text-center py-1.5 px-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center mx-auto"
                              >
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                                <span className="sr-only">Open options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                              <DropdownMenuItem onClick={() => handleEdit(item)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Edit className="h-3.5 w-3.5 text-[#ea580c]" />
                                <span>Edit Vehicle</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportRow(item, idx, "pdf")} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Printer className="h-3.5 w-3.5 text-red-500" />
                                <span>Print Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportRow(item, idx, "csv")} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Download className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Export CSV</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportRow(item, idx, "copy")} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Copy className="h-3.5 w-3.5 text-[#ea580c]" />
                                <span>Copy Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteVehicle(item._id || item.id!)} 
                                className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                <span>Delete Vehicle</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Datatable Footer Pagination Panel */}
          {/* Datatable Footer Pagination Panel */}
          <div className="flex items-center justify-between p-3 border-t bg-white shrink-0">
            <div className="text-[9px] font-black text-gray-500 uppercase">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-6 w-6 p-0 border-gray-200 text-gray-400 bg-white"
              >
                <ChevronRight className="h-3 w-3 rotate-180" />
              </Button>
              <div className="h-6 px-2 flex items-center justify-center bg-[#ea580c] text-white text-[9px] font-black rounded">
                {currentPage}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="h-6 w-6 p-0 border-gray-200 text-gray-400 bg-white"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </TransportLayout>
  );
}
