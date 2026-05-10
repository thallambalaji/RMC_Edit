import { useState } from "react";
import { Link } from "wouter";
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
import { ChevronRight, FileSearch } from "lucide-react";

export default function InvoiceReport() {
  const [category, setCategory] = useState("invoice-report");
  const [type, setType] = useState("date-wise");
  const [item, setItem] = useState("all");
  const [plant, setPlant] = useState("all");
  const [billReceived, setBillReceived] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleClear = () => {
    setCategory("invoice-report");
    setType("date-wise");
    setItem("all");
    setPlant("all");
    setBillReceived("all");
    setStatus("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Invoice Report</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Invoice Report</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Report Category <span className="text-rose-500">*</span></Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice-report">Invoice Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Report Type <span className="text-rose-500">*</span></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date-wise">Date Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date</Label>
            <Input type="date" className="bg-gray-50 h-10" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date</Label>
            <Input type="date" className="bg-gray-50 h-10" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Item <span className="text-rose-500">*</span></Label>
            <Select value={item} onValueChange={setItem}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Item</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Plant <span className="text-rose-500">*</span></Label>
            <Select value={plant} onValueChange={setPlant}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All plant</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Is Bill Received ?</Label>
            <Select value={billReceived} onValueChange={setBillReceived}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Invoice Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 px-6">Generate</Button>
            <Button variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-white h-10 px-6" onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
        <FileSearch className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Generate report to view data</p>
      </div>
    </div>
  );
}
