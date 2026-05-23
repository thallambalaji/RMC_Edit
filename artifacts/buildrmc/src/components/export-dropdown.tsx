import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface ExportDropdownProps {
  onCopy: () => void;
  onCSV: () => void;
  onPDF: () => void;
}

export function ExportDropdown({ onCopy, onCSV, onPDF }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-7 px-2.5 text-[9px] font-black uppercase text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-none cursor-pointer flex items-center gap-1 focus:ring-[#1e40af] select-none"
        >
          Export Data
          <ChevronDown className="h-3 w-3 text-gray-500 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-md rounded-md p-1 min-w-[110px] no-print">
        <DropdownMenuItem
          onClick={onPDF}
          className="flex items-center gap-2 px-2 py-1.5 text-[9px] font-bold uppercase text-gray-600 hover:bg-slate-100 hover:text-gray-900 rounded-sm cursor-pointer transition-colors"
        >
          <span>📄</span> PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCSV}
          className="flex items-center gap-2 px-2 py-1.5 text-[9px] font-bold uppercase text-gray-600 hover:bg-slate-100 hover:text-gray-900 rounded-sm cursor-pointer transition-colors"
        >
          <span>📊</span> CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCopy}
          className="flex items-center gap-2 px-2 py-1.5 text-[9px] font-bold uppercase text-gray-600 hover:bg-slate-100 hover:text-gray-900 rounded-sm cursor-pointer transition-colors"
        >
          <span>📋</span> Copy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
