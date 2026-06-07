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
  Truck,
  User,
  Settings,
  Shield,
  Zap,
  Flame,
  Filter,
} from "lucide-react";
import { createContext, useContext, useState, useEffect } from "react";

let transportFiltersState = true;
const transportSubscribers = new Set<(val: boolean) => void>();

export const toggleTransportFiltersGlobal = () => {
  transportFiltersState = !transportFiltersState;
  transportSubscribers.forEach(sub => sub(transportFiltersState));
};

export const TransportFiltersContext = createContext<{
  showFilters: boolean;
  toggleFilters: () => void;
}>({
  showFilters: true,
  toggleFilters: () => {},
});

export const useTransportFilters = () => {
  const [showFilters, setShowFilters] = useState(transportFiltersState);
  useEffect(() => {
    transportSubscribers.add(setShowFilters);
    return () => {
      transportSubscribers.delete(setShowFilters);
    };
  }, []);
  return {
    showFilters,
    toggleFilters: toggleTransportFiltersGlobal
  };
};

interface TransportLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
}

export function TransportLayout({ children, activePath, breadcrumbs, title }: TransportLayoutProps) {
  const [location] = useLocation();
  const currentPath = activePath || location;
  const { showFilters, toggleFilters } = useTransportFilters();

  const getLinkClass = (path: string) => {
    return `text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer block border ${
      currentPath === path
        ? "bg-[#fff7ed] text-[#ea580c] border-orange-100/50 shadow-sm font-extrabold"
        : "text-slate-600 hover:text-[#ea580c] hover:bg-orange-50/40 border-transparent hover:border-orange-100/50"
    }`;
  };

  const getDefaultAccordions = (): string[] => {
    if (currentPath.startsWith("/transport/vehicle")) return ["master"];
    if (currentPath.startsWith("/transport/driver")) return ["driver"];
    if (currentPath.startsWith("/transport/pump-dg")) return ["pump"];
    if (currentPath.startsWith("/transport/diesel")) return ["diesel"];
    if (currentPath.startsWith("/transport/settings")) return ["setting"];
    if (currentPath.startsWith("/transport/security")) return ["security"];
    return [];
  };

  return (
    <TransportFiltersContext.Provider value={{ showFilters, toggleFilters }}>
      <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-transparent">
        {/* Sidebar */}
        <div className="w-60 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Transport Navigation</h3>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <Accordion
              type="multiple"
              defaultValue={getDefaultAccordions()}
              className="w-full space-y-2"
            >
              {/* 1. Transport Master Dropdown */}
              <AccordionItem
                value="master"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#ea580c]" /> Transport Master
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/transport/vehicle/new">
                      <div className={getLinkClass("/transport/vehicle/new")}>
                        Add Vehicle
                      </div>
                    </Link>
                    <Link href="/transport/vehicle/list">
                      <div className={getLinkClass("/transport/vehicle/list")}>
                        Vehicles List
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Driver Dropdown */}
              <AccordionItem
                value="driver"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#ea580c]" /> Driver
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/transport/driver/new">
                      <div className={getLinkClass("/transport/driver/new")}>
                        New Drivers
                      </div>
                    </Link>
                    <Link href="/transport/driver/list">
                      <div className={getLinkClass("/transport/driver/list")}>
                        Drivers List
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Pump & DG Dropdown */}
              <AccordionItem
                value="pump"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#ea580c]" /> Pump & DG
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/transport/pump-dg/new">
                      <div className={getLinkClass("/transport/pump-dg/new")}>
                        Pump & DG
                      </div>
                    </Link>
                    <Link href="/transport/pump-dg/list">
                      <div className={getLinkClass("/transport/pump-dg/list")}>
                        Pump & DG List
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Diesel Consumption Dropdown */}
              <AccordionItem
                value="diesel"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#ea580c]" /> Diesel Consumption
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/transport/diesel/new">
                      <div className={getLinkClass("/transport/diesel/new")}>
                        Diesel Consumption
                      </div>
                    </Link>
                    <Link href="/transport/diesel/list">
                      <div className={getLinkClass("/transport/diesel/list")}>
                        Consumption List
                      </div>
                    </Link>
                    <Link href="/transport/diesel/report">
                      <div className={getLinkClass("/transport/diesel/report")}>
                        Consumption Report
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Setting Dropdown */}
              <AccordionItem
                value="setting"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#ea580c]" /> Setting
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/transport/settings">
                      <div className={getLinkClass("/transport/settings")}>
                        General Setting
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Security Dropdown */}
              <AccordionItem
                value="security"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#ea580c]" /> Security
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/transport/security/new">
                      <div className={getLinkClass("/transport/security/new")}>
                        Add Security Check
                      </div>
                    </Link>
                    <Link href="/transport/security/list">
                      <div className={getLinkClass("/transport/security/list")}>
                        Security Check List
                      </div>
                    </Link>
                    <Link href="/transport/security/report">
                      <div className={getLinkClass("/transport/security/report")}>
                        Security Check Report
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col space-y-3.5 min-w-0 pr-1">
          {/* Standardized Header Bar matching Customer & PO Reference Design */}
          <div className="flex items-center justify-between bg-white p-2.5 px-4 rounded-2xl border border-slate-100 shadow-sm shrink-0 no-print">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">
                {title}
              </h2>
              <div className="h-4 w-px bg-slate-200" />
              <nav className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
                <ChevronRight className="h-2.5 w-2.5" />
                <Link href="/transport/vehicle/list" className="hover:text-[#ea580c] transition-colors">Transport</Link>
                {breadcrumbs.map((b, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={index} className="flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5" />
                      {isLast ? (
                        <span className="text-[#ea580c]">{b.label}</span>
                      ) : (
                        b.href ? (
                          <Link href={b.href} className="hover:text-[#ea580c] transition-colors">
                            {b.label}
                          </Link>
                        ) : (
                          <span>{b.label}</span>
                        )
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href="/transport/vehicle/new">
                <Button size="sm" className="bg-[#ea580c] hover:bg-[#d97706] text-white font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded-lg transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add Vehicle
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={toggleFilters}
                className={`font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                  showFilters ? "bg-orange-50 border-orange-200 text-[#ea580c]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Filter className="h-3 w-3" /> Filters
              </Button>
            </div>
          </div>

          {/* Dynamic Inner Children */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </TransportFiltersContext.Provider>
  );
}
