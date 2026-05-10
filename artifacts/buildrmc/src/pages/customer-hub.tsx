import { Link } from "wouter";
import { ChevronRight, UserPlus, Users, Warehouse } from "lucide-react";

export default function CustomerHub() {
  const actions = [
    {
      href: "/customers/new",
      label: "New Customer",
      icon: UserPlus,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      href: "/customers/list",
      label: "Customer List",
      icon: Users,
      color: "bg-[#1e40af] hover:bg-[#1d4ed8]",
    },
    {
      href: "/customers/godowns",
      label: "Godowns",
      icon: Warehouse,
      color: "bg-cyan-600 hover:bg-cyan-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Customers</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
        Manage your client relationships, sites, and inventory storage locations
      </div>
    </div>
  );
}
