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
import { ExportDropdown } from "@/components/export-dropdown";
import {
  Plus,
  Search,
  RotateCcw,
  Copy,
  Printer,
  Download,
  Trash2,
  Edit,
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
  const { showFilters } = useTransportFilters();
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";
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

  const filtered = useMemo(() => {
    return items.filter((i) =>
      i.name.toLowerCase().includes(searchName.toLowerCase())
    );
  }, [items, searchName]);

  // Individual Row Actions Logic
  const handleExportRow = (item: PumpDGData, index: number, type: "pdf" | "csv" | "copy") => {
    const sNo = index + 1;
    if (type === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const htmlContent = `
        <html>
          <head>
            <title>Asset Receipt - ${item.name}</title>
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
            <div style="display: flex; height: 6px; width: 100%;">
              <div style="width: 40%; background: linear-gradient(to right, #a855f7, #ec4899, #db2777);"></div>
              <div style="width: 30%; background: linear-gradient(to right, #06b6d4, #3b82f6);"></div>
              <div style="width: 30%; background: linear-gradient(to right, #f97316, #ef4444);"></div>
            </div>
            <div style="background-color: #131522; padding: 16px; display: flex; align-items: center; gap: 20px; color: white; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
              <div style="background-color: black; width: 64px; height: 64px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #1e293b;">
                <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="aGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#f43f5e" />
                    </linearGradient>
                    <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#06b6d4" />
                      <stop offset="60%" stop-color="#3b82f6" />
                      <stop offset="100%" stop-color="#f97316" />
                    </linearGradient>
                  </defs>
                  <path d="M 18 80 L 46 20 L 56 20 L 28 80 Z" fill="url(#aGrad)" />
                  <path d="M 46 20 L 56 20 L 36 80 L 26 80 Z" fill="url(#eGrad)" />
                  <path d="M 51 20 L 82 20 L 78 30 L 48 30 Z" fill="url(#eGrad)" />
                  <path d="M 41 47 L 76 47 L 72 57 L 38 57 Z" fill="url(#eGrad)" />
                  <path d="M 31 70 L 82 70 L 78 80 L 27 80 Z" fill="url(#eGrad)" />
                </svg>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: white; line-height: 1; text-align: left;">FORTUNE CONCRETE</h1>
                <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 600; color: #f97316; letter-spacing: 1px; text-align: left;">Building Trust &bull; Delivering Excellence</p>
                <div style="width: 100%; height: 1px; background-color: rgba(51, 65, 85, 0.6); margin: 6px 0;"></div>
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 8px; color: #cbd5e1; font-weight: bold;">
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                    Kompally, TS
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                    9010514880
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                    abcs3d@gmail.com
                  </span>
                </div>
              </div>
            </div>
            <div class="title">Asset Specifications Card</div>
            <div class="grid-info">
              <div class="info-group"><span class="label">S.No</span><span class="value">${sNo}</span></div>
              <div class="info-group"><span class="label">Equipment Name</span><span class="value">${item.name}</span></div>
              <div class="info-group"><span class="label">Type of Pump</span><span class="value">${item.type}</span></div>
              <div class="info-group"><span class="label">Capacity</span><span class="value">${item.capacity || "N/A"}</span></div>
              <div class="info-group"><span class="label">Status</span><span class="value">${item.status || "N/A"}</span></div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else if (type === "csv") {
      const csvData = [
        ["S.No", "Name", "Type of Pump"].join(","),
        [sNo, `"${item.name}"`, `"${item.type}"`].join(",")
      ].join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `asset_${item.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded", description: `File asset_${item.name}.csv saved.` });
    } else if (type === "copy") {
      const tsvContent = [
        ["S.No", "Name", "Type of Pump"].join("\t"),
        [sNo, item.name, item.type].join("\t")
      ].join("\n");
      navigator.clipboard.writeText(tsvContent);
      toast({ title: "Copied to Clipboard", description: `Copied data for asset ${item.name}.` });
    }
  };

  // Table Level Global Export
  const handleExport = (type: "copy" | "csv" | "pdf") => {
    if (filtered.length === 0) return;
    
    const headers = ["S.No", "Name", "Type of Pump"];
    const rows = filtered.map((i, index) => [
      String(index + 1),
      i.name,
      i.type
    ]);

    if (type === "copy") {
      const copyText = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
      navigator.clipboard.writeText(copyText);
      toast({ title: "Copied to Clipboard", description: "Asset list copied." });
    } else if (type === "csv") {
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      ].join("\n");
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
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const tableRows = filtered
        .map(
          (item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 11px; font-weight: bold; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 11px;">${item.name}</td>
          <td style="padding: 10px; font-size: 11px; text-transform: uppercase;">${item.type}</td>
        </tr>`
        )
        .join("");

      const htmlContent = `
        <html>
          <head>
            <title>Asset Report</title>
            <style>
              body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 20px; }
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00c0a5; padding-bottom: 15px; margin-bottom: 20px; }
              .company-info h1 { margin: 0; font-size: 20px; font-weight: 900; color: #1e3a8a; }
              .company-info p { margin: 3px 0 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
              .logo { height: 45px; width: 45px; }
              .title { text-align: center; font-size: 13px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f1f5f9; padding: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: center; border-bottom: 2px solid #cbd5e1; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div style="display: flex; height: 6px; width: 100%;">
              <div style="width: 40%; background: linear-gradient(to right, #a855f7, #ec4899, #db2777);"></div>
              <div style="width: 30%; background: linear-gradient(to right, #06b6d4, #3b82f6);"></div>
              <div style="width: 30%; background: linear-gradient(to right, #f97316, #ef4444);"></div>
            </div>
            <div style="background-color: #131522; padding: 16px; display: flex; align-items: center; gap: 20px; color: white; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
              <div style="background-color: black; width: 64px; height: 64px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #1e293b;">
                <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="aGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#f43f5e" />
                    </linearGradient>
                    <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#06b6d4" />
                      <stop offset="60%" stop-color="#3b82f6" />
                      <stop offset="100%" stop-color="#f97316" />
                    </linearGradient>
                  </defs>
                  <path d="M 18 80 L 46 20 L 56 20 L 28 80 Z" fill="url(#aGrad)" />
                  <path d="M 46 20 L 56 20 L 36 80 L 26 80 Z" fill="url(#eGrad)" />
                  <path d="M 51 20 L 82 20 L 78 30 L 48 30 Z" fill="url(#eGrad)" />
                  <path d="M 41 47 L 76 47 L 72 57 L 38 57 Z" fill="url(#eGrad)" />
                  <path d="M 31 70 L 82 70 L 78 80 L 27 80 Z" fill="url(#eGrad)" />
                </svg>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: white; line-height: 1; text-align: left;">FORTUNE CONCRETE</h1>
                <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 600; color: #f97316; letter-spacing: 1px; text-align: left;">Building Trust &bull; Delivering Excellence</p>
                <div style="width: 100%; height: 1px; background-color: rgba(51, 65, 85, 0.6); margin: 6px 0;"></div>
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 8px; color: #cbd5e1; font-weight: bold;">
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                    Kompally, TS
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                    9010514880
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                    abcs3d@gmail.com
                  </span>
                </div>
              </div>
            </div>
            <div class="title">Pump & DG Assets List</div>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Type of Pump</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Pump&DG" }, { label: "Pump & DG List" }]}
      title="PUMP & DG ASSETS LIST"
      activePath="/transport/pump-dg/list"
    >
      <Card className="border shadow-sm bg-white flex-1 flex flex-col overflow-hidden">
        {/* Filters Panel */}
        {showFilters && (
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
        )}

        {/* Actions Bar */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/20 shrink-0">
          <div className="text-xs font-bold text-slate-500 uppercase">
            Showing {filtered.length} of {items.length} registered assets
          </div>
          <ExportDropdown
            onCopy={() => handleExport("copy")}
            onCSV={() => handleExport("csv")}
            onPDF={() => handleExport("pdf")}
          />
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className={`${headerStyle} w-20`}>S.No</TableHead>
                <TableHead className={`${headerStyle} text-left`}>Type of Pump</TableHead>
                <TableHead className={`${headerStyle} text-left`}>Name</TableHead>
                <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Connecting to Assets database...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
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
                    <TableCell className="text-xs font-extrabold py-3 px-4 text-slate-600">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3 text-uppercase">
                      {item.type}
                    </TableCell>
                    <TableCell className="font-extrabold text-[#1e40af] text-xs px-3">
                      {item.name}
                    </TableCell>
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
                        <Link href={`/transport/pump-dg/edit/${item.id || item._id}`}>
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
      </Card>
    </TransportLayout>
  );
}
