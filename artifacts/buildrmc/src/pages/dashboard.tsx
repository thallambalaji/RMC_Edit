import { useState, useMemo } from "react";
import { 
  useDashboardAccountsOverview,
  useDashboardInvoiceOverview,
  useDashboardDcOverview,
  useDashboardInventoryOverview,
  useDashboardAverageOverview,
  useDashboardSchedulingOverview,
  useDashboardPaymentFollowup,
  useDashboardCurrentStock,
  useDashboardStats
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Search, FileText, Truck, CalendarCheck, Package, 
  CreditCard, Boxes, Activity, Clock, FileWarning, ShoppingCart, TestTube,
  Printer, Copy, Download, Trash2, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const KpiCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
  <div className="rounded-xl p-4 flex items-center gap-4 bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
    <div className={`p-3 rounded-xl ${colorClass} text-white shadow-sm`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 leading-none">{value}</h3>
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon, action }: any) => (
  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
    <h3 className="text-[13px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#1e40af]" /> {title}
    </h3>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const FilterBar = ({ plant, setPlant, fromDate, setFromDate, toDate, setToDate, onClear }: any) => (
  <div className="flex gap-2 items-center flex-wrap bg-white p-3 border-b border-slate-100">
    <div className="w-[140px]">
      <Select value={plant} onValueChange={setPlant}>
        <SelectTrigger className="h-8 text-xs font-semibold bg-slate-50"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="All Plant">All Plants</SelectItem>
          <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
          <SelectItem value="MARVAL RMC">MARVAL RMC</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs font-semibold w-[145px] bg-slate-50 px-2" />
    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs font-semibold w-[145px] bg-slate-50 px-2" />
    <Button size="sm" className="h-8 bg-[#1e40af] hover:bg-[#2a8f95] text-xs font-bold text-white px-4 shadow-sm cursor-pointer">
      <Search className="h-3 w-3 mr-1.5" /> Search
    </Button>
    <Button size="sm" onClick={onClear} className="h-8 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 px-4 shadow-sm border border-slate-200 cursor-pointer">
      Clear
    </Button>
  </div>
);

export default function Dashboard() {
  const { toast } = useToast();
  const [plant, setPlant] = useState("All Plant");
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [printData, setPrintData] = useState<any>(null);

  const filterParams = { plant, from: fromDate, to: toDate };

  const { data: accounts } = useDashboardAccountsOverview();
  const { data: invoices } = useDashboardInvoiceOverview(filterParams);
  const { data: dcs } = useDashboardDcOverview(filterParams);
  const { data: inventory } = useDashboardInventoryOverview(filterParams);
  const { data: average } = useDashboardAverageOverview({ plant, lastMonths: 3 });
  const { data: scheduling } = useDashboardSchedulingOverview(filterParams);
  const { data: paymentFollowup } = useDashboardPaymentFollowup();
  const { data: currentStock } = useDashboardCurrentStock();
  const { data: stats } = useDashboardStats();

  const handleClearFilters = () => {
    setPlant("All Plant");
    setFromDate(format(new Date(), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
    toast({ title: "Filters Cleared", description: "Dashboard view reset to today's operations." });
  };

  const handlePrintCard = (title: string, headers: string[], rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast({ title: "Print Failed", description: "There is no row data available to print in this section.", variant: "destructive" });
      return;
    }
    setPrintData({ title, headers, rows });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyCard = (title: string, headers: string[], rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast({ title: "Copy Failed", description: "No row data to copy.", variant: "destructive" });
      return;
    }
    const text = `${title}\n${headers.join("\t")}\n${rows.map(r => r.join("\t")).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `All ${rows.length} rows from ${title} copied to clipboard.` });
  };

  const handleCSVCard = (title: string, headers: string[], rows: any[]) => {
    if (!rows || rows.length === 0) {
      toast({ title: "Export Failed", description: "No row data available to export.", variant: "destructive" });
      return;
    }
    const csvContent = `${headers.join(",")}\n${rows.map(r => r.map((v: any) => `"${v}"`).join(",")).join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: `${title} exported successfully.` });
  };

  const handleDeleteOverviewRow = (title: string) => {
    toast({ 
      title: "Action Not Permitted", 
      description: `Direct database deletions inside the ${title} overview aggregate table are not allowed. Please complete deletions in the main Customer or PO list pages.`, 
      variant: "destructive" 
    });
  };

  const getCardActions = (title: string, headers: string[], rows: any[]) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Actions:</span>
      <Button 
        onClick={() => handlePrintCard(title, headers, rows)}
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
        title="Print PDF with Company Letterhead"
      >
        <Printer className="h-3.5 w-3.5" />
      </Button>
      <Button 
        onClick={() => handleCopyCard(title, headers, rows)}
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded cursor-pointer"
        title="Copy Table to Clipboard"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button 
        onClick={() => handleCSVCard(title, headers, rows)}
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
        title="Export CSV"
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <Button 
        onClick={() => handleDeleteOverviewRow(title)}
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
        title="Delete Record"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const tableHeaderClass = "bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 py-2.5 px-4 tracking-wider";
  const tableCellClass = "py-2.5 px-4 text-xs font-semibold text-slate-700 border-b border-slate-50";

  // Data mappings for quick actions integrations
  const accountsData = useMemo(() => {
    return accounts?.map((r: any) => [
      r.plantName, 
      Number(r.todayInvoiceQuantity || 0).toFixed(2), 
      Number(r.todayDcQuantity || 0).toFixed(2), 
      Number(r.todaySalesDocument || 0).toFixed(2), 
      Number(r.thisMonthInvoiceQuantity || 0).toFixed(2), 
      Number(r.thisMonthDcQuantity || 0).toFixed(2), 
      Number(r.thisMonthSalesDocument || 0).toFixed(2)
    ]) || [];
  }, [accounts]);

  const invoicesData = useMemo(() => {
    return invoices?.map((r: any) => [
      r.customerName, 
      r.grade, 
      r.quantity, 
      r.noOfInvoice, 
      `₹${parseFloat(r.netAmount).toLocaleString("en-IN")}`
    ]) || [];
  }, [invoices]);

  const dcsData = useMemo(() => {
    return dcs?.map((r: any) => [
      r.customerName, 
      r.grade, 
      r.quantity, 
      r.noOfInvoice, 
      `₹${parseFloat(r.netAmount).toLocaleString("en-IN")}`
    ]) || [];
  }, [dcs]);

  const inventoryData = useMemo(() => {
    return inventory?.map((r: any) => [
      r.item, 
      r.supplier, 
      (parseFloat(r.netWeight || "0") / 1000).toFixed(2)
    ]) || [];
  }, [inventory]);

  const averageData = useMemo(() => {
    return average?.map((r: any) => [
      `${r.month} ${r.year}`, 
      Number(r.totalQuantity || 0).toFixed(2), 
      Number(r.totalLoadedQty || 0).toFixed(2), 
      `₹${Number(r.averageRate || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}`
    ]) || [];
  }, [average]);

  const schedulingData = useMemo(() => {
    return scheduling?.map((r: any) => [
      r.customerName, 
      r.site, 
      r.grade, 
      r.quantity, 
      r.startDateTime, 
      r.endDateTime
    ]) || [];
  }, [scheduling]);

  const paymentFollowupData = useMemo(() => {
    return paymentFollowup?.map((r: any) => [
      r.customerName, 
      r.nextFollowupDate, 
      r.followupDescription
    ]) || [];
  }, [paymentFollowup]);

  const currentStockData = useMemo(() => {
    return currentStock?.map((r: any) => [
      r.item, 
      Number(r.stock || 0).toFixed(2)
    ]) || [];
  }, [currentStock]);

  return (
    <>
      {/* Primary Dashboard layout: completely hidden during printing */}
      <div className="space-y-6 pb-20 max-w-[1600px] mx-auto p-4 md:p-6 print:hidden">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-8 text-white shadow-2xl mb-2">
          <div className="absolute inset-0 z-0 opacity-40">
            <img src="/construction_bg.png" alt="bg" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-[1]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-blue-500 rounded-full" />
                <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[9px]">Enterprise Operations</p>
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase italic">Fortune Mix Hub</h1>
              <p className="text-blue-100/60 font-bold uppercase tracking-[0.2em] text-[10px] max-w-md">
                 Engineering Excellence in Every Cubic Meter
              </p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-xl">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Operational Date</p>
                 <p className="text-2xl font-black tracking-tight">{format(new Date(), "MMMM dd, yyyy")}</p>
               </div>
            </div>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Pending Quotes" value={stats?.pendingQuotationCount || 0} icon={FileText} colorClass="bg-blue-500" bgClass="bg-white" />
          <KpiCard title="Pending Supp PO" value={stats?.pendingSupplierPoCount || 0} icon={ShoppingCart} colorClass="bg-indigo-500" bgClass="bg-white" />
          <KpiCard title="Pending Sched PO" value={stats?.pendingSchedulingPoCount || 0} icon={CalendarCheck} colorClass="bg-violet-500" bgClass="bg-white" />
          
          <KpiCard title="Cube Test: 7D" value={stats?.cubeTest7DaysPending || 0} icon={TestTube} colorClass="bg-rose-500" bgClass="bg-rose-50/30" />
          <KpiCard title="Cube Test: 28D" value={stats?.cubeTest28DaysPending || 0} icon={TestTube} colorClass="bg-red-600" bgClass="bg-rose-50/30" />
          <KpiCard title="New Cast Pending" value={stats?.cubeTestPendingForNewCast || 0} icon={Clock} colorClass="bg-orange-500" bgClass="bg-orange-50/30" />
        </div>

        {/* TODAY ACCOUNTS OVERVIEW */}
        <Card className="shadow-sm border-slate-200/60 overflow-hidden">
          <SectionHeader 
            title="Today Accounts Overview" 
            icon={Activity} 
            action={getCardActions(
              "Today Accounts Overview",
              ["Plant", "Today Inv Qty", "Today DC Qty", "Today Sales Doc", "Month Inv Qty", "Month DC Qty", "Month Sales Doc"],
              accountsData
            )}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={tableHeaderClass}>Plant</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right`}>Today Inv Qty</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right`}>Today DC Qty</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right`}>Today Sales Doc</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right text-[#1e40af]`}>Month Inv Qty</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right text-[#1e40af]`}>Month DC Qty</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right text-[#1e40af]`}>Month Sales Doc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                ) : accounts?.map((row: any) => (
                  <TableRow key={row.plantName} className="hover:bg-slate-50/50">
                    <TableCell className={`${tableCellClass} font-bold text-slate-800`}>{row.plantName}</TableCell>
                    <TableCell className={`${tableCellClass} text-right`}>{Number(row.todayInvoiceQuantity || 0).toFixed(2)}</TableCell>
                    <TableCell className={`${tableCellClass} text-right`}>{Number(row.todayDcQuantity || 0).toFixed(2)}</TableCell>
                    <TableCell className={`${tableCellClass} text-right`}>{Number(row.todaySalesDocument || 0).toFixed(2)}</TableCell>
                    <TableCell className={`${tableCellClass} text-right text-[#1e40af] font-bold`}>{Number(row.thisMonthInvoiceQuantity || 0).toFixed(2)}</TableCell>
                    <TableCell className={`${tableCellClass} text-right text-[#1e40af] font-bold`}>{Number(row.thisMonthDcQuantity || 0).toFixed(2)}</TableCell>
                    <TableCell className={`${tableCellClass} text-right text-[#1e40af] font-bold`}>{Number(row.thisMonthSalesDocument || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {accounts && accounts.length > 0 && (
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableCell className="py-3 px-4 text-xs font-black uppercase text-slate-800">Total</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-black text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.todayInvoiceQuantity, 0) || 0).toFixed(0)}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-black text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.todayDcQuantity, 0) || 0).toFixed(0)}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-black text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.todaySalesDocument, 0) || 0).toFixed(0)}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-black text-right text-[#1e40af]">{(accounts?.reduce((acc: number, r: any) => acc + r.thisMonthInvoiceQuantity, 0) || 0).toFixed(0)}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-black text-right text-[#1e40af]">{(accounts?.reduce((acc: number, r: any) => acc + r.thisMonthDcQuantity, 0) || 0).toFixed(0)}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-black text-right text-[#1e40af]">{(accounts?.reduce((acc: number, r: any) => acc + r.thisMonthSalesDocument, 0) || 0).toFixed(0)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 2-Column Grid: Invoice & DC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col">
            <SectionHeader 
              title="Invoice Overview" 
              icon={FileText} 
              action={getCardActions(
                "Invoice Overview",
                ["Customer", "Grade", "Qty", "Invoices", "Amount"],
                invoicesData
              )}
            />
            <FilterBar plant={plant} setPlant={setPlant} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} onClear={handleClearFilters} />
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHeaderClass}>Customer</TableHead>
                    <TableHead className={tableHeaderClass}>Grade</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Qty</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Invoices</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                  ) : invoices?.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className={`${tableCellClass} font-bold text-[#1e40af]`}>{row.customerName}</TableCell>
                      <TableCell className={tableCellClass}>{row.grade}</TableCell>
                      <TableCell className={`${tableCellClass} text-right`}>{row.quantity}</TableCell>
                      <TableCell className={`${tableCellClass} text-right`}>{row.noOfInvoice}</TableCell>
                      <TableCell className={`${tableCellClass} text-right font-bold`}>₹{parseFloat(row.netAmount).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col">
            <SectionHeader 
              title="DC Overview" 
              icon={Truck} 
              action={getCardActions(
                "DC Overview",
                ["Customer", "Grade", "Qty", "Invoices", "Amount"],
                dcsData
              )}
            />
            <FilterBar plant={plant} setPlant={setPlant} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} onClear={handleClearFilters} />
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHeaderClass}>Customer</TableHead>
                    <TableHead className={tableHeaderClass}>Grade</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Qty</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Invoices</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcs?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                  ) : dcs?.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className={`${tableCellClass} font-bold text-[#1e40af]`}>{row.customerName}</TableCell>
                      <TableCell className={tableCellClass}>{row.grade}</TableCell>
                      <TableCell className={`${tableCellClass} text-right`}>{row.quantity}</TableCell>
                      <TableCell className={`${tableCellClass} text-right`}>{row.noOfInvoice}</TableCell>
                      <TableCell className={`${tableCellClass} text-right font-bold`}>₹{parseFloat(row.netAmount).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* 2-Column Grid: Inventory & Average */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col">
            <SectionHeader 
              title="Inventory Overview" 
              icon={Package} 
              action={getCardActions(
                "Inventory Overview",
                ["Item", "Supplier", "Net Wt (Ton)"],
                inventoryData
              )}
            />
            <FilterBar plant={plant} setPlant={setPlant} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} onClear={handleClearFilters} />
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHeaderClass}>Item</TableHead>
                    <TableHead className={tableHeaderClass}>Supplier</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Net Wt (Ton)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                  ) : inventory?.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className={`${tableCellClass} font-bold`}>{row.item}</TableCell>
                      <TableCell className={tableCellClass}>{row.supplier}</TableCell>
                      <TableCell className={`${tableCellClass} text-right font-bold text-amber-600`}>{(parseFloat(row.netWeight || "0") / 1000).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col">
            <SectionHeader 
              title="Average Overview (Last 3 Months)" 
              icon={Activity} 
              action={getCardActions(
                "Average Overview (Last 3 Months)",
                ["Period", "Tot Qty", "Loaded Qty", "Avg Rate"],
                averageData
              )}
            />
            <div className="flex gap-2 items-center flex-wrap bg-white p-3 border-b border-slate-100">
              <div className="w-[180px]">
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className="h-8 text-xs font-semibold bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Plant">All Plants</SelectItem>
                    <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                    <SelectItem value="MARVAL RMC">MARVAL RMC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="h-8 bg-[#1e40af] hover:bg-[#2a8f95] text-xs font-bold text-white px-4 cursor-pointer">
                <Search className="h-3 w-3 mr-1.5" /> Search
              </Button>
              <Button size="sm" onClick={handleClearFilters} className="h-8 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 px-4 shadow-sm border border-slate-200 cursor-pointer">
                Clear
              </Button>
            </div>
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHeaderClass}>Period</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Tot Qty</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Loaded Qty</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Avg Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {average?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                  ) : average?.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className={`${tableCellClass} font-bold`}>{row.month} {row.year}</TableCell>
                      <TableCell className={`${tableCellClass} text-right`}>{Number(row.totalQuantity || 0).toFixed(2)}</TableCell>
                      <TableCell className={`${tableCellClass} text-right`}>{Number(row.totalLoadedQty || 0).toFixed(2)}</TableCell>
                      <TableCell className={`${tableCellClass} text-right font-bold text-[#1e40af]`}>₹{Number(row.averageRate || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* SCHEDULING OVERVIEW */}
        <Card className="shadow-sm border-slate-200/60 overflow-hidden">
          <SectionHeader 
            title="Scheduling Overview" 
            icon={CalendarCheck} 
            action={getCardActions(
              "Scheduling Overview",
              ["Customer", "Site", "Grade", "Quantity", "Start Date & Time", "End Date & Time"],
              schedulingData
            )}
          />
          <FilterBar plant={plant} setPlant={setPlant} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} onClear={handleClearFilters} />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={tableHeaderClass}>Customer</TableHead>
                  <TableHead className={tableHeaderClass}>Site</TableHead>
                  <TableHead className={tableHeaderClass}>Grade</TableHead>
                  <TableHead className={`${tableHeaderClass} text-right`}>Quantity</TableHead>
                  <TableHead className={tableHeaderClass}>Start Date & Time</TableHead>
                  <TableHead className={tableHeaderClass}>End Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduling?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                ) : scheduling?.map((row: any, i: number) => (
                  <TableRow key={i} className="hover:bg-slate-50/50">
                    <TableCell className={`${tableCellClass} font-bold text-[#1e40af]`}>{row.customerName}</TableCell>
                    <TableCell className={tableCellClass}>{row.site}</TableCell>
                    <TableCell className={tableCellClass}>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{row.grade}</span>
                    </TableCell>
                    <TableCell className={`${tableCellClass} text-right font-bold`}>{row.quantity}</TableCell>
                    <TableCell className={tableCellClass}>{row.startDateTime}</TableCell>
                    <TableCell className={tableCellClass}>{row.endDateTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 2-Column Grid: Payment Followup & Current Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col">
            <SectionHeader 
              title="Upcoming Payment Followup" 
              icon={CreditCard} 
              action={getCardActions(
                "Upcoming Payment Followup",
                ["Customer Name", "Next Followup", "Description"],
                paymentFollowupData
              )}
            />
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHeaderClass}>Customer Name</TableHead>
                    <TableHead className={tableHeaderClass}>Next Followup</TableHead>
                    <TableHead className={tableHeaderClass}>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentFollowup?.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                  ) : paymentFollowup?.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className={`${tableCellClass} font-bold text-[#1e40af]`}>{row.customerName}</TableCell>
                      <TableCell className={tableCellClass}>{row.nextFollowupDate}</TableCell>
                      <TableCell className={`${tableCellClass} text-[11px]`}>{row.followupDescription}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col">
            <SectionHeader 
              title="Current Stock" 
              icon={Boxes} 
              action={getCardActions(
                "Current Stock",
                ["Item", "Stock Level"],
                currentStockData
              )}
            />
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHeaderClass}>Item</TableHead>
                    <TableHead className={`${tableHeaderClass} text-right`}>Stock Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStock?.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-8 text-xs text-slate-400">No records found</TableCell></TableRow>
                  ) : currentStock?.map((row: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className={`${tableCellClass} font-bold text-slate-700`}>{row.item}</TableCell>
                      <TableCell className={`${tableCellClass} text-right font-black text-amber-600`}>{Number(row.stock || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Branded print-sheet layout: strictly displayed ONLY during printing */}
      {printData && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#1e40af] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#1e40af] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">{printData.title}</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">GSTIN: 36AAAAF1234A1Z0</p>
              <p className="text-[9px] text-gray-400 font-medium">Printed At: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>

          <table className="w-full border collapse text-left">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2 text-center w-12">S/No</th>
                {printData.headers.map((h: string, idx: number) => (
                  <th key={idx} className="border p-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printData.rows.length === 0 ? (
                <tr>
                  <td colSpan={printData.headers.length + 1} className="border p-4 text-center text-xs italic text-gray-400">
                    No data records available on this printed sheet.
                  </td>
                </tr>
              ) : (
                printData.rows.map((row: any[], rIdx: number) => (
                  <tr key={rIdx} className="text-xs border-b">
                    <td className="border p-2 text-center font-bold text-gray-500">{rIdx + 1}</td>
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="border p-2 font-semibold text-gray-800">{cell}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-8 pt-8 border-t flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400">This document is a certified system-generated copy of the operational dashboard overview.</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Authorized Signature</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
