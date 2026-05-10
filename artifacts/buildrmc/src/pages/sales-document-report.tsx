import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useGetInvoices, getGetInvoicesQueryKey } from "@workspace/api-client-react";
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
import { ChevronRight, RotateCcw, FileBarChart } from "lucide-react";

export default function SalesDocumentReport() {
  const { data: invoices } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });

  const [reportType, setReportType] = useState("date-wise");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setFromToDate] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");

  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    (invoices || []).forEach((i) => i.plant && set.add(i.plant));
    return Array.from(set);
  }, [invoices]);

  const handleClear = () => {
    setReportType("date-wise");
    setFromDate("");
    setFromToDate("");
    setPlantFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Header with breadcrumbs */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Document Report</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Sales Document Report</span>
        </nav>
      </div>

      {/* Report controls card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-2 md:col-span-1 lg:col-span-1">
            <Label htmlFor="reportType" className="text-sm font-semibold">Report Type <span className="text-rose-500">*</span></Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType" className="bg-gray-50 border-gray-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-wise">Date Wise Report</SelectItem>
                <SelectItem value="customer-wise">Customer Wise Report</SelectItem>
                <SelectItem value="plant-wise">Plant Wise Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fromDate" className="text-sm font-semibold">From Date</Label>
            <Input
              id="fromDate"
              type="date"
              className="bg-gray-50 border-gray-200 h-10"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toDate" className="text-sm font-semibold">To Date</Label>
            <Input
              id="toDate"
              type="date"
              className="bg-gray-50 border-gray-200 h-10"
              value={toDate}
              onChange={(e) => setFromToDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plant" className="text-sm font-semibold">Plant <span className="text-rose-500">*</span></Label>
            <Select value={plantFilter} onValueChange={setPlantFilter}>
              <SelectTrigger id="plant" className="bg-gray-50 border-gray-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plant</SelectItem>
                {uniquePlants.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <Button type="button" className="bg-emerald-500 hover:bg-emerald-600 h-10 px-6 text-white font-medium">
              Generate
            </Button>
            <Button type="button" variant="destructive" className="bg-rose-500 hover:bg-rose-600 h-10 px-6 text-white font-medium" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Placeholder for report content */}
      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
        <FileBarChart className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Click "Generate" to view the report</p>
      </div>
    </div>
  );
}
