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
import { ChevronRight } from "lucide-react";

export default function DCReport() {
  const [category] = useState("DC Report");
  const [type] = useState("Date Wise");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">DC Report</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dc" className="hover:text-primary transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">DC Report</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Report Category <span className="text-rose-500">*</span></Label>
            <Select value={category}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DC Report">DC Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Report Type <span className="text-rose-500">*</span></Label>
            <Select value={type}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Date Wise">Date Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date</Label>
            <Input type="date" className="bg-white h-10 border-gray-300" placeholder="yyyy-mm-dd" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date</Label>
            <Input type="date" className="bg-white h-10 border-gray-300" placeholder="yyyy-mm-dd" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Item <span className="text-rose-500">*</span></Label>
            <Select defaultValue="all">
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Plant <span className="text-rose-500">*</span></Label>
            <Select defaultValue="all">
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-8">
          <Button className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white px-8 h-10">Generate</Button>
          <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 h-10">Clear</Button>
        </div>
      </div>

      <div className="h-64 flex items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-lg">
        Report preview will appear here after generation
      </div>
    </div>
  );
}
