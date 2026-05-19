import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  Settings,
  Box,
  Share2,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { QcLayout } from "@/components/qc-layout";

export default function QcSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"moisture" | "cube" | "matching">("moisture");

  // Global Mock lists for Select fields
  const plants = ["FORTUNE CONCRETE", "NAVAL RMC"];
  const storeItemsList = [
    "Aggregate 20mm",
    "Aggregate 10mm",
    "River Sand",
    "M-Sand",
    "Cement OPC 53 Grade",
    "Fly Ash",
    "GGBS",
    "Water",
    "Admixture 1",
  ];

  // ══════════════════════════════════════════════════════════════════
  // TAB 1: MOISTURE SETTING STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════
  const [moisturePlant, setMoisturePlant] = useState<string>("");
  const [moistureValues, setMoistureValues] = useState({
    moisture20mm: 0,
    moisture10mm: 0,
    moistureMSand: 0,
    moistureRSand: 0,
  });

  // Load moisture settings for the selected plant
  useEffect(() => {
    if (!moisturePlant) return;
    const fetchMoisture = async () => {
      try {
        const res = await fetch(`/api/moisture-settings/${encodeURIComponent(moisturePlant)}`);
        if (res.ok) {
          const data = await res.json();
          setMoistureValues({
            moisture20mm: data.moisture20mm || 0,
            moisture10mm: data.moisture10mm || 0,
            moistureMSand: data.moistureMSand || 0,
            moistureRSand: data.moistureRSand || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load moisture settings", err);
      }
    };
    fetchMoisture();
  }, [moisturePlant]);

  const handleSaveMoisture = async () => {
    if (!moisturePlant) {
      toast({
        title: "Plant Selection Required",
        description: "Please select a plant to save moisture adjustments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/moisture-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant: moisturePlant,
          ...moistureValues,
        }),
      });

      if (res.ok) {
        toast({
          title: "Moisture Settings Saved",
          description: `Successfully updated moisture percentages for ${moisturePlant}.`,
        });
      } else {
        toast({
          title: "Save Failed",
          description: "Could not save moisture settings.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const handleClearMoisture = () => {
    setMoistureValues({
      moisture20mm: 0,
      moisture10mm: 0,
      moistureMSand: 0,
      moistureRSand: 0,
    });
    toast({
      title: "Moisture Setting Cleared",
      description: "Moisture percentages have been reset to zero.",
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // TAB 2: CUBE MASTER STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════
  const [cubeMasters, setCubeMasters] = useState<any[]>([]);
  const [editingCubeId, setEditingCubeId] = useState<string | null>(null);

  // Form states
  const [length, setLength] = useState<string>("");
  const [breadth, setBreadth] = useState<string>("");
  const [height, setHeight] = useState<string>("");

  // Auto-calculated Formula Values
  const densityFormulaValue = useMemo(() => {
    const L = parseFloat(length);
    const B = parseFloat(breadth);
    const H = parseFloat(height);
    if (isNaN(L) || isNaN(B) || isNaN(H)) return "0.000000";
    return ((L * B * H) / 1000000000).toFixed(6);
  }, [length, breadth, height]);

  const compStrengthFormulaValue = useMemo(() => {
    const L = parseFloat(length);
    const B = parseFloat(breadth);
    if (isNaN(L) || isNaN(B)) return "0.0";
    return ((L * B) / 1000).toFixed(1);
  }, [length, breadth]);

  const fetchCubeMasters = async () => {
    try {
      const res = await fetch("/api/cube-masters");
      if (res.ok) {
        const data = await res.json();
        setCubeMasters(data);
      }
    } catch (err) {
      console.error("Failed to load cube masters", err);
    }
  };

  useEffect(() => {
    fetchCubeMasters();
  }, []);

  const handleSaveCube = async () => {
    if (!length || !breadth || !height) {
      toast({
        title: "Incomplete Fields",
        description: "Please fill in Length, Breadth, and Height.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      density: parseFloat(densityFormulaValue),
      compStrength: parseFloat(compStrengthFormulaValue),
    };

    try {
      const url = editingCubeId ? `/api/cube-masters/${editingCubeId}` : "/api/cube-masters";
      const method = editingCubeId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: editingCubeId
            ? "Cube Master record updated successfully."
            : "New Cube Master dimension saved successfully.",
        });
        handleClearCube();
        fetchCubeMasters();
      } else {
        toast({
          title: "Failed",
          description: "Failed to store cube dimension.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const handleEditCube = (item: any) => {
    setEditingCubeId(item._id || item.id);
    setLength(item.length.toString());
    setBreadth(item.breadth.toString());
    setHeight(item.height.toString());
  };

  const handleDeleteCube = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Cube Master record?")) return;
    try {
      const res = await fetch(`/api/cube-masters/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Deleted",
          description: "Cube Master record has been removed.",
        });
        fetchCubeMasters();
        if (editingCubeId === id) handleClearCube();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCube = () => {
    setEditingCubeId(null);
    setLength("");
    setBreadth("");
    setHeight("");
  };

  // ══════════════════════════════════════════════════════════════════
  // TAB 3: BATCH ITEM MATCHING STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════
  const [matchings, setMatchings] = useState<any[]>([]);
  const [matchingPlantFilter, setMatchingPlantFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Dialog Form states
  const [dialogPlant, setDialogPlant] = useState<string>("");
  const [dialogStoreItem, setDialogStoreItem] = useState<string>("");
  const [dialogBatchItemName, setDialogBatchItemName] = useState<string>("");

  const fetchMatchings = async () => {
    try {
      const res = await fetch("/api/batch-item-matchings");
      if (res.ok) {
        const data = await res.json();
        setMatchings(data);
      }
    } catch (err) {
      console.error("Failed to load matchings", err);
    }
  };

  useEffect(() => {
    fetchMatchings();
  }, []);

  const handleOpenAddMatching = () => {
    setDialogPlant("");
    setDialogStoreItem("");
    setDialogBatchItemName("");
    setDialogOpen(true);
  };

  const handleAddMatching = async () => {
    if (!dialogPlant || !dialogStoreItem || !dialogBatchItemName) {
      toast({
        title: "Required Fields",
        description: "Please supply Plant, Store Item, and Batch Item Name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/batch-item-matchings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant: dialogPlant,
          storeItem: dialogStoreItem,
          batchItemName: dialogBatchItemName,
        }),
      });

      if (res.ok) {
        toast({
          title: "Item Match Saved",
          description: "New store item mapping successfully bound to batch log fields.",
        });
        setDialogOpen(false);
        fetchMatchings();
      } else {
        toast({
          title: "Failed",
          description: "Could not save batch item match.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMatching = async (id: string) => {
    if (!confirm("Are you sure you want to remove this Store Item Match?")) return;
    try {
      const res = await fetch(`/api/batch-item-matchings/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Match Removed",
          description: "The item matching has been successfully deleted.",
        });
        fetchMatchings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered matchings list based on plant selector on screen
  const filteredMatchings = useMemo(() => {
    if (!matchingPlantFilter || matchingPlantFilter === "all") return matchings;
    return matchings.filter((m) => m.plant === matchingPlantFilter);
  }, [matchings, matchingPlantFilter]);

  return (
    <QcLayout
      breadcrumbs={[{ label: "QC Settings" }]}
      title="QC SETTING"
      activePath="/qc/settings"
    >

        {/* Tab System Card */}
        <Card className="border shadow-sm bg-white flex-1 flex flex-col overflow-hidden">
          {/* Custom Tabs Navigation (Matches styling in screenshots) */}
          <div className="bg-slate-100/50 border-b p-2 flex items-center gap-1 shrink-0">
            <Button
              onClick={() => setActiveTab("moisture")}
              className={`h-9 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 rounded ${
                activeTab === "moisture"
                  ? "bg-[#00b5ad] hover:bg-[#009c95] text-white shadow-sm"
                  : "bg-transparent hover:bg-slate-100 text-slate-600 shadow-none border-none"
              }`}
            >
              <Settings className="h-4.5 w-4.5" /> Moisture Setting
            </Button>
            <Button
              onClick={() => setActiveTab("cube")}
              className={`h-9 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 rounded ${
                activeTab === "cube"
                  ? "bg-[#00b5ad] hover:bg-[#009c95] text-white shadow-sm"
                  : "bg-transparent hover:bg-slate-100 text-slate-600 shadow-none border-none"
              }`}
            >
              <Box className="h-4.5 w-4.5" /> Cube Master
            </Button>
            <Button
              onClick={() => setActiveTab("matching")}
              className={`h-9 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 rounded ${
                activeTab === "matching"
                  ? "bg-[#00b5ad] hover:bg-[#009c95] text-white shadow-sm"
                  : "bg-transparent hover:bg-slate-100 text-slate-600 shadow-none border-none"
              }`}
            >
              <Share2 className="h-4.5 w-4.5" /> Batch Item Matching
            </Button>
          </div>

          {/* Active Tab Viewport */}
          <div className="flex-1 overflow-auto p-4 bg-white">
            {/* ══════════════════════════════════════════════════════════
                TAB 1: MOISTURE SETTING
                ══════════════════════════════════════════════════════════ */}
            {activeTab === "moisture" && (
              <div className="space-y-6 max-w-3xl">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-700">
                    Plant <span className="text-red-500">*</span>
                  </Label>
                  <Select value={moisturePlant} onValueChange={setMoisturePlant}>
                    <SelectTrigger className="h-10 text-xs font-bold bg-white border-slate-300">
                      <SelectValue placeholder="Select Plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.map((p) => (
                        <SelectItem key={p} value={p} className="font-bold text-xs">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {moisturePlant ? (
                  <div className="space-y-6 pt-2">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[#00b5ad]" />
                        Volumetric Aggregate & Sand Moisture Adjustments
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">Aggregate 20mm Moisture (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={moistureValues.moisture20mm}
                            onChange={(e) =>
                              setMoistureValues({ ...moistureValues, moisture20mm: parseFloat(e.target.value) || 0 })
                            }
                            className="h-10 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">Aggregate 10mm Moisture (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={moistureValues.moisture10mm}
                            onChange={(e) =>
                              setMoistureValues({ ...moistureValues, moisture10mm: parseFloat(e.target.value) || 0 })
                            }
                            className="h-10 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">M-Sand Moisture (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={moistureValues.moistureMSand}
                            onChange={(e) =>
                              setMoistureValues({ ...moistureValues, moistureMSand: parseFloat(e.target.value) || 0 })
                            }
                            className="h-10 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">River Sand Moisture (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={moistureValues.moistureRSand}
                            onChange={(e) =>
                              setMoistureValues({ ...moistureValues, moistureRSand: parseFloat(e.target.value) || 0 })
                            }
                            className="h-10 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSaveMoisture}
                        className="bg-[#00b5ad] hover:bg-[#009c95] text-white font-black px-6 h-10 shadow-sm transition-all text-xs uppercase tracking-wider"
                      >
                        Save Moisture Settings
                      </Button>
                      <Button
                        onClick={handleClearMoisture}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black px-5 h-10 shadow-sm transition-all text-xs uppercase tracking-wider"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border p-8 rounded-lg text-center flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      No Plant Selected
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs font-semibold">
                      Please select a plant from the dropdown to view and edit its active moisture compensation profile.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 2: CUBE MASTER
                ══════════════════════════════════════════════════════════ */}
            {activeTab === "cube" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left side form */}
                <div className="md:col-span-5 space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                    <Box className="h-4.5 w-4.5 text-[#00b5ad]" />
                    {editingCubeId ? "Update Cube Master" : "Add New Cube Dimension"}
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase text-slate-700">
                        Length <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. 150"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="h-10 text-xs font-semibold bg-white border-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase text-slate-700">
                        Breadth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. 150"
                        value={breadth}
                        onChange={(e) => setBreadth(e.target.value)}
                        className="h-10 text-xs font-semibold bg-white border-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase text-slate-700">
                        Height <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. 150"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="h-10 text-xs font-semibold bg-white border-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase text-slate-700">
                        Density Formula Value <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        readOnly
                        value={densityFormulaValue}
                        className="h-10 text-xs font-black bg-slate-100 border-slate-300 text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase text-slate-700">
                        Compressive Strength Formula Value <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        readOnly
                        value={compStrengthFormulaValue}
                        className="h-10 text-xs font-black bg-slate-100 border-slate-300 text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={handleSaveCube}
                      className="bg-[#00b5ad] hover:bg-[#009c95] text-white font-black h-10 flex-1 shadow-sm transition-all text-xs uppercase tracking-wider"
                    >
                      {editingCubeId ? "Update Dimension" : "Save Cube Dimension"}
                    </Button>
                    <Button
                      onClick={handleClearCube}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 h-10 shadow-sm transition-all text-xs uppercase tracking-wider"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Right side table */}
                <div className="md:col-span-7 bg-white border rounded-lg overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-100/80">
                      <TableRow className="border-b">
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 py-3 px-3 text-center">
                          S/L No
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3">
                          Length
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3">
                          Breadth
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3">
                          Height
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3">
                          Density
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3">
                          Compressive Strength
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">
                          ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cubeMasters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-xs font-semibold text-slate-500">
                            No cube dimensions registered
                          </TableCell>
                        </TableRow>
                      ) : (
                        cubeMasters.map((item: any, idx: number) => (
                          <TableRow key={item._id || item.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-bold text-xs py-3 px-3 text-slate-600">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs px-3">
                              {item.length}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs px-3">
                              {item.breadth}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs px-3">
                              {item.height}
                            </TableCell>
                            <TableCell className="font-mono text-slate-800 text-xs px-3">
                              {item.density}
                            </TableCell>
                            <TableCell className="font-black text-slate-900 text-xs px-3">
                              {item.compStrength}
                            </TableCell>
                            <TableCell className="px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCube(item)}
                                  className="h-7 w-7 text-[#00b5ad] hover:bg-teal-50"
                                  title="Edit"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCube(item._id || item.id)}
                                  className="h-7 w-7 text-amber-500 hover:bg-amber-50"
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
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB 3: BATCH ITEM MATCHING
                ══════════════════════════════════════════════════════════ */}
            {activeTab === "matching" && (
              <div className="space-y-4 flex flex-col h-full">
                {/* Control Action Bar */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
                  <div className="flex items-center gap-3 w-80">
                    <Label className="text-xs font-black uppercase text-slate-700 whitespace-nowrap">
                      Plant <span className="text-red-500">*</span>
                    </Label>
                    <Select value={matchingPlantFilter} onValueChange={setMatchingPlantFilter}>
                      <SelectTrigger className="h-9 text-xs font-bold bg-white border-slate-300">
                        <SelectValue placeholder="Select Plant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-bold text-xs">All Plants</SelectItem>
                        {plants.map((p) => (
                          <SelectItem key={p} value={p} className="font-bold text-xs">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleOpenAddMatching}
                    className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black px-4 h-9 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Store Item Matching
                  </Button>
                </div>

                {/* Table Container */}
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm flex-1">
                  <Table>
                    <TableHeader className="bg-slate-100/80">
                      <TableRow className="border-b">
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 py-3 px-4 w-20">
                          S.L No
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-4">
                          Store Item
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-4">
                          Batch Item Name
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-4">
                          Plant
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-800 px-4 text-center w-24">
                          ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMatchings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-xs font-semibold text-slate-500">
                            No item matchings found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMatchings.map((item: any, idx: number) => (
                          <TableRow key={item._id || item.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-bold text-xs py-3 px-4 text-slate-600">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-black text-slate-800 text-xs px-4">
                              {item.storeItem}
                            </TableCell>
                            <TableCell className="font-extrabold text-[#0ea5e9] text-xs px-4">
                              {item.batchItemName}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs px-4">
                              {item.plant}
                            </TableCell>
                            <TableCell className="px-4 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMatching(item._id || item.id)}
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
              </div>
            )}
          </div>
        </Card>

      {/* ══════════════════════════════════════════════════════════════════
          POPUP MODAL: ADD BATCH ITEM MATCH (Matches screenshot 4 exactly)
          ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[400px] p-0 border-t-4 border-emerald-500 rounded-lg overflow-hidden bg-white shadow-2xl">
          {/* Modal Header */}
          <div className="p-4 border-b">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">
              Add Batch Item Match
            </h2>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            {/* Plant selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-700">
                Plant <span className="text-red-500">*</span>
              </Label>
              <Select value={dialogPlant} onValueChange={setDialogPlant}>
                <SelectTrigger className="h-10 text-xs font-semibold bg-white border-slate-350">
                  <SelectValue placeholder="Choose plant" />
                </SelectTrigger>
                <SelectContent>
                  {plants.map((p) => (
                    <SelectItem key={p} value={p} className="font-semibold text-xs">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Store Item selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-700">
                Store Item <span className="text-red-500">*</span>
              </Label>
              <Select value={dialogStoreItem} onValueChange={setDialogStoreItem}>
                <SelectTrigger className="h-10 text-xs font-semibold bg-white border-slate-350">
                  <SelectValue placeholder="Choose Item" />
                </SelectTrigger>
                <SelectContent>
                  {storeItemsList.map((item) => (
                    <SelectItem key={item} value={item} className="font-semibold text-xs">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Item Name input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-700">
                Batch Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 20MM, 10MM, CEM1"
                value={dialogBatchItemName}
                onChange={(e) => setDialogBatchItemName(e.target.value.toUpperCase())}
                className="h-10 text-xs font-bold bg-white border-slate-350 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Modal Footer (Emerald ADD, Rose CLOSE - Matches screenshot 4 perfectly) */}
          <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-2 shrink-0">
            <Button
              onClick={handleAddMatching}
              className="bg-[#00c5a0] hover:bg-[#00b08e] text-white font-black px-5 h-9 text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              ADD ITEM MATCH
            </Button>
            <Button
              onClick={() => setDialogOpen(false)}
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-black px-4 h-9 text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              CLOSE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </QcLayout>
  );
}
