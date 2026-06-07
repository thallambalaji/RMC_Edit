import { Link } from "wouter";
import { ChevronRight, Ticket, Plus, List, BarChart3 } from "lucide-react";

export default function WeighmentHub() {
  const actions = [
    {
      href: "/dc/weighment/tickets",
      label: "Tickets",
      icon: Ticket,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
    {
      href: "/dc/weighment/new",
      label: "Add Weighment",
      icon: Plus,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      href: "/dc/weighment/list",
      label: "Weighment List",
      icon: List,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
    {
      href: "/dc/weighment/report",
      label: "Weighment Report",
      icon: BarChart3,
      color: "bg-[#ea580c] hover:bg-[#d97706]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weighment</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dc" className="hover:text-primary transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Weighment</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        Select a weighment action to continue
      </div>
    </div>
  );
}
