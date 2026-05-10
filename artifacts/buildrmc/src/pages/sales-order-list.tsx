import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetSalesOrders, useGetCustomers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
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
import { ChevronRight, Loader2, Search, RotateCcw } from "lucide-react";
import { isWithinInterval, parseISO, parse } from "date-fns";

export default function SalesOrderList() {
  const [poFilter, setPoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("all");

  const { data: orders, isLoading } = useGetSalesOrders();
  const { data: customers } = useGetCustomers();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesPo = o.poNumber.toLowerCase().includes(poFilter.toLowerCase());
      const matchesCustomer = filterCustomerId === "all" || o.customerId === filterCustomerId;
      
      let matchesDate = true;
      if (fromDate && toDate) {
        try {
          const orderDate = parse(o.poDate, 'dd/MM/yyyy', new Date());
          matchesDate = isWithinInterval(orderDate, {
            start: parseISO(fromDate),
            end: parseISO(toDate)
          });
        } catch (e) { matchesDate = true; }
      }
      
      return matchesPo && matchesCustomer && matchesDate;
    });
  }, [orders, poFilter, fromDate, toDate, filterCustomerId]);

  const handleClear = () => {
    setPoFilter("");
    setFromDate("");
    setToDate("");
    setFilterCustomerId("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Order List</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po/sales-order" className="hover:text-primary transition-colors">Sales Order</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Sales Order List</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Po Number</Label>
            <Input 
              placeholder="Enter PO Number" 
              className="bg-white h-10 border-gray-300"
              value={poFilter}
              onChange={(e) => setPoFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date</Label>
            <Input 
              type="date" 
              className="bg-white h-10 border-gray-300" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date</Label>
            <Input 
              type="date" 
              className="bg-white h-10 border-gray-300" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer</Label>
            <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Site</Label>
            <Select defaultValue="all">
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Site</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white h-10 flex-1 font-bold">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
            <Button 
              className="bg-rose-500 hover:bg-rose-600 text-white h-10 flex-1 font-bold"
              onClick={handleClear}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-20 h-9 bg-white border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span>entries</span>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#3DB9C1]" />
              <p className="text-sm text-gray-500 font-medium">Loading orders...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#3DB9C1] hover:bg-[#3DB9C1]">
                  <TableHead className="text-white font-bold py-4 px-2 text-center border-r border-white/20 text-xs">S/L<br/>No</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">PO<br/>Number</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">PO Date</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Validity</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Customer</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Site Address</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Tax<br/>Include?</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">GST<br/>Percent</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Order<br/>Type</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Sales Person</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/20 text-xs">Plant</TableHead>
                  <TableHead className="p-0 border-r border-white/20">
                    <div className="grid grid-cols-4 h-full">
                      <div className="col-span-1 text-white font-bold text-center border-r border-white/20 text-xs flex items-center justify-center p-2">Grade</div>
                      <div className="col-span-1 text-white font-bold text-center border-r border-white/20 text-xs flex items-center justify-center p-2">Quantity</div>
                      <div className="col-span-1 text-white font-bold text-center border-r border-white/20 text-xs flex items-center justify-center p-2">Rate</div>
                      <div className="col-span-1 text-white font-bold text-center text-xs flex items-center justify-center p-2">Rem.<br/>Qty</div>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-bold px-2 text-center text-xs">OPTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-10 text-gray-400">No sales orders found</TableCell>
                  </TableRow>
                ) : filteredOrders.map((order, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-200">
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2">{idx + 1}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2 font-bold">{order.poNumber}</TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 align-top py-2">{order.poDate}</TableCell>
                    <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100 align-top py-2">{order.validity || "N/A"}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2 font-medium">{order.customerName}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2">{order.siteAddress || "--"}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2">{order.taxInclude ? "yes" : "no"}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2">{order.gstPercent}%</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2 capitalize">{order.orderType}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2">{order.salesPerson || "--"}</TableCell>
                    <TableCell className="text-center text-xs border-r border-gray-100 align-top py-2">{order.plant}</TableCell>
                    <TableCell className="p-0 border-r border-gray-100 align-top">
                      <div className="flex flex-col h-full w-full min-w-[250px]">
                        {order.items?.map((item: any, iIdx: number) => (
                          <div key={iIdx} className={`grid grid-cols-4 w-full ${iIdx > 0 ? 'border-t border-gray-200' : ''}`}>
                            <div className="col-span-1 text-center text-xs p-1 border-r border-gray-200">{item.grade}</div>
                            <div className="col-span-1 text-center text-xs p-1 border-r border-gray-200">{item.quantity}</div>
                            <div className="col-span-1 text-center text-xs p-1 border-r border-gray-200">{item.rate}</div>
                            <div className="col-span-1 text-center text-xs p-1">{item.remainingQty || "0.00"}</div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center align-top py-2">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-400">...</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length > 0 ? 1 : 0} to {filteredOrders.length} of {filteredOrders.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-gray-400 h-8">Previous</Button>
            <div className="bg-[#3DB9C1] text-white h-8 w-8 flex items-center justify-center rounded text-xs">1</div>
            <Button variant="outline" size="sm" className="text-gray-600 h-8">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
