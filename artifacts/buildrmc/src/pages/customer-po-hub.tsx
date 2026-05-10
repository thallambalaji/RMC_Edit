import { Link } from "wouter";
import { ChevronRight, Users, ShoppingCart, CalendarClock, FileSignature } from "lucide-react";

export default function CustomerPOHub() {
  const actions = [
    {
      href: "/customer-po/customer",
      label: "Customer",
      icon: Users,
      color: "bg-[#3DB9C1] hover:bg-[#2ea4ac]",
    },
    {
      href: "/customer-po/sales-order",
      label: "Sales Order",
      icon: ShoppingCart,
      color: "bg-cyan-600 hover:bg-cyan-700",
    },
    {
      href: "/customer-po/scheduling",
      label: "Scheduling",
      icon: CalendarClock,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      href: "/customer-po/quotation",
      label: "Customer Quotation",
      icon: FileSignature,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer & PO Dashboard</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Customer & PO</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {actions.map((action) => (
            <Link 
              key={action.href} 
              href={action.href}
              className={`${action.color} text-white rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-md group`}
            >
              <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition-colors">
                <action.icon className="h-10 w-10" />
              </div>
              <div className="text-xl font-bold leading-tight">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-400 text-sm italic">
        Select a category to manage customers and sales orders
      </div>
    </div>
  );
}
