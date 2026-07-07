import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  useGetMasters, 
  useCreateMaster, 
  useDeleteMaster 
} from "@workspace/api-client-react";
import { 
  ChevronRight, 
  Database, 
  MapPin, 
  Layers, 
  Sparkles, 
  X, 
  Plus, 
  Trash2, 
  Loader2,
  FlaskConical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TabId = "source" | "locality" | "material" | "grade";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  placeholder: string;
  columnLabel: string;
}

const tabs: TabConfig[] = [
  {
    id: "source",
    label: "Enquiry Source",
    icon: Sparkles,
    color: "text-[#ea580c]",
    gradient: "from-cyan-500 to-[#ea580c]",
    placeholder: "Enter Enquiry Source (e.g. Website, Walk-in)...",
    columnLabel: "Enquiry Source",
  },
  {
    id: "locality",
    label: "Locality",
    icon: MapPin,
    color: "text-emerald-600",
    gradient: "from-emerald-500 to-green-500",
    placeholder: "Enter Locality / Area name...",
    columnLabel: "Locality Name",
  },
  {
    id: "material",
    label: "Material Type",
    icon: Layers,
    color: "text-purple-600",
    gradient: "from-purple-500 to-violet-500",
    placeholder: "Enter Material Type...",
    columnLabel: "Material Type",
  },
  {
    id: "grade",
    label: "Concrete Grade",
    icon: FlaskConical,
    color: "text-amber-600",
    gradient: "from-amber-500 to-yellow-500",
    placeholder: "Enter Concrete Grade (e.g. M-25, M-30)...",
    columnLabel: "Grade Name",
  },
];

export default function SalesMaster() {
  const [activeTab, setActiveTab] = useState<TabId>("source");
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const { data: masters, isLoading } = useGetMasters(activeTab);
  const createMaster = useCreateMaster();
  const deleteMaster = useDeleteMaster();

  const currentTab = useMemo(() => tabs.find(t => t.id === activeTab)!, [activeTab]);

  const handleAdd = async () => {
    const name = inputValue.trim();
    if (!name) return;
    
    try {
      await createMaster.mutateAsync({ type: activeTab, name });
      setInputValue("");
      toast({ title: `${currentTab.label} added successfully` });
    } catch (error) {
      toast({ title: "Failed to add entry", variant: "destructive" });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteMaster.mutateAsync(id);
      toast({ title: "Entry deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ea580c] to-blue-500 shadow-lg shadow-cyan-200">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Sales Master</h2>
            <p className="text-sm text-gray-400 mt-0.5">Configure core sales lookup and master data</p>
          </div>
        </div>
        <nav className="text-xs text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-wider">
          <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/sales" className="hover:text-[#ea580c] transition-colors">Sales</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#ea580c]">Sales Master</span>
        </nav>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1 p-3 bg-gray-50/70 border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105 z-10`
                    : "text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-sm"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : tab.color}`} />
                {tab.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div key={activeTab} className="p-8 flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-300">
          {/* Input Row */}
          <div className="flex gap-3 mb-10 items-center max-w-4xl">
            <div className="flex-1 relative group">
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder={currentTab.placeholder}
                disabled={createMaster.isPending}
                className="h-12 border-gray-200 rounded-xl pl-5 pr-4 text-sm bg-white hover:border-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ea580c] transition-all duration-200 shadow-sm"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={createMaster.isPending || !inputValue.trim()}
              className={`bg-gradient-to-r ${currentTab.gradient} hover:opacity-90 text-white h-12 px-8 font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 gap-2 whitespace-nowrap`}
            >
              {createMaster.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              ADD {currentTab.label.toUpperCase()}
            </Button>
          </div>

          {/* Data Table */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex-1 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className={`text-white font-bold h-12 py-0 text-[10px] uppercase tracking-widest bg-gradient-to-r ${currentTab.gradient} border-0 w-24 text-center`}>
                    S/L No
                  </TableHead>
                  <TableHead className={`text-white font-bold h-12 py-0 text-[10px] uppercase tracking-widest bg-gradient-to-r ${currentTab.gradient} border-0`}>
                    {currentTab.columnLabel}
                  </TableHead>
                  <TableHead className={`text-white font-bold h-12 py-0 text-[10px] uppercase tracking-widest bg-gradient-to-r ${currentTab.gradient} border-0 w-32 text-center`}>
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
                        <p className="text-sm font-medium text-gray-400">Loading master data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(masters) || masters.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${currentTab.gradient} opacity-10 flex items-center justify-center`}>
                          <currentTab.icon className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-500">
                            {!Array.isArray(masters) ? "Error loading data" : `No ${currentTab.label} records found`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {!Array.isArray(masters) ? "Please check your connection or contact support" : "Start by adding your first entry above"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  masters.map((item: any, idx: number) => (
                    <TableRow key={item.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors duration-200 group/row">
                      <TableCell className="text-center py-4 border-r border-gray-50">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black bg-gray-100 text-gray-400 group-hover/row:bg-[#ea580c] group-hover/row:text-white transition-all duration-300">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700 font-bold text-sm py-4 px-6">{item.name}</TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleRemove(item.id)}
                            className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500 transition-all duration-300 opacity-0 group-hover/row:opacity-100 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && masters && masters.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-gray-400 px-2">
              <span className="uppercase tracking-widest">Total {currentTab.label} Entries: {masters.length}</span>
              <span className="text-[#ea580c] italic">Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
