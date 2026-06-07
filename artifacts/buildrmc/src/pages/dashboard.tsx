import { useState, useMemo } from "react";
import { 
  useDashboardAccountsOverview,
  useDashboardInvoiceOverview,
  useDashboardDcOverview,
  useDashboardStats,
  useGetMasters
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText, Truck, CalendarCheck, Clock, Activity, Printer, Copy, Download, Trash2, 
  ArrowRight, Inbox, ShoppingCart, TestTube, Zap, MoreHorizontal, RefreshCw, User, Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "wouter";

// Reusable KPI card matching mock design
const KpiCard = ({ title, value, icon: Icon, borderClass, textClass, href }: any) => (
  <div className={`rounded-xl p-5 bg-white border ${borderClass} shadow-sm flex flex-col justify-between h-[120px] transition-all hover:shadow-md hover:scale-[1.02]`}>
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 leading-none">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-xl border ${borderClass} ${textClass} bg-slate-50/50`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <Link href={href || "#"} className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 hover:underline ${textClass}`}>
      View details <ArrowRight className="w-3 h-3" />
    </Link>
  </div>
);

// Reusable Quick Action item
const QuickActionItem = ({ label, href, icon: Icon, borderClass, textClass, bgClass }: any) => (
  <Link href={href} className="block no-underline">
    <div className={`flex items-center justify-between p-3.5 rounded-xl border ${borderClass} ${bgClass} hover:opacity-90 transition-all cursor-pointer group`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${borderClass} ${textClass} bg-white`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-extrabold text-slate-700">{label}</span>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </Link>
);

// Reusable Activity timeline item
const ActivityItem = ({ title, desc, time, icon: Icon, bgClass, textClass }: any) => (
  <div className="flex gap-3 items-start">
    <div className={`p-2 rounded-full ${bgClass} ${textClass} shrink-0`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline">
        <h4 className="text-xs font-extrabold text-slate-800 truncate">{title}</h4>
        <span className="text-[9px] text-slate-400 font-bold shrink-0">{time}</span>
      </div>
      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{desc}</p>
    </div>
  </div>
);

// Reusable Donut chart for Invoice/DC overviews
const DonutChart = ({ paidValue, totalValue, centerLabel, color1, color2 }: any) => {
  const percent = totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0;
  const data = totalValue > 0 
    ? [
        { name: "Active", value: paidValue },
        { name: "Rest", value: totalValue - paidValue }
      ]
    : [
        { name: "Active", value: 0 },
        { name: "Rest", value: 100 }
      ];

  return (
    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={56}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill={color1} />
            <Cell fill={color2} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-800 leading-none">{percent}%</span>
        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{centerLabel}</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { toast } = useToast();
  const [printData, setPrintData] = useState<any>(null);

  const filterParams = { plant: "All Plant" };

  const { data: accounts } = useDashboardAccountsOverview();
  const { data: invoices } = useDashboardInvoiceOverview(filterParams);
  const { data: dcs } = useDashboardDcOverview(filterParams);
  const { data: stats } = useDashboardStats();

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

  // Memoized lists for actions
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

  const invoiceAmountSum = useMemo(() => {
    return invoices?.reduce((acc: number, r: any) => acc + (r.netAmount || 0), 0) || 0;
  }, [invoices]);

  const dcQtySum = useMemo(() => {
    return dcs?.reduce((acc: number, r: any) => acc + (r.quantity || 0), 0) || 0;
  }, [dcs]);

  return (
    <>
      <div className="space-y-6 pb-12 max-w-[1600px] mx-auto print:hidden anim-fade-up">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[160px] p-8 text-white shadow-xl flex items-center">
          <div className="absolute inset-0 z-0 opacity-40">
            <img src="/construction_bg.png" alt="Construction background" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/75 to-transparent z-[1]" />
          
          <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 bg-[#ea580c]" />
                <p className="text-[#ea580c] font-black uppercase tracking-[0.25em] text-[9px]">Enterprise Operations</p>
              </div>
              <h1 className="text-4xl font-black tracking-tight uppercase">FortuneMix Hub</h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-300 font-bold uppercase tracking-[0.18em] text-[9.5px]">
                  Engineering Excellence in Every Cubic Meter
                </p>
                <div className="h-0.5 w-6 bg-[#ea580c]" />
              </div>
            </div>
            
            <div className="bg-[#4a2e1b]/90 border border-[#ea580c]/20 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 shrink-0">
              <div className="p-2 bg-[#ea580c] rounded-lg text-white">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-[#fed7aa] uppercase tracking-wider mb-0.5">Operational Date</p>
                <p className="text-lg font-black tracking-tight">{format(new Date(), "MMMM dd, yyyy")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard 
            title="Pending Quotes" 
            value={stats?.pendingQuotationCount || 0} 
            icon={FileText} 
            borderClass="border-orange-100/80" 
            textClass="text-[#ea580c]" 
            href="/customer-po" 
          />
          <KpiCard 
            title="Pending Supp PO" 
            value={stats?.pendingSupplierPoCount || 0} 
            icon={ShoppingCart} 
            borderClass="border-violet-100/80" 
            textClass="text-[#7c3aed]" 
            href="/store" 
          />
          <KpiCard 
            title="Pending Sched PO" 
            value={stats?.pendingSchedulingPoCount || 0} 
            icon={CalendarCheck} 
            borderClass="border-emerald-100/80" 
            textClass="text-[#059669]" 
            href="/customer-po/scheduling" 
          />
          <KpiCard 
            title="Cube Test: 7D" 
            value={stats?.cubeTest7DaysPending || 0} 
            icon={TestTube} 
            borderClass="border-pink-100/80" 
            textClass="text-[#db2777]" 
            href="/qc/cube-test/list" 
          />
          <KpiCard 
            title="Cube Test: 28D" 
            value={stats?.cubeTest28DaysPending || 0} 
            icon={TestTube} 
            borderClass="border-amber-100/80" 
            textClass="text-[#d97706]" 
            href="/qc/cube-test/list" 
          />
          <KpiCard 
            title="New Cast Pending" 
            value={stats?.cubeTestPendingForNewCast || 0} 
            icon={Clock} 
            borderClass="border-orange-100/50/80" 
            textClass="text-[#ea580c]" 
            href="/qc/cube-test/list" 
          />
        </div>

        {/* Middle row: Today Accounts Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TODAY ACCOUNTS OVERVIEW */}
          <Card className="lg:col-span-2 shadow-sm border-slate-100 rounded-2xl bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#ea580c]" /> Today Accounts Overview
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1.5">Actions:</span>
                <Button 
                  onClick={() => handlePrintCard(
                    "Today Accounts Overview",
                    ["Plant", "Today Inv Qty", "Today DC Qty", "Today Sales Doc", "Month Inv Qty", "Month DC Qty", "Month Sales Doc"],
                    accountsData
                  )}
                  variant="ghost" size="icon" className="h-7 w-7 text-[#ea580c] hover:text-[#ea580c] hover:bg-orange-50/40 rounded-lg cursor-pointer"
                  title="Print Section"
                >
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  onClick={() => handleCopyCard(
                    "Today Accounts Overview",
                    ["Plant", "Today Inv Qty", "Today DC Qty", "Today Sales Doc", "Month Inv Qty", "Month DC Qty", "Month Sales Doc"],
                    accountsData
                  )}
                  variant="ghost" size="icon" className="h-7 w-7 text-[#ea580c] hover:text-[#ea580c] hover:bg-orange-50/40 rounded-lg cursor-pointer"
                  title="Copy Table"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  onClick={() => handleCSVCard(
                    "Today Accounts Overview",
                    ["Plant", "Today Inv Qty", "Today DC Qty", "Today Sales Doc", "Month Inv Qty", "Month DC Qty", "Month Sales Doc"],
                    accountsData
                  )}
                  variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  onClick={() => handleDeleteOverviewRow("Today Accounts Overview")}
                  variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Delete Data Alert"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {!accounts || accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-300 mb-3.5">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-700">No records found</h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Looks like there's no data to display yet.</p>
                </div>
              ) : (
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider">Plant</TableHead>
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider text-right">Today Inv Qty</TableHead>
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider text-right">Today DC Qty</TableHead>
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider text-right">Today Sales Doc</TableHead>
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider text-right text-orange-600">Month Inv Qty</TableHead>
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider text-right text-orange-600">Month DC Qty</TableHead>
                      <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase py-3.5 px-5 tracking-wider text-right text-orange-600">Month Sales Doc</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((row: any) => (
                      <TableRow key={row.plantName} className="hover:bg-slate-50/50 border-slate-100">
                        <TableCell className="py-3 px-5 text-xs font-bold text-slate-800">{row.plantName}</TableCell>
                        <TableCell className="py-3 px-5 text-xs font-semibold text-slate-600 text-right">{Number(row.todayInvoiceQuantity || 0).toFixed(2)}</TableCell>
                        <TableCell className="py-3 px-5 text-xs font-semibold text-slate-600 text-right">{Number(row.todayDcQuantity || 0).toFixed(2)}</TableCell>
                        <TableCell className="py-3 px-5 text-xs font-semibold text-slate-600 text-right">{Number(row.todaySalesDocument || 0).toFixed(2)}</TableCell>
                        <TableCell className="py-3 px-5 text-xs font-bold text-orange-600 text-right">{Number(row.thisMonthInvoiceQuantity || 0).toFixed(2)}</TableCell>
                        <TableCell className="py-3 px-5 text-xs font-bold text-orange-600 text-right">{Number(row.thisMonthDcQuantity || 0).toFixed(2)}</TableCell>
                        <TableCell className="py-3 px-5 text-xs font-bold text-orange-600 text-right">{Number(row.thisMonthSalesDocument || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-50/80 font-bold border-t border-slate-200">
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold uppercase text-slate-700">Total</TableCell>
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold text-right">{(accounts.reduce((acc: number, r: any) => acc + (r.todayInvoiceQuantity || 0), 0)).toFixed(2)}</TableCell>
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold text-right">{(accounts.reduce((acc: number, r: any) => acc + (r.todayDcQuantity || 0), 0)).toFixed(2)}</TableCell>
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold text-right">{(accounts.reduce((acc: number, r: any) => acc + (r.todaySalesDocument || 0), 0)).toFixed(0)}</TableCell>
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold text-orange-600 text-right">{(accounts.reduce((acc: number, r: any) => acc + (r.thisMonthInvoiceQuantity || 0), 0)).toFixed(2)}</TableCell>
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold text-orange-600 text-right">{(accounts.reduce((acc: number, r: any) => acc + (r.thisMonthDcQuantity || 0), 0)).toFixed(2)}</TableCell>
                      <TableCell className="py-3.5 px-5 text-xs font-extrabold text-orange-600 text-right">{(accounts.reduce((acc: number, r: any) => acc + (r.thisMonthSalesDocument || 0), 0)).toFixed(0)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-white overflow-hidden flex flex-col p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Zap className="w-4.5 h-4.5 text-[#ea580c] fill-[#ea580c]/10" />
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <QuickActionItem 
                label="Add New PO" 
                href="/customer-po/sales-order/new" 
                icon={ShoppingCart} 
                borderClass="border-orange-100/80" 
                textClass="text-[#ea580c]" 
                bgClass="bg-orange-50/20" 
              />
              <QuickActionItem 
                label="Create DC" 
                href="/dc/new" 
                icon={Truck} 
                borderClass="border-emerald-100/80" 
                textClass="text-[#059669]" 
                bgClass="bg-emerald-50/20" 
              />
              <QuickActionItem 
                label="New Invoice" 
                href="/billing/new" 
                icon={FileText} 
                borderClass="border-violet-100/80" 
                textClass="text-[#7c3aed]" 
                bgClass="bg-violet-50/20" 
              />
              <QuickActionItem 
                label="Lab Test Entry" 
                href="/qc/cube-test/new" 
                icon={TestTube} 
                borderClass="border-pink-100/80" 
                textClass="text-[#db2777]" 
                bgClass="bg-pink-50/20" 
              />
              <QuickActionItem 
                label="Add New Customer" 
                href="/customer-po/customer/new" 
                icon={User} 
                borderClass="border-amber-100/80" 
                textClass="text-[#d97706]" 
                bgClass="bg-amber-50/20" 
              />
            </div>
          </Card>
        </div>

        {/* Bottom row: Invoice Overview, DC Overview, Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INVOICE OVERVIEW */}
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-white overflow-hidden p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#7c3aed]" /> Invoice Overview
                </h3>
                <div className="flex items-center gap-1">
                  <Button 
                    onClick={() => handlePrintCard("Invoice Overview", ["Customer", "Grade", "Qty", "Invoices", "Amount"], invoicesData)}
                    variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => handleCopyCard("Invoice Overview", ["Customer", "Grade", "Qty", "Invoices", "Amount"], invoicesData)}
                    variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => handleCSVCard("Invoice Overview", ["Customer", "Grade", "Qty", "Invoices", "Amount"], invoicesData)}
                    variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Total Invoices</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">{invoices?.length || 0}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Total Amount</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">₹{invoiceAmountSum.toFixed(2)}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Paid Amount</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">₹0.00</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Outstanding</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">₹{invoiceAmountSum.toFixed(2)}</h4>
                    </div>
                  </div>
                </div>

                <DonutChart 
                  paidValue={0} 
                  totalValue={invoiceAmountSum || 100} 
                  centerLabel="Paid" 
                  color1="#10b981" 
                  color2="#ea580c" 
                />
              </div>
            </div>
            
            <div className="flex gap-4 justify-center mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 pt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Paid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Outstanding</span>
              </div>
            </div>
          </Card>

          {/* DC OVERVIEW */}
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-white overflow-hidden p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#059669]" /> DC Overview
                </h3>
                <div className="flex items-center gap-1">
                  <Button 
                    onClick={() => handlePrintCard("DC Overview", ["Customer", "Grade", "Qty", "Invoices", "Amount"], dcsData)}
                    variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => handleCopyCard("DC Overview", ["Customer", "Grade", "Qty", "Invoices", "Amount"], dcsData)}
                    variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => handleCSVCard("DC Overview", ["Customer", "Grade", "Qty", "Invoices", "Amount"], dcsData)}
                    variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded cursor-pointer">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Total DC</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">{dcs?.length || 0}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Total Qty</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">{dcQtySum.toFixed(2)}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Delivered Qty</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">0.00</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Pending Qty</p>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-1">{dcQtySum.toFixed(2)}</h4>
                    </div>
                  </div>
                </div>

                <DonutChart 
                  paidValue={0} 
                  totalValue={dcQtySum || 100} 
                  centerLabel="Delivered" 
                  color1="#10b981" 
                  color2="#ea580c" 
                />
              </div>
            </div>
            
            <div className="flex gap-4 justify-center mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 pt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Delivered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-50" style={{ background: "#ea580c" }} />
                <span>Pending</span>
              </div>
            </div>
          </Card>

          {/* RECENT ACTIVITIES */}
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-white overflow-hidden p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#ea580c]" /> Recent Activities
                </h3>
              </div>

              <div className="space-y-4">
                <ActivityItem 
                  title="System Initialized" 
                  desc="Dashboard loaded successfully" 
                  time="2m ago" 
                  icon={Settings} 
                  bgClass="bg-orange-50" 
                  textClass="text-[#ea580c]" 
                />
                <ActivityItem 
                  title="Welcome Back" 
                  desc="You have logged in successfully" 
                  time="10m ago" 
                  icon={User} 
                  bgClass="bg-amber-50" 
                  textClass="text-[#d97706]" 
                />
                <ActivityItem 
                  title="Data Sync" 
                  desc="All modules are up to date" 
                  time="25m ago" 
                  icon={RefreshCw} 
                  bgClass="bg-orange-50/40" 
                  textClass="text-[#ea580c]" 
                />
                <ActivityItem 
                  title="System Check" 
                  desc="No pending alerts" 
                  time="1h ago" 
                  icon={Activity} 
                  bgClass="bg-sky-50" 
                  textClass="text-[#0284c7]" 
                />
              </div>
            </div>

            <Link href="/dashboard" className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] flex items-center justify-center gap-1 hover:underline border-t border-slate-50 pt-4 mt-5 cursor-pointer">
              View all activities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Branded print-sheet layout: strictly displayed ONLY during printing */}
      {printData && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#ea580c] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#ea580c] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">{printData.title}</div>
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

