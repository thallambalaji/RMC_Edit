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
import { TransportLayout } from "@/components/transport-layout";
import { Plus, Trash2, Edit2 } from "lucide-react";

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
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center">Action</TableHead>
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
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteVehicle(item._id || item.id!)}
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
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
