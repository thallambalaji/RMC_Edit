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
  FileText,
  FlaskConical,
  TestTube,
  Layers,
  Settings,
  ChevronRight,
  Home,
} from "lucide-react";

interface QcLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
}

export function QcLayout({ children, activePath, breadcrumbs, title }: QcLayoutProps) {
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
    if (currentPath.includes("/mix-design")) return ["mix-design"];
    if (currentPath.includes("/recipe")) return ["recipe"];
    if (currentPath.includes("/cube-test")) return ["cube-test"];
    if (currentPath.includes("/batch")) return ["batch-list"];
    if (currentPath.includes("/settings")) return ["qc-settings"];
    return [];
  };

  return (
    <div className="flex h-full gap-4 bg-[#f8fafc] p-4 relative min-h-screen">
      {/* Sidebar with Collapsible Accordion Navigation matching Sales Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 print:hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase">QC Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-4">
          {/* Primary Sidebar Action Button updated to Add Mix Design */}
          <div className="px-1">
            <Link href="/qc/mix-design/new">
              <Button className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] h-10 text-xs font-black shadow-md shadow-blue-500/10 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
                <Plus className="h-4.5 w-4.5" /> Add Mix Design
              </Button>
            </Link>
          </div>

          <Accordion
            type="multiple"
            defaultValue={getDefaultAccordions()}
            className="w-full space-y-2.5"
          >
            {/* 1. Mix Design Dropdown */}
            <AccordionItem
              value="mix-design"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-[#1e40af]" /> Mix Design
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/qc/mix-design/new">
                    <div className={getLinkClass("/qc/mix-design/new")}>
                      <span>Add Mix Design</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/qc/mix-design/list">
                    <div className={getLinkClass("/qc/mix-design/list")}>
                      <span>Mix Design List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Recipe Dropdown */}
            <AccordionItem
              value="recipe"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4.5 w-4.5 text-emerald-600" /> Recipe
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/qc/recipe/new">
                    <div className={getLinkClass("/qc/recipe/new")}>
                      <span>Add Recipe</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/qc/recipe/list">
                    <div className={getLinkClass("/qc/recipe/list")}>
                      <span>Recipe List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Cube Test Dropdown */}
            <AccordionItem
              value="cube-test"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4.5 w-4.5 text-rose-500" /> Cube Test
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/qc/cube-test/new">
                    <div className={getLinkClass("/qc/cube-test/new")}>
                      <span>Add Cube Test</span>
                      <Plus className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/qc/cube-test/list">
                    <div className={getLinkClass("/qc/cube-test/list")}>
                      <span>Cube Test List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/qc/cube-test/report">
                    <div className={getLinkClass("/qc/cube-test/report")}>
                      <span>Cube Test Report</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Batch List Dropdown */}
            <AccordionItem
              value="batch-list"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-amber-500" /> Batch List
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/qc/batch/list">
                    <div className={getLinkClass("/qc/batch/list")}>
                      <span>Batching List</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                  <Link href="/qc/batch/report">
                    <div className={getLinkClass("/qc/batch/report")}>
                      <span>Batching Report</span>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </div>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. QC Setting Dropdown */}
            <AccordionItem
              value="qc-settings"
              className="border-none rounded-lg bg-slate-50/50 shadow-sm overflow-hidden border border-slate-100/80"
            >
              <AccordionTrigger className="hover:no-underline hover:bg-slate-100/50 px-3 py-2.5 text-xs font-black uppercase text-slate-700 tracking-wider transition-colors">
                <div className="flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-gray-600" /> QC Setting
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white pb-2.5 pt-1.5 border-t border-slate-100">
                <div className="flex flex-col space-y-1.5 px-2">
                  <Link href="/qc/settings">
                    <div className={getLinkClass("/qc/settings")}>
                      <span>QC Setting</span>
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
        {/* Unified Top Header & Breadcrumbs Row */}
        <div className="flex items-center justify-between bg-white py-3.5 px-5 rounded-lg border border-slate-200 shadow-sm shrink-0 print:hidden">
          <div className="flex items-center">
            <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider select-none">
              {title}
            </h2>
            <div className="h-4 w-px bg-slate-300 mx-4" />
            <nav className="text-[10px] text-slate-500 flex items-center uppercase font-bold tracking-widest select-none">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                <span>HOME</span>
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <Link href="/qc" className="hover:text-blue-600 transition-colors">
                QC
              </Link>
              {breadcrumbs.map((bc, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={idx} className="flex items-center">
                    <span className="text-slate-400 font-black mx-2.5">&gt;</span>
                    {isLast ? (
                      <span className="text-blue-600 font-black">{bc.label.toUpperCase()}</span>
                    ) : (
                      bc.href ? (
                        <Link href={bc.href} className="hover:text-blue-600 transition-colors">
                          {bc.label.toUpperCase()}
                        </Link>
                      ) : (
                        <span>{bc.label.toUpperCase()}</span>
                      )
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Filters Button matching the screenshot */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-black text-slate-800 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 px-3 rounded shadow-xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-700"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
            </Button>
          </div>
        </div>

        {/* Children Page Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
