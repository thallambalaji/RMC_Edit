import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Settings, Edit, Trash2 } from "lucide-react";

interface TransporterData {
  _id?: string;
  id?: string;
  name: string;
  status: string;
}

export default function TransportSettings() {
  const { toast } = useToast();
  const [transporters, setTransporters] = useState<TransporterData[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Dialog Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transporters");
      if (res.ok) {
        const data = await res.json();
        setTransporters(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setName("");
    setStatus("active");
    setIsModalOpen(true);
  };

  const openEditModal = (item: TransporterData) => {
    setIsEditMode(true);
    setCurrentId(item.id || item._id || null);
    setName(item.name);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Transporter Name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = isEditMode ? `/api/transporters/${currentId}` : "/api/transporters";
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), status }),
      });

      if (res.ok) {
        toast({
          title: isEditMode ? "Transporter Updated" : "Transporter Saved",
          description: `Transporter "${name}" successfully saved in database.`,
        });
        fetchTransporters();
        setIsModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to save transporter details.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transporter?")) return;
    try {
      const res = await fetch(`/api/transporters/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Transporter Deleted",
          description: "Transporter record deleted successfully.",
        });
        fetchTransporters();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Setting" }, { label: "General setting" }]}
      title="GENERAL SETTING"
      activePath="/transport/settings"
    >
      <div className="w-full py-6 px-4 bg-white min-h-[calc(100vh-140px)] flex flex-col rounded-lg border shadow-sm space-y-4">
        
        {/* Banner header containing icon and text */}
        <div className="bg-[#f8fafc] border border-slate-200/60 p-4 rounded-lg flex items-center gap-3">
          <div className="h-9 w-9 bg-[#ea580c]/10 text-[#ea580c] flex items-center justify-center rounded">
            <Settings className="h-5 w-5" />
          </div>
          <span className="text-sm font-black text-slate-800 uppercase tracking-wide">Transporters</span>
        </div>

        {/* Action toolbar */}
        <div className="flex select-none">
          <Button
            onClick={openAddModal}
            className="bg-[#ea580c] hover:bg-[#d97706] text-white font-bold text-xs h-9 px-4 rounded border-none shadow-sm active:scale-95 transition-all"
          >
            Add Transporter
          </Button>
        </div>

        {/* Transporters List Table */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b">
                <TableHead className="text-slate-700 text-[11px] font-black uppercase py-3.5 px-4 w-24">S/L No</TableHead>
                <TableHead className="text-slate-700 text-[11px] font-black uppercase px-4">Transporter Name</TableHead>
                <TableHead className="text-slate-700 text-[11px] font-black uppercase px-4">Transporter Status</TableHead>
                <TableHead className="text-slate-700 text-[11px] font-black uppercase px-4 text-center w-36">Option</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">
                    Loading Transporters...
                  </TableCell>
                </TableRow>
              ) : transporters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    No transporters found. Click "Add Transporter" to register.
                  </TableCell>
                </TableRow>
              ) : (
                transporters.map((item, idx) => (
                  <TableRow
                    key={item.id || item._id}
                    className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/10"
                    }`}
                  >
                    <TableCell className="font-bold text-slate-500 text-xs py-3.5 px-4">{idx + 1}</TableCell>
                    <TableCell className="font-extrabold text-slate-700 text-xs px-4 uppercase">{item.name}</TableCell>
                    <TableCell className="px-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          item.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-50 text-slate-500 border border-slate-150"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <div className="flex items-center justify-center gap-2 select-none">
                        <Button
                          onClick={() => openEditModal(item)}
                          variant="ghost"
                          className="h-8 w-8 p-0 text-[#ea580c] hover:text-[#d97706] hover:bg-[#ea580c]/5 rounded border-none flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id || item._id!)}
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded border-none flex items-center justify-center"
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

        {/* Modal Dialog Popup Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal header */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <span className="text-xl font-bold text-[#ea580c] leading-none">
                  {isEditMode ? "✎" : "+"}
                </span>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  {isEditMode ? "Edit Transporter" : "Add Transporter"}
                </h3>
              </div>

              {/* Modal Form content */}
              <form onSubmit={handleSave} className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Transporter Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Transporter Name"
                    className="h-10 text-xs font-semibold border-slate-200 focus:border-[#ea580c] focus:ring-[#ea580c] rounded"
                    required
                  />
                </div>

                {isEditMode && (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Transporter Status</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                {/* Modal actions */}
                <div className="flex gap-2 pt-2 justify-end">
                  <Button
                    type="submit"
                    className="bg-[#ea580c] hover:bg-[#d97706] text-white font-bold text-xs h-9 px-4 rounded border-none shadow-sm active:scale-95 transition-all"
                  >
                    Save Transporter
                  </Button>
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-9 px-4 rounded border-none shadow-sm active:scale-95 transition-all"
                  >
                    Close
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </TransportLayout>
  );
}
