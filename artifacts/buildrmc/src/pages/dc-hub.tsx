import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  Truck, 
  Scale, 
  BarChart3, 
  Plus, 
  Search, 
  RotateCcw, 
  Filter, 
  ChevronRight,
  Printer,
  Download,
  MoreHorizontal,
  FileText,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function DCHub() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // DC List State (Mocking dc-list.tsx logic)
  const [dcNo, setDcNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(true);

  const mockData = [
    {
      id: 1,
      dcNo: "DC/23-24/0001",
      customer: "PRANEETH PRANAV GROVE PARK",
      site: "CHETLAPOTHARAM",
      date: "2023-10-31",
      time: "13:12:30",
      grade: "M10",
      quantity: "7.00",
      rate: "3600",
      amount: "25200",
      vehicle: "TS07UM4479",
      plant: "FORTUNE CONCRETE",
    },
    {
      id: 2,
      dcNo: "DC/23-24/0002",
      customer: "KUMAR BUILDERS",
      site: "GACHIBOWLI",
      date: "2023-11-01",
      time: "10:45:00",
      grade: "M25",
      quantity: "6.50",
      rate: "4200",
      amount: "27300",
      vehicle: "TS08ER1234",
      plant: "FORTUNE CONCRETE",
    },
  ];

  const handleClear = () => {
    setDcNo("");
    setFromDate("");
    setToDate("");
    setCustomer("all");
  };

  return (
    <div className="flex h-full gap-4 bg-[#f8fafc]">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">DC Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="mb-3 px-1 mt-1">
            <Link href="/dc/new">
              <Button className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] h-9 text-xs font-bold shadow-sm rounded-lg">
                <Plus className="h-4 w-4 mr-2" /> Add DC
              </Button>
            </Link>
          </div>
          
          <Accordion type="multiple" defaultValue={["dc-ops", "weighment"]} className="w-full space-y-2">
            <AccordionItem value="dc-ops" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#1e40af]"/> DC Operations</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/dc/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">DC List</div></Link>
                  <Link href="/dc/report"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">DC Report</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="weighment" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-cyan-600"/> Weighment</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/dc/weighment/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Weighment</div></Link>
                  <Link href="/dc/weighment/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Weighment List</div></Link>
                  <Link href="/dc/weighment/tickets"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Weighment Tickets</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-3 min-w-0">
        {/* Header / Breadcrumb */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">DC List</h2>
            <div className="h-4 w-px bg-gray-300 mx-1" />
            <nav className="text-[11px] text-muted-foreground flex items-center gap-1 uppercase font-medium">
              <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-900">Delivery Challan</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 text-[11px] font-bold ${showFilters ? "bg-gray-100" : ""}`}
            >
              <Filter className="h-3 w-3 mr-1.5" /> Filters
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-lg border shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end transition-all">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">DC No</Label>
              <Input placeholder="Search DC..." className="h-8 text-xs" value={dcNo} onChange={e => setDcNo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">From Date</Label>
              <div className="relative">
                <Input type="date" className="h-8 text-xs pl-8" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">To Date</Label>
              <div className="relative">
                <Input type="date" className="h-8 text-xs pl-8" value={toDate} onChange={e => setToDate(e.target.value)} />
                <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">Customer</Label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] h-8 flex-1 text-[11px] font-bold">Search</Button>
              <Button size="sm" variant="outline" onClick={handleClear} className="h-8 w-8 p-0"><RotateCcw className="h-3 w-3" /></Button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => setPageSize(parseInt(v, 10))}>
                  <SelectTrigger className="w-14 h-7 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-3">
                <Download className="h-3 w-3 mr-1.5" /> Export
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-3">
                <Printer className="h-3 w-3 mr-1.5" /> Print
              </Button>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-[100px] text-[10px] font-bold uppercase text-gray-400 py-3 text-center">DC No</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400">Customer & Site</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">Grade</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">Quantity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">Vehicle</TableHead>
                  <TableHead className="w-[60px] text-[10px] font-bold uppercase text-gray-400 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((row) => (
                  <TableRow key={row.id} className="group hover:bg-gray-50/80 transition-colors">
                    <TableCell className="text-center py-3 font-bold text-[#1e40af] text-xs">{row.dcNo}</TableCell>
                    <TableCell className="py-3">
                      <div className="text-xs font-semibold text-gray-800">{row.customer}</div>
                      <div className="text-[10px] text-gray-400">{row.site}</div>
                    </TableCell>
                    <TableCell className="text-center text-[11px] font-medium py-3 text-gray-600">
                      {row.date.split("-").reverse().join("/")}
                      <div className="text-[10px] opacity-50">{row.time}</div>
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <span className="text-[10px] font-bold border border-[#1e40af]/30 text-[#1e40af] px-1.5 py-0.5 rounded-full">{row.grade}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs py-3">{row.quantity} <span className="text-[9px] font-normal text-gray-400 ml-0.5">m³</span></TableCell>
                    <TableCell className="text-center py-3 font-medium text-[11px] text-gray-700">{row.vehicle}</TableCell>
                    <TableCell className="text-center py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => setLocation(`/dc/report?id=${row.id}`)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Print DC</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50/30 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Showing 1 to 2 of 2 entries
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled className="h-7 text-[10px] font-bold px-2 uppercase">Prev</Button>
              <Button size="sm" className="h-7 w-7 p-0 text-[10px] font-bold bg-[#1e40af] hover:bg-[#1d4ed8]">1</Button>
              <Button size="sm" variant="outline" disabled className="h-7 text-[10px] font-bold px-2 uppercase">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
