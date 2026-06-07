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
  Archive,
  Filter,
  Settings2,
} from "lucide-react";
import { createContext, useContext, useState, useEffect } from "react";

let storeFiltersState = true;
const storeSubscribers = new Set<(val: boolean) => void>();

export const toggleStoreFiltersGlobal = () => {
  storeFiltersState = !storeFiltersState;
  storeSubscribers.forEach(sub => sub(storeFiltersState));
};

export const StoreFiltersContext = createContext<{
  showFilters: boolean;
  toggleFilters: () => void;
}>({
  showFilters: true,
  toggleFilters: () => {},
});

export const useStoreFilters = () => {
  const [showFilters, setShowFilters] = useState(storeFiltersState);
  useEffect(() => {
    storeSubscribers.add(setShowFilters);
    return () => {
      storeSubscribers.delete(setShowFilters);
    };
  }, []);
  return {
    showFilters,
    toggleFilters: toggleStoreFiltersGlobal
  };
};

interface StoreLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  showFilterButton?: boolean;
}

export function StoreLayout({ children, activePath, breadcrumbs, title, showFilterButton = true }: StoreLayoutProps) {
  const [location] = useLocation();
  const currentPath = activePath || location;
  const { showFilters, toggleFilters } = useStoreFilters();

  const getLinkClass = (path: string) => {
    return `text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer block border ${
      currentPath === path
        ? "bg-[#fff7ed] text-[#ea580c] border-orange-100/50 shadow-sm font-extrabold"
        : "text-slate-600 hover:text-[#ea580c] hover:bg-orange-50/40 border-transparent hover:border-orange-100/50"
    }`;
  };

  const getDefaultAccordions = (): string[] => {
    if (currentPath.startsWith("/store/inventory")) return ["inventory"];
    if (currentPath.startsWith("/store/settings")) return ["store-settings"];
    return [];
  };

  return (
    <StoreFiltersContext.Provider value={{ showFilters, toggleFilters }}>
      <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-transparent">
        {/* Sidebar */}
        <div className="w-60 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Store Navigation</h3>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <Accordion
              type="multiple"
              defaultValue={getDefaultAccordions()}
              className="w-full space-y-2"
            >
              {/* Inventory Accordion */}
              <AccordionItem
                value="inventory"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-[#ea580c]" /> Inventory
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/store/inventory/ticket">
                      <div className={getLinkClass("/store/inventory/ticket")}>
                        Inventory Ticket
                      </div>
                    </Link>
                    <Link href="/store/inventory/new">
                      <div className={getLinkClass("/store/inventory/new")}>
                        Add Inventory
                      </div>
                    </Link>
                    <Link href="/store/inventory/list">
                      <div className={getLinkClass("/store/inventory/list")}>
                        Inventory List
                      </div>
                    </Link>
                    <Link href="/store/inventory/modified">
                      <div className={getLinkClass("/store/inventory/modified")}>
                        Modified List
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Store Settings Accordion */}
              <AccordionItem
                value="store-settings"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-[#ea580c]" /> Store Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/store/settings/items">
                      <div className={getLinkClass("/store/settings/items")}>
                        Store Items
                      </div>
                    </Link>
                    <Link href="/store/settings">
                      <div className={getLinkClass("/store/settings")}>
                        Store Setting
                      </div>
                    </Link>
                    <Link href="/store/settings/suppliers">
                      <div className={getLinkClass("/store/settings/suppliers")}>
                        Add Supplier
                      </div>
                    </Link>
                    <Link href="/store/settings/assets">
                      <div className={getLinkClass("/store/settings/assets")}>
                        Asset's Master
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
                <Link href="/store" className="hover:text-[#ea580c] transition-colors">Store</Link>
                {breadcrumbs.map((bc, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5" />
                      {isLast ? (
                        <span className="text-[#ea580c]">{bc.label}</span>
                      ) : (
                        bc.href ? (
                          <Link href={bc.href} className="hover:text-[#ea580c] transition-colors">
                            {bc.label}
                          </Link>
                        ) : (
                          <span>{bc.label}</span>
                        )
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Header Action Buttons */}
            <div className="flex gap-2">
              <Link href="/store/inventory/new">
                <Button size="sm" className="bg-[#ea580c] hover:bg-[#d97706] text-white font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded-lg transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add Inventory
                </Button>
              </Link>
              {showFilterButton ? (
                <Button
                  size="sm"
                  onClick={toggleFilters}
                  className={`font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showFilters ? "bg-orange-50 border-orange-200 text-[#ea580c]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="h-3 w-3" /> Filters
                </Button>
              ) : null}
            </div>
          </div>

          {/* Children Page Content */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </StoreFiltersContext.Provider>
  );
}
