import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  ChevronRight,
  Home,
  Truck,
  User,
  Settings,
  Shield,
  Zap,
  Flame,
} from "lucide-react";

interface TransportLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
}

export function TransportLayout({ children, activePath, breadcrumbs, title }: TransportLayoutProps) {
  const [location] = useLocation();
  const currentPath = activePath || location;

  // Active item style helper
  const isLinkActive = (path: string) => {
    return currentPath === path;
  };

  const getLinkClass = (path: string) => {
    return `text-xs font-bold transition-all cursor-pointer py-2.5 px-3.5 rounded-md flex items-center justify-between shadow-sm border ${
      isLinkActive(path)
        ? "bg-[#1e40af] text-white border-[#1e40af] shadow-md shadow-blue-500/10 font-extrabold"
        : "text-slate-600 bg-white border-slate-100 hover:text-[#1e40af] hover:bg-slate-50 hover:border-slate-200"
    }`;
  };

  // Determine default value for accordion based on current path
  const getDefaultAccordions = () => {
    return ["master", "driver", "pump", "diesel", "setting", "security"];
  };

  return (
    <div className="flex h-full gap-4 bg-[#f8fafc] p-4 relative min-h-screen">
      {/* Sidebar with Collapsible Accordion Navigation matching DC & QC Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 print:hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase">Transport Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-4">
          {/* Primary Action Button */}
          <div className="px-1">
            <Link href="/transport/vehicle/new">
              <Button className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] h-10 text-xs font-black shadow-md shadow-blue-500/10 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
                <Plus className="h-4.5 w-4.5" /> Add Vehicle
              </Button>
            </Link>
          </div>

          <Accordion
            type="multiple"
            defaultValue={getDefaultAccordions()}
            className="w-full space-y-2.5"
          >
            {/* 1. Transport Master Dropdown */}
            <AccordionItem
              value="master"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-[#1e40af]" /> Transport Master
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/transport/vehicle/new">
                    <div className={getLinkClass("/transport/vehicle/new")}>
                      <span>Add Vehicle</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/vehicle/list">
                    <div className={getLinkClass("/transport/vehicle/list")}>
                      <span>Vehicles List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Driver Dropdown */}
            <AccordionItem
              value="driver"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-[#1e40af]" /> Driver
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/transport/driver/new">
                    <div className={getLinkClass("/transport/driver/new")}>
                      <span>Drivers</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/driver/list">
                    <div className={getLinkClass("/transport/driver/list")}>
                      <span>Drivers List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Pump&DG Dropdown */}
            <AccordionItem
              value="pump"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="h-4.5 w-4.5 text-[#1e40af]" /> Pump&DG
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/transport/pump-dg/new">
                    <div className={getLinkClass("/transport/pump-dg/new")}>
                      <span>Pump & DG</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/pump-dg/list">
                    <div className={getLinkClass("/transport/pump-dg/list")}>
                      <span>Pump & DG List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Diesel Consumption Dropdown */}
            <AccordionItem
              value="diesel"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Flame className="h-4.5 w-4.5 text-[#1e40af]" /> Diesel Consumption
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/transport/diesel/new">
                    <div className={getLinkClass("/transport/diesel/new")}>
                      <span>Diesel Consumption</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/diesel/list">
                    <div className={getLinkClass("/transport/diesel/list")}>
                      <span>Consumption List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/diesel/report">
                    <div className={getLinkClass("/transport/diesel/report")}>
                      <span>Consumption Report</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Setting Dropdown */}
            <AccordionItem
              value="setting"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-[#1e40af]" /> Setting
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/transport/settings">
                    <div className={getLinkClass("/transport/settings")}>
                      <span>Transport Setting</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Security Dropdown */}
            <AccordionItem
              value="security"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-[#1e40af]" /> Security
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/transport/security/new">
                    <div className={getLinkClass("/transport/security/new")}>
                      <span>Security Check</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/security/list">
                    <div className={getLinkClass("/transport/security/list")}>
                      <span>Security Check List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/transport/security/report">
                    <div className={getLinkClass("/transport/security/report")}>
                      <span>Security Check Report</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-3 min-w-0">
        {/* Header Breadcrumbs Row */}
        <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">
              {title}
            </h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">
                Home
              </Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/transport/vehicle/list" className="hover:text-[#1e40af] transition-colors">
                Transport
              </Link>
              {breadcrumbs.map((b, index) => (
                <div key={index} className="flex items-center gap-1">
                  <ChevronRight className="h-2.5 w-2.5" />
                  {b.href ? (
                    <Link href={b.href} className="hover:text-[#1e40af] transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-[#1e40af]">{b.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Dynamic Inner Children */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
