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
import { ChevronRight, FileText } from "lucide-react";

export default function GenerateAnnexure() {
  const [customer, setCustomer] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleClear = () => {
    setCustomer("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Generate Annexure</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Billing</span>
          <ChevronRight className="h-3 w-3" />
          <span>Report</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Generate Annexure</span>
        </nav>
      </div>

      <div className="bg-[#f0f9ff] min-h-[400px] rounded-lg border border-cyan-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <h3 className="text-3xl font-bold text-sky-400">Generate Annexure</h3>
          
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Customer <span className="text-rose-500">*</span></Label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger className="bg-white h-12 border-gray-200">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c1">Customer 1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">From Date<span className="text-rose-500">*</span></Label>
              <Input type="date" className="bg-white h-12 border-gray-200" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">To Date<span className="text-rose-500">*</span></Label>
              <Input type="date" className="bg-white h-12 border-gray-200" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex-1 text-lg font-medium">Generate Annexure</Button>
              <Button className="bg-rose-500 hover:bg-rose-600 text-white h-12 flex-1 text-lg font-medium" onClick={handleClear}>Clear Report</Button>
            </div>
          </div>

          <div className="pt-8 text-gray-500 text-sm">
            2018 © BUILD RMC
          </div>
        </div>
      </div>
    </div>
  );
}
