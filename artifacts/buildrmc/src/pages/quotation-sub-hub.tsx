import { Link } from "wouter";
import { ChevronRight, FilePlus, FileText } from "lucide-react";

export default function QuotationSubHub() {
  const actions = [
    {
      href: "/customer-po/quotation/new",
      label: "Add Customer Quotation",
      icon: FilePlus,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      href: "/customer-po/quotation/list",
      label: "Customer Quotation List",
      icon: FileText,
      color: "bg-[#3DB9C1] hover:bg-[#2ea4ac]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Quotation</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Customer Quotation</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {actions.map((action) => (
            <Link 
              key={action.href} 
              href={action.href}
              className={`${action.color} text-white rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-md group`}
            >
              <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition-colors">
                <action.icon className="h-10 w-10" />
              </div>
              <div className="text-lg font-bold leading-tight">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-400 text-sm italic">
        Manage pricing quotations and estimates for your clients
      </div>
    </div>
  );
}
