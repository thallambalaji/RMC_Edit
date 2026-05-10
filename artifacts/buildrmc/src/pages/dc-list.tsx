import { useState } from "react";
import { Link } from "wouter";
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
import { ChevronRight, Search } from "lucide-react";

export default function DCList() {
  const [dcNo, setDcNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("all");
  const [site, setSite] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  const mockData = [
    {
      dcNo: "DC/23-24/0001",
      customer: "PRANEETH PRANAV GROVE PARK",
      site: "CHETLAPOTHARAM",
      date: "31/10/2023",
      time: "13:12:30",
      grade: "M10",
      quantity: "7",
      rate: "3600",
      amount: "25200",
      vehicle: "TS07UM4479",
      invoiceNo: "N/A",
      plant: "FORTUNE CONCRETE",
    },
  ];

  const handleClear = () => {
    setDcNo("");
    setFromDate("");
    setToDate("");
    setCustomer("all");
    setSite("all");
  };

  const handleCopy = () => {
    const headers = ["DC No", "Customer", "Site", "Date", "Quantity", "Vehicle"];
    const rows = mockData.map(d => [
      d.dcNo,
      d.customer,
      d.site,
      d.date,
      d.quantity,
      d.vehicle
    ]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
  };

  const handleExportCSV = () => {
    const headers = ["DC No", "Customer", "Site", "Date", "Quantity", "Vehicle"];
    const rows = mockData.map(d => [
      `"${d.dcNo}"`,
      `"${d.customer}"`,
      `"${d.site}"`,
      `"${d.date}"`,
      `"${d.quantity}"`,
      `"${d.vehicle}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dc_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Delivery Challan List</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/dc" className="hover:text-[#1e40af] transition-colors">DC</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">DC List</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">DC No</Label>
            <Input placeholder="Enter DC No" className="bg-gray-50 h-10 border-gray-200" value={dcNo} onChange={(e) => setDcNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date :</Label>
            <Input type="date" className="bg-gray-50 h-10 border-gray-200" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date :</Label>
            <Input type="date" className="bg-gray-50 h-10 border-gray-200" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer :</Label>
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger className="bg-white h-10 border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Customer</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Site :</Label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger className="bg-white h-10 border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Site</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 flex-1 font-medium">Search</Button>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white h-10 flex-1 font-medium" onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
              <SelectTrigger className="w-20 h-9 bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handleCopy}>Copy</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handleExportCSV}>CSV</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4" onClick={handlePrintPDF}>PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b border-gray-200">
                <TableHead className="text-gray-900 font-bold py-4 px-4 whitespace-nowrap text-center">DC No</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Customer</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Site</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Date</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Time</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Grade</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Quantity</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Rate</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Amount</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Vehicle</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Invoice No</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">Plant</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap text-center">OPTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50/50">
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.dcNo}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.customer}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.site}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.date}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.time}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.grade}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.quantity}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.rate}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.amount}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.vehicle}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.invoiceNo}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap border-r border-gray-100">{row.plant}</TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-400">--</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">Showing 1 to 1 of 1 entries</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-400" disabled>Previous</Button>
            <div className="bg-cyan-500 text-white h-7 w-7 flex items-center justify-center rounded text-xs">1</div>
            <Button variant="outline" size="sm" className="text-gray-400" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
