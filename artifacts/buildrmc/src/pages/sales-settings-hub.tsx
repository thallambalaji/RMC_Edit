import { Link } from "wouter";
import { ChevronRight, Database } from "lucide-react";

export default function SalesSettingsHub() {
  const actions = [
    {
      href: "/sales/settings/master",
      label: "Sales Master",
      icon: Database,
      color: "bg-[#1e40af] hover:bg-[#1d4ed8]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Settings</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/sales" className="hover:text-primary transition-colors">Sales</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Sales Settings</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
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
        Configure master data values and settings for the sales modules
      </div>
    </div>
  );
}
