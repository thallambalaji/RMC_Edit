import { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
import { Search } from "lucide-react";

export default function Dashboard() {
  const [plant, setPlant] = useState("All Plant");
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));

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

  const tealHeader = "bg-[#3DB9C1] text-white font-bold text-xs uppercase tracking-wider";
  const sectionTitle = "text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2";

  return (
    <div className="space-y-8 pb-20 px-4">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-xl font-bold text-[#3DB9C1]">Dashboard</h2>
        <div className="text-xs text-gray-400">Build RMC &gt; Dashboard</div>
      </div>

      {/* 1. TODAY ACCOUNTS OVERVIEW */}
      <section>
        <h3 className={sectionTitle}>Today Accounts Overview</h3>
        <div className="border rounded-md overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className={tealHeader}>
                <TableHead className="text-white">Plant</TableHead>
                <TableHead className="text-white text-right">Today Invoice Quantity</TableHead>
                <TableHead className="text-white text-right">Today DC Quantity</TableHead>
                <TableHead className="text-white text-right">Today Sales Document</TableHead>
                <TableHead className="text-white text-right">This Month Invoice Quantity</TableHead>
                <TableHead className="text-white text-right">This Month DC Quantity</TableHead>
                <TableHead className="text-white text-right">This Month Sales Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.map((row: any) => (
                <TableRow key={row.plantName}>
                  <TableCell className="font-medium">{row.plantName}</TableCell>
                  <TableCell className="text-right">{Number(row.todayInvoiceQuantity || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(row.todayDcQuantity || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(row.todaySalesDocument || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(row.thisMonthInvoiceQuantity || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(row.thisMonthDcQuantity || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(row.thisMonthSalesDocument || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.todayInvoiceQuantity, 0) || 0).toFixed(0)}</TableCell>
                <TableCell className="text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.todayDcQuantity, 0) || 0).toFixed(0)}</TableCell>
                <TableCell className="text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.todaySalesDocument, 0) || 0).toFixed(0)}</TableCell>
                <TableCell className="text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.thisMonthInvoiceQuantity, 0) || 0).toFixed(0)}</TableCell>
                <TableCell className="text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.thisMonthDcQuantity, 0) || 0).toFixed(0)}</TableCell>
                <TableCell className="text-right">{(accounts?.reduce((acc: number, r: any) => acc + r.thisMonthSalesDocument, 0) || 0).toFixed(0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 2. INVOICE OVERVIEW & DC OVERVIEW Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INVOICE OVERVIEW */}
        <section className="space-y-3">
          <h3 className={sectionTitle}>Invoice Overview</h3>
          <div className="flex gap-2 items-end flex-wrap bg-gray-50 p-3 rounded-md border">
            <div className="flex-1 min-w-[120px]">
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Plant">All Plant</SelectItem>
                  <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  <SelectItem value="NARVAL RMC">NARVAL RMC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs w-[130px]" />
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs w-[130px]" />
            <Button size="sm" className="h-8 bg-gray-600 hover:bg-gray-700"><Search className="h-3 w-3 mr-1" /> Search</Button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className={tealHeader}>
                <TableRow>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">Grade</TableHead>
                  <TableHead className="text-white text-right">Quantity</TableHead>
                  <TableHead className="text-white text-right">No Of Invoice</TableHead>
                  <TableHead className="text-white text-right">Net Amount</TableHead>
                  <TableHead className="text-white">Plant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">No records found</TableCell></TableRow>
                ) : invoices?.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.grade}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">{row.noOfInvoice}</TableCell>
                    <TableCell className="text-right">{row.netAmount}</TableCell>
                    <TableCell>{row.plant}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-[#4ADE80] text-white font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{(invoices?.reduce((acc: number, r: any) => acc + (parseFloat(r.quantity) || 0), 0) || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(invoices?.reduce((acc: number, r: any) => acc + (r.noOfInvoice || 0), 0) || 0)}</TableCell>
                  <TableCell className="text-right">{(invoices?.reduce((acc: number, r: any) => acc + (parseFloat(r.netAmount) || 0), 0) || 0).toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* DC OVERVIEW */}
        <section className="space-y-3">
          <h3 className={sectionTitle}>DC Overview</h3>
          <div className="flex gap-2 items-end flex-wrap bg-gray-50 p-3 rounded-md border">
            <div className="flex-1 min-w-[120px]">
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Plant">All Plant</SelectItem>
                  <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  <SelectItem value="NARVAL RMC">NARVAL RMC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs w-[130px]" />
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs w-[130px]" />
            <Button size="sm" className="h-8 bg-gray-600 hover:bg-gray-700"><Search className="h-3 w-3 mr-1" /> Search</Button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className={tealHeader}>
                <TableRow>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">Grade</TableHead>
                  <TableHead className="text-white text-right">Quantity</TableHead>
                  <TableHead className="text-white text-right">No Of Invoice</TableHead>
                  <TableHead className="text-white text-right">Net Amount</TableHead>
                  <TableHead className="text-white">Plant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dcs?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">No records found</TableCell></TableRow>
                ) : dcs?.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.grade}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">{row.noOfInvoice}</TableCell>
                    <TableCell className="text-right">{row.netAmount}</TableCell>
                    <TableCell>{row.plant}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-[#4ADE80] text-white font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">0.00</TableCell>
                  <TableCell className="text-right">0</TableCell>
                  <TableCell className="text-right">0.00</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      {/* KPI Stats Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center overflow-hidden rounded border shadow-sm">
          <div className="bg-[#3DB9C1] text-white px-4 py-2 text-xs font-bold whitespace-nowrap min-w-[180px]">No of pending quotation</div>
          <div className="bg-white flex-1 px-4 py-2 font-bold text-center">{stats?.pendingQuotationCount || 0}</div>
        </div>
        <div className="flex items-center overflow-hidden rounded border shadow-sm">
          <div className="bg-[#3DB9C1] text-white px-4 py-2 text-xs font-bold whitespace-nowrap min-w-[180px]">Pending Supplier PO</div>
          <div className="bg-white flex-1 px-4 py-2 font-bold text-center">{stats?.pendingSupplierPoCount || 0}</div>
        </div>
        <div className="flex items-center overflow-hidden rounded border shadow-sm">
          <div className="bg-[#3DB9C1] text-white px-4 py-2 text-xs font-bold whitespace-nowrap min-w-[180px]">Pending Scheduling PO</div>
          <div className="bg-white flex-1 px-4 py-2 font-bold text-center">{stats?.pendingSchedulingPoCount || 0}</div>
        </div>
      </div>

      {/* Cube Test Dashboard */}
      <section>
        <h3 className="text-xs font-bold text-gray-700 uppercase mb-2 text-center">Cube Test Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center overflow-hidden rounded border shadow-sm">
            <div className="bg-[#3DB9C1] text-white px-4 py-2 text-xs font-bold whitespace-nowrap min-w-[120px]">7 Days Pending</div>
            <div className="bg-white flex-1 px-4 py-2 font-bold text-right text-red-600">{stats?.cubeTest7DaysPending || 0}</div>
          </div>
          <div className="flex items-center overflow-hidden rounded border shadow-sm">
            <div className="bg-[#3DB9C1] text-white px-4 py-2 text-xs font-bold whitespace-nowrap min-w-[120px]">28 Days Pending</div>
            <div className="bg-white flex-1 px-4 py-2 font-bold text-right text-red-600">{stats?.cubeTest28DaysPending || 0}</div>
          </div>
          <div className="flex items-center overflow-hidden rounded border shadow-sm">
            <div className="bg-[#3DB9C1] text-white px-4 py-2 text-xs font-bold whitespace-nowrap min-w-[120px]">Pending For New Cast</div>
            <div className="bg-white flex-1 px-4 py-2 font-bold text-right text-red-600">{stats?.cubeTestPendingForNewCast || 0}</div>
          </div>
        </div>
      </section>

      {/* INVENTORY & AVERAGE Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INVENTORY OVERVIEW */}
        <section className="space-y-3">
          <h3 className={sectionTitle}>Inventory Overview</h3>
          <div className="flex gap-2 items-end flex-wrap bg-gray-50 p-3 rounded-md border">
            <div className="flex-1 min-w-[120px]">
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Plant">All Plant</SelectItem>
                  <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  <SelectItem value="NARVAL RMC">NARVAL RMC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs w-[130px]" />
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs w-[130px]" />
            <Button size="sm" className="h-8 bg-gray-600 hover:bg-gray-700"><Search className="h-3 w-3 mr-1" /> Search</Button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className={tealHeader}>
                <TableRow>
                  <TableHead className="text-white">Item</TableHead>
                  <TableHead className="text-white">Supplier</TableHead>
                  <TableHead className="text-white text-right">Empty Weight</TableHead>
                  <TableHead className="text-white text-right">Loaded Weight</TableHead>
                  <TableHead className="text-white text-right">Net Weight</TableHead>
                  <TableHead className="text-white">Plant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{row.item}</TableCell>
                    <TableCell className="text-xs">{row.supplier}</TableCell>
                    <TableCell className="text-right text-xs">{row.emptyWeight}</TableCell>
                    <TableCell className="text-right text-xs">{row.loadedWeight}</TableCell>
                    <TableCell className="text-right text-xs">{row.netWeight}</TableCell>
                    <TableCell className="text-xs">{row.plantName}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-[#4ADE80] text-white font-bold text-xs">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{((inventory?.reduce((acc: number, r: any) => acc + (r.emptyWeight || 0), 0) || 0) / 1000).toFixed(2)} Ton.</TableCell>
                  <TableCell className="text-right">{((inventory?.reduce((acc: number, r: any) => acc + (r.loadedWeight || 0), 0) || 0) / 1000).toFixed(2)} Ton.</TableCell>
                  <TableCell className="text-right">{((inventory?.reduce((acc: number, r: any) => acc + (r.netWeight || 0), 0) || 0) / 1000).toFixed(2)} Ton.</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* AVERAGE OVERVIEW */}
        <section className="space-y-3">
          <h3 className={sectionTitle}>Average Overview</h3>
          <div className="flex gap-2 items-end flex-wrap bg-gray-50 p-3 rounded-md border">
            <div className="flex-1 min-w-[120px]">
              <Select defaultValue="3 Month">
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 Month">Last 3 Month</SelectItem>
                  <SelectItem value="6 Month">Last 6 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Plant">All Plant</SelectItem>
                  <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  <SelectItem value="NARVAL RMC">NARVAL RMC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-8 bg-gray-600 hover:bg-gray-700"><Search className="h-3 w-3 mr-1" /> Search</Button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className={tealHeader}>
                <TableRow>
                  <TableHead className="text-white">Year</TableHead>
                  <TableHead className="text-white">Month</TableHead>
                  <TableHead className="text-white text-right">Total Quantity</TableHead>
                  <TableHead className="text-white text-right">Total Loaded Qty</TableHead>
                  <TableHead className="text-white text-right">Average Rate</TableHead>
                  <TableHead className="text-white">Plant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {average?.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{row.year}</TableCell>
                    <TableCell className="text-xs">{row.month}</TableCell>
                    <TableCell className="text-right text-xs">{Number(row.totalQuantity || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">{Number(row.totalLoadedQty || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">{Number(row.averageRate || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{row.plantName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      {/* SCHEDULING OVERVIEW */}
      <section className="space-y-3">
        <h3 className={sectionTitle}>Scheduling Overview</h3>
        <div className="flex gap-2 items-end flex-wrap bg-gray-50 p-3 rounded-md border">
          <div className="flex-1 min-w-[120px]">
            <Select value={plant} onValueChange={setPlant}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Plant">All Plant</SelectItem>
                <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                <SelectItem value="NARVAL RMC">NARVAL RMC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs w-[130px]" />
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs w-[130px]" />
          <Button size="sm" className="h-8 bg-gray-600 hover:bg-gray-700"><Search className="h-3 w-3 mr-1" /> Search</Button>
        </div>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className={tealHeader}>
              <TableRow>
                <TableHead className="text-white">Customer</TableHead>
                <TableHead className="text-white">Site</TableHead>
                <TableHead className="text-white">Grade</TableHead>
                <TableHead className="text-white text-right">Quantity</TableHead>
                <TableHead className="text-white">Start Date & Time</TableHead>
                <TableHead className="text-white">End Date & Time</TableHead>
                <TableHead className="text-white">Plant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduling?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4 text-gray-400">No records found</TableCell></TableRow>
              ) : scheduling?.map((row: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell>{row.site}</TableCell>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell>{row.startDateTime}</TableCell>
                  <TableCell>{row.endDateTime}</TableCell>
                  <TableCell>{row.plantName}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-[#4ADE80] text-white font-bold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">0.00</TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-3">
          <h3 className={sectionTitle}>Upcoming Payment Followup</h3>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className={tealHeader}>
                <TableRow>
                  <TableHead className="text-white">Customer Name</TableHead>
                  <TableHead className="text-white">Next Followup date & time</TableHead>
                  <TableHead className="text-white">Followup description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentFollowup?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-400">No records found</TableCell></TableRow>
                ) : paymentFollowup?.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.nextFollowupDate}</TableCell>
                    <TableCell>{row.followupDescription}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className={sectionTitle}>Current Stock</h3>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className={tealHeader}>
                <TableRow>
                  <TableHead className="text-white">Item</TableHead>
                  <TableHead className="text-white text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStock?.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.item}</TableCell>
                    <TableCell className="text-right font-bold">{Number(row.stock || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
