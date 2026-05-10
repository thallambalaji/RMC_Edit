import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ChevronRight, Search, Plus, Trash2, Filter, FileText, Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WeighmentList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const mockData = [
    { deliveryNo: "DEL1/2627/0256", customer: "CLOUDSWOOD CONSTRUCTIONS PRIVATE LIMITED", site: "UPSIDE AVENUES", date: "07/05/2026", item: "M10", empty: "11970", loaded: "24310", net: "12340", vehicle: "TS07UP 1789", billNo: "N/A", plant: "FORTUNE CONCRETE" },
    { deliveryNo: "DEL1/2627/0255", customer: "RADHEY CONSTRUCTIONS INDIA PRIVATE LIMITED", site: "Raaga", date: "03/05/2026", item: "M25", empty: "11970", loaded: "29320", net: "17350", vehicle: "TS07UP 1789", billNo: "N/A", plant: "FORTUNE CONCRETE" },
    { deliveryNo: "DEL1/2627/0254", customer: "SREE CHAITANYA CONSTRUCTIONS", site: "VELIMELA", date: "01/05/2026", item: "M25", empty: "11970", loaded: "24460", net: "12500", vehicle: "TS07UP 1789", billNo: "N/A", plant: "FORTUNE CONCRETE" },
    { deliveryNo: "DEL1/2627/0253", customer: "RADHEY CONSTRUCTIONS INDIA PRIVATE LIMITED", site: "Raaga", date: "28/04/2026", item: "M10", empty: "11910", loaded: "20650", net: "8740", vehicle: "TS 07 UL 5969", billNo: "N/A", plant: "FORTUNE CONCRETE" },
    { deliveryNo: "DEL1/2627/0252", customer: "RADHEY CONSTRUCTIONS INDIA PRIVATE LIMITED", site: "Raaga", date: "28/04/2026", item: "M25", empty: "14210", loaded: "25680", net: "11470", vehicle: "TS 07 UL 5919", billNo: "N/A", plant: "FORTUNE CONCRETE" },
  ];

  const handleSearch = () => {
    toast({ title: "Searching...", description: "Filtering records based on your criteria." });
  };

  const handleClear = () => {
    toast({ title: "Filters Cleared", description: "Showing all weighment records." });
  };

  const handleCopy = () => {
    const headers = ["Delivery No", "Customer", "Site", "Date", "Vehicle", "Loaded", "Empty", "Net"];
    const rows = mockData.map(d => [
      d.deliveryNo,
      d.customer,
      d.site,
      d.date,
      d.vehicle,
      d.loaded,
      d.empty,
      d.net
    ]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleExportCSV = () => {
    const headers = ["Delivery No", "Customer", "Site", "Date", "Vehicle", "Loaded", "Empty", "Net"];
    const rows = mockData.map(d => [
      `"${d.deliveryNo}"`,
      `"${d.customer}"`,
      `"${d.site}"`,
      `"${d.date}"`,
      `"${d.vehicle}"`,
      `"${d.loaded}"`,
      `"${d.empty}"`,
      `"${d.net}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `weighment_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful" });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Weighment List</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/dc" className="hover:text-[#1e40af] transition-colors">DC</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Weighment List</span>
        </nav>
      </div>

      <div className="flex flex-wrap gap-3 mb-2">
        <Button className="bg-[#1e40af] text-white hover:bg-[#1d4ed8] px-6 h-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-500/10">
          WEIGHMENT LIST
        </Button>
        <Button className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 px-6 h-10 font-black uppercase tracking-widest text-[10px] transition-all">
          <Trash2 className="h-3 w-3 mr-2" /> DELETED RECORDS
        </Button>
        <Link href="/dc/weighment/new" className="bg-cyan-500 text-white hover:bg-cyan-600 px-6 h-10 font-black uppercase tracking-widest text-[10px] flex items-center shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
          <Plus className="h-4 w-4 mr-2" /> NEW WEIGHMENT
        </Link>
      </div>

      <div className="glass-card p-6 border-white/80 shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Filter className="h-4 w-4 text-cyan-600" />
          <h3 className="text-slate-800 font-black text-sm uppercase tracking-widest">Filter Records</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-5 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <Label className="f-label text-slate-600">Search No.</Label>
            <Input placeholder="Del/Bill No" className="f-input bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">From Date</Label>
            <Input type="date" className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">To Date</Label>
            <Input type="date" className="f-input bg-white border-slate-200 text-slate-700 font-semibold" />
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">Customer</Label>
            <Select defaultValue="all">
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="all">All Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">Plant</Label>
            <Select defaultValue="all">
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="all">All Plants</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="btn-primary h-10 flex-1 font-black text-[10px] uppercase tracking-widest">SEARCH</Button>
            <Button onClick={handleClear} variant="outline" className="bg-white border-slate-200 text-slate-600 h-10 flex-1 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">CLEAR</Button>
          </div>
        </div>
      </div>

      <div className="glass-card flex flex-col overflow-hidden border-white/80 shadow-xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-20 h-8 bg-white border-slate-200 text-slate-700 text-xs font-bold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-8 gap-2 text-[10px] font-black uppercase tracking-wider shadow-sm">Copy</Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-8 gap-2 text-[10px] font-black uppercase tracking-wider shadow-sm"><FileText className="h-3 w-3" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-8 gap-2 text-[10px] font-black uppercase tracking-wider shadow-sm"><Download className="h-3 w-3" /> PDF</Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-8 gap-2 text-[10px] font-black uppercase tracking-wider shadow-sm"><Printer className="h-3 w-3" /> Print</Button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <Table className="data-table">
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900 border-b border-slate-800">
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Delivery No</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Customer</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Site</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Date</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Item</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Weights (E/L/N)</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Vehicle</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Plant</TableHead>
                <TableHead className="text-white font-black h-12 text-center text-[10px] uppercase tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors group">
                  <TableCell className="text-center py-3 text-cyan-600 font-black text-[10px]">{row.deliveryNo}</TableCell>
                  <TableCell className="text-center py-3 text-slate-700 font-bold text-[10px] max-w-[150px] truncate">{row.customer}</TableCell>
                  <TableCell className="text-center py-3 text-slate-600 font-semibold text-[10px]">{row.site}</TableCell>
                  <TableCell className="text-center py-3 text-slate-400 font-bold text-[10px]">{row.date}</TableCell>
                  <TableCell className="text-center py-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[10px] font-black border border-cyan-100">{row.item}</span>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col gap-0.5 font-mono text-[9px] font-bold">
                      <span className="text-slate-300">E: {row.empty}</span>
                      <span className="text-slate-300">L: {row.loaded}</span>
                      <span className="text-emerald-600">N: {row.net}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3 text-slate-800 font-black text-[10px]">{row.vehicle}</TableCell>
                  <TableCell className="text-center py-3 text-slate-400 font-semibold text-[10px]">{row.plant}</TableCell>
                  <TableCell className="text-center py-3">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all">
                      <Search className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Showing 1 to 5 of 3,764 entries</div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-400 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm transition-all">PREV</Button>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`h-7 w-7 flex items-center justify-center rounded text-[10px] font-black transition-all ${
                n === 1 ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}>{n}</button>
            ))}
            <span className="text-slate-300 px-1">...</span>
            <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm transition-all">NEXT</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
