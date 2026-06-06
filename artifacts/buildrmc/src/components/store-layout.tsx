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
    return `text-xs font-medium py-2 px-3 rounded-md transition-all cursor-pointer block border ${
      currentPath === path
        ? "bg-[#1e40af] text-white border-[#1e40af] shadow font-bold"
        : "text-gray-600 hover:text-[#1e40af] hover:bg-white border-transparent hover:border-gray-200 shadow-sm hover:shadow"
    }`;
  };

  // Only expand the accordion section that matches the current active path.
  // All others remain collapsed until the user manually clicks them.
  const getDefaultAccordions = (): string[] => {
    if (currentPath.startsWith("/store/inventory")) return ["inventory"];
    if (currentPath.startsWith("/store/settings")) return ["store-settings"];
    return [];
  };

  return (
    <StoreFiltersContext.Provider value={{ showFilters, toggleFilters }}>
      <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-white">
        {/* Sidebar */}
        <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-800 text-sm">Store Navigation</h3>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Accordion
              type="multiple"
              defaultValue={getDefaultAccordions()}
              className="w-full space-y-1"
            >
              {/* Inventory Accordion */}
              <AccordionItem
                value="inventory"
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-emerald-600" /> Inventory
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
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
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-sky-600" /> Store Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
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
        <div className="flex-1 flex flex-col space-y-3 min-w-0">
          {/* Standardized Header Bar matching Customer & PO Reference Design */}
          <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">
                {title}
              </h2>
              <div className="h-4 w-px bg-gray-300" />
              <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
                <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
                <ChevronRight className="h-2.5 w-2.5 text-gray-400" />
                <Link href="/store/inventory/list" className="hover:text-[#1e40af] transition-colors">Store</Link>
                {breadcrumbs.map((bc, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5 text-gray-400" />
                      {isLast ? (
                        <span className="text-[#1e40af]">{bc.label}</span>
                      ) : (
                        bc.href ? (
                          <Link href={bc.href} className="hover:text-[#1e40af] transition-colors">
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
                <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded">
                  <Plus className="h-3.5 w-3.5" /> Add Inventory
                </Button>
              </Link>
              {showFilterButton ? (
                <Button
                  size="sm"
                  onClick={toggleFilters}
                  className={`font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border flex items-center gap-1.5 cursor-pointer rounded ${
                    showFilters ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
