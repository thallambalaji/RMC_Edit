import { Link } from "wouter";
import { ChevronRight, FileSearch, FileStack, FileText, ClipboardList, BarChart3 } from "lucide-react";

export default function RMCReportHub() {
  const reports = [
    {
      href: "/billing/invoice-report",
      label: "Invoice Report",
      icon: FileSearch,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
    {
      href: "/billing/consolidate-invoice-list",
      label: "Consolidate Invoice List",
      icon: FileStack,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
    {
      href: "/billing/generate-annexure",
      label: "Generate Annexure",
      icon: FileText,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
    {
      href: "/billing/debit-credit-note-list",
      label: "Debit Credit Note List",
      icon: ClipboardList,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">RMC Report</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/billing" className="hover:text-primary transition-colors">Billing</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">RMC Report</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reports.map((report) => (
            <Link 
              key={report.href} 
              href={report.href}
              className={`${report.color} text-white rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-md group`}
            >
              <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition-colors">
                <report.icon className="h-10 w-10" />
              </div>
              <div className="text-lg font-bold leading-tight">{report.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-400 text-sm italic">
        Select a report type to continue
      </div>
    </div>
  );
}
