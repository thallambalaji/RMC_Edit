import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TransportLayout } from "@/components/transport-layout";
import { Link } from "wouter";
import {
  Search,
  RotateCcw,
  Copy,
  Printer,
  Trash2,
  Edit,
  Plus,
  ArrowRightLeft,
  Settings,
  Download,
} from "lucide-react";

interface SecurityData {
  _id?: string;
  id?: string;
  plant: string;
  gatePassing: string;
  gateNo: string;
  typeOfMovement: string;
  date: string;
  time: string;
  vehicleNo?: string;
  driverName?: string;
}

interface VehicleData {
  _id?: string;
  id?: string;
  registrationNo: string;
}

export default function SecurityCheckList() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [filterSecurityNo, setFilterSecurityNo] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterVehicleNo, setFilterVehicleNo] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Final Applied Filters
  const [searchSecurityNo, setSearchSecurityNo] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");

  // Edit Modal State
  const [editItem, setEditItem] = useState<SecurityData | null>(null);
  const [editPlant, setEditPlant] = useState("FORTUNE CONCRETE");
  const [editGatePassing, setEditGatePassing] = useState("Entry");
  const [editGateNo, setEditGateNo] = useState("1");
  const [editTypeOfMovement, setEditTypeOfMovement] = useState("Sales");
  const [editVehicleNo, setEditVehicleNo] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const resLogs = await fetch("/api/security-checks");
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data);
      }
      const resVehicles = await fetch("/api/vehicles");
      if (resVehicles.ok) {
        const data = await resVehicles.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    setSearchSecurityNo(filterSecurityNo);
    setSearchFromDate(filterFromDate);
    setSearchToDate(filterToDate);
    setSearchVehicleNo(filterVehicleNo);
  };

  const handleClear = () => {
    setFilterSecurityNo("");
    setFilterFromDate("");
    setFilterToDate("");
    setFilterVehicleNo("");
    setSearchSecurityNo("");
    setSearchFromDate("");
    setSearchToDate("");
    setSearchVehicleNo("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this security record?")) return;
    try {
      const res = await fetch(`/api/security-checks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Record Deleted",
          description: "Security check record deleted successfully.",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (item: SecurityData) => {
    setEditItem(item);
    setEditPlant(item.plant || "FORTUNE CONCRETE");
    setEditGatePassing(item.gatePassing || "Entry");
    setEditGateNo(item.gateNo || "1");
    setEditTypeOfMovement(item.typeOfMovement || "Sales");
    setEditVehicleNo(item.vehicleNo || "");
    setEditDriverName(item.driverName || "");
    setEditDate(item.date || "");
    setEditTime(item.time || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      const res = await fetch(`/api/security-checks/${editItem.id || editItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant: editPlant,
          gatePassing: editGatePassing,
          gateNo: editGateNo,
          typeOfMovement: editTypeOfMovement,
          vehicleNo: editVehicleNo,
          driverName: editDriverName,
          date: editDate,
          time: editTime,
        }),
      });

      if (res.ok) {
        toast({
          title: "Record Updated",
          description: "Security check record updated successfully.",
        });
        setEditItem(null);
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to update security record.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Logic
  const filtered = useMemo(() => {
    return logs.filter((l, idx) => {
      const secNo = `SEC-${idx + 1}`;
      if (searchSecurityNo && !secNo.toLowerCase().includes(searchSecurityNo.toLowerCase())) {
        return false;
      }
      if (searchFromDate && l.date < searchFromDate) {
        return false;
      }
      if (searchToDate && l.date > searchToDate) {
        return false;
      }
      if (searchVehicleNo && l.vehicleNo !== searchVehicleNo) {
        return false;
      }
      return true;
    });
  }, [logs, searchSecurityNo, searchFromDate, searchToDate, searchVehicleNo]);

  // Export Single Row Logic
  const handleExportRow = (item: SecurityData, index: number, type: "pdf" | "csv" | "copy") => {
    const secNo = `SEC-${index + 1}`;
    
    if (type === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const htmlContent = `
        <html>
          <head>
            <title>Security Receipt - ${secNo}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00c0a5; padding-bottom: 20px; }
              .company-info h1 { margin: 0; font-size: 22px; font-weight: 900; color: #1e3a8a; }
              .company-info p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: bold; }
              .logo { height: 50px; width: 50px; }
              .title { text-align: center; font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 30px 0; color: #00c0a5; }
              .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
              .info-group { display: flex; flex-direction: column; }
              .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
              .value { font-size: 12px; font-weight: 700; color: #0f172a; }
              .footer { border-top: 1px dashed #cbd5e1; margin-top: 50px; padding-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-weight: bold; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="header">
              <div class="company-info">
                <h1>BUILD RMC CORPORATION</h1>
                <p>Plot No. 42, Ready Mix Compound, Industrial Zone</p>
                <p>Email: contact@buildrmc.in | Web: www.buildrmc.in</p>
              </div>
              <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="15" fill="#1e3a8a"/>
                <path d="M30 70V30H45C55 30 60 35 60 42C60 47 56 50 50 51C57 52 62 56 62 62C62 70 55 70 45 70H30ZM40 46H45C49 46 51 44 51 41C51 38 49 37 45 37H40V46ZM40 63H46C50 63 53 61 53 58C53 55 50 54 46 54H40V63Z" fill="#00c0a5"/>
              </svg>
            </div>
            <div class="title">Security Pass Receipt</div>
            <div class="grid-info">
              <div class="info-group"><span class="label">Security No</span><span class="value">${secNo}</span></div>
              <div class="info-group"><span class="label">Plant</span><span class="value">${item.plant}</span></div>
              <div class="info-group"><span class="label">Gate No</span><span class="value">${item.gateNo}</span></div>
              <div class="info-group"><span class="label">Gate Passing</span><span class="value">${item.gatePassing}</span></div>
              <div class="info-group"><span class="label">Type Of Movement</span><span class="value">${item.typeOfMovement}</span></div>
              <div class="info-group"><span class="label">Date & Time</span><span class="value">${item.date} at ${item.time}</span></div>
              <div class="info-group"><span class="label">Vehicle No</span><span class="value">${item.vehicleNo || "N/A"}</span></div>
              <div class="info-group"><span class="label">Driver Name</span><span class="value">${item.driverName || "N/A"}</span></div>
            </div>
            <div class="footer">
              <span>Security Guard Signature</span>
              <span>Supervisor Signature</span>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else if (type === "csv") {
      const csvData = [
        ["Security No", "Gate No", "Gate Passing", "Date", "Time", "Vehicle No", "Driver Name", "Type of movement", "Plant"].join(","),
        [secNo, item.gateNo, item.gatePassing, item.date, item.time, item.vehicleNo || "N/A", item.driverName || "N/A", item.typeOfMovement, item.plant].join(",")
      ].join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `security_${secNo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded", description: `File security_${secNo}.csv saved.` });
    } else if (type === "copy") {
      const tsvContent = [
        ["Security No", "Gate No", "Gate Passing", "Date", "Time", "Vehicle No", "Driver Name", "Type of movement", "Plant"].join("\t"),
        [secNo, item.gateNo, item.gatePassing, item.date, item.time, item.vehicleNo || "N/A", item.driverName || "N/A", item.typeOfMovement, item.plant].join("\t")
      ].join("\n");
      navigator.clipboard.writeText(tsvContent);
      toast({ title: "Copied to Clipboard", description: `Copied data for security receipt ${secNo}.` });
    }
  };

  // Table-level All Data Export
  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filtered
      .map(
        (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-size: 10px; font-weight: bold; text-align: center;">SEC-${idx + 1}</td>
        <td style="padding: 8px; font-size: 10px; text-align: center;">${item.gateNo}</td>
        <td style="padding: 8px; font-size: 10px; text-align: center;">${item.gatePassing}</td>
        <td style="padding: 8px; font-size: 10px; text-align: center;">${item.date}</td>
        <td style="padding: 8px; font-size: 10px; text-align: center;">${item.time}</td>
        <td style="padding: 8px; font-size: 10px; text-align: center; font-weight: bold;">${item.vehicleNo || "N/A"}</td>
        <td style="padding: 8px; font-size: 10px;">${item.driverName || "N/A"}</td>
        <td style="padding: 8px; font-size: 10px; text-align: center;">${item.typeOfMovement}</td>
        <td style="padding: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase;">${item.plant}</td>
      </tr>`
      )
      .join("");

    const htmlContent = `
      <html>
        <head>
          <title>Security Check Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 20px; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00c0a5; padding-bottom: 15px; margin-bottom: 20px; }
            .company-info h1 { margin: 0; font-size: 20px; font-weight: 900; color: #1e3a8a; }
            .company-info p { margin: 3px 0 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
            .logo { height: 45px; width: 45px; }
            .title { text-align: center; font-size: 13px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; padding: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; text-align: center; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="company-info">
              <h1>BUILD RMC CORPORATION</h1>
              <p>Plot No. 42, Ready Mix Compound, Industrial Zone</p>
              <p>Email: contact@buildrmc.in | Web: www.buildrmc.in</p>
            </div>
            <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="15" fill="#1e3a8a"/>
              <path d="M30 70V30H45C55 30 60 35 60 42C60 47 56 50 50 51C57 52 62 56 62 62C62 70 55 70 45 70H30ZM40 46H45C49 46 51 44 51 41C51 38 49 37 45 37H40V46ZM40 63H46C50 63 53 61 53 58C53 55 50 54 46 54H40V63Z" fill="#00c0a5"/>
            </svg>
          </div>
          <div class="title">Security Pass Entries Report</div>
          <table>
            <thead>
              <tr>
                <th>Security No</th>
                <th>Gate No</th>
                <th>Gate Passing</th>
                <th>Date</th>
                <th>Time</th>
                <th>Vehicle No</th>
                <th>Driver Name</th>
                <th>Type of movement</th>
                <th>Plant</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportAll = (type: "copy" | "csv") => {
    if (logs.length === 0) return;
    const tsvContent = [
      ["Security No", "Gate No", "Gate Passing", "Date", "Time", "Vehicle No", "Driver Name", "Type of movement", "Plant"].join("\t"),
      ...filtered.map((l, idx) =>
        [`SEC-${idx + 1}`, l.gateNo, l.gatePassing, l.date, l.time, l.vehicleNo || "N/A", l.driverName || "N/A", l.typeOfMovement, l.plant].join("\t")
      ),
    ].join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(tsvContent);
      toast({ title: "Copied All", description: "Copied entries successfully." });
    } else if (type === "csv") {
      const csvData = [
        ["Security No", "Gate No", "Gate Passing", "Date", "Time", "Vehicle No", "Driver Name", "Type of movement", "Plant"].join(","),
        ...filtered.map((l, idx) =>
          [`"SEC-${idx + 1}"`, `"${l.gateNo}"`, `"${l.gatePassing}"`, `"${l.date}"`, `"${l.time}"`, `"${l.vehicleNo || "N/A"}"`, `"${l.driverName || "N/A"}"`, `"${l.typeOfMovement}"`, `"${l.plant}"`].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "security_check_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded", description: "Downloaded complete CSV log file." });
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Security" }, { label: "Security Check List" }]}
      title="SECURITY CHECK LIST"
      activePath="/transport/security/list"
    >
      <div className="w-full py-4 px-4 bg-[#f8fafc] min-h-[calc(100vh-140px)] flex flex-col space-y-4 rounded-lg">
        
        {/* Filters Panel Grid matching Image */}
        <Card className="border border-slate-200/60 shadow-xs bg-white rounded-md p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            
            {/* Security No Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Security No</Label>
              <Input
                value={filterSecurityNo}
                onChange={(e) => setFilterSecurityNo(e.target.value)}
                placeholder="Enter Security ID"
                className="h-10 text-xs font-semibold bg-white border-slate-300 rounded"
              />
            </div>

            {/* From Date Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">From Date :</Label>
              <Input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="h-10 text-xs font-semibold bg-white border-slate-300 rounded"
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">To Date :</Label>
              <Input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="h-10 text-xs font-semibold bg-white border-slate-300 rounded"
              />
            </div>

            {/* Vehicle No Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Vehicle No *</Label>
              <select
                value={filterVehicleNo}
                onChange={(e) => setFilterVehicleNo(e.target.value)}
                className="w-full h-10 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id || v._id} value={v.registrationNo}>
                    {v.registrationNo}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Action Row containing Search, Clear, and Add Security Check List */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 select-none">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSearch}
                className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-9 px-6 rounded border-none active:scale-95 transition-all"
              >
                Search
              </Button>
              <Button
                onClick={handleClear}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-9 px-6 rounded border-none active:scale-95 transition-all"
              >
                Clear
              </Button>
            </div>

            <Link href="/transport/security/new">
              <Button className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-9 px-5 rounded border-none active:scale-95 transition-all">
                + Add Security Check List
              </Button>
            </Link>
          </div>
        </Card>

        {/* Entries Control & Global Table Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200/60 select-none">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 bg-white text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex gap-1">
            <Button
              onClick={() => handleExportAll("copy")}
              className="bg-slate-400 hover:bg-slate-500 text-white text-[10px] font-black h-8 px-4 border-none rounded"
            >
              Copy
            </Button>
            <Button
              onClick={() => handleExportAll("csv")}
              className="bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-black h-8 px-4 border-none rounded"
            >
              CSV
            </Button>
            <Button
              onClick={handlePrintAll}
              className="bg-slate-600 hover:bg-slate-700 text-white text-[10px] font-black h-8 px-4 border-none rounded"
            >
              PDF
            </Button>
          </div>
        </div>

        {/* Security Logs List Table */}
        <div className="border border-slate-200/60 rounded-md overflow-hidden bg-white shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-[10px] font-black uppercase text-slate-800 py-3 px-3 text-center">Security No</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Gate No</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Gate Passing</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Time</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Vehicle No</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3">Driver Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Type of movement</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-3 text-center">Plant</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 px-4 text-center w-[220px]">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Loading security logs...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16 text-xs font-bold text-slate-400 uppercase">
                    No data available in table
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, pageSize).map((item, idx) => {
                  const secNo = `SEC-${idx + 1}`;
                  return (
                    <TableRow
                      key={item._id || item.id}
                      className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/10"
                      }`}
                    >
                      <TableCell className="font-bold text-slate-500 text-xs py-3 px-3 text-center">{secNo}</TableCell>
                      <TableCell className="font-bold text-slate-700 text-xs px-3 text-center">{item.gateNo}</TableCell>
                      <TableCell className="text-xs px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.gatePassing === "Entry"
                              ? "bg-blue-50 text-blue-600 border border-blue-100"
                              : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          }`}
                        >
                          {item.gatePassing}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600 text-xs px-3 text-center">{item.date}</TableCell>
                      <TableCell className="font-semibold text-slate-600 text-xs px-3 text-center">{item.time}</TableCell>
                      <TableCell className="font-extrabold text-[#1e40af] text-xs px-3 text-center">{item.vehicleNo || "N/A"}</TableCell>
                      <TableCell className="font-bold text-slate-700 text-xs px-3 uppercase">{item.driverName || "N/A"}</TableCell>
                      <TableCell className="font-bold text-slate-700 text-xs px-3 text-center">{item.typeOfMovement}</TableCell>
                      <TableCell className="font-extrabold text-slate-800 text-xs px-3 text-center uppercase">{item.plant}</TableCell>
                      
                      {/* ACTION Column with standard 5 action buttons */}
                      <TableCell className="px-4 text-center">
                        <div className="flex items-center justify-center gap-1 select-none">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportRow(item, idx, "pdf")}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                            title="Print PDF"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportRow(item, idx, "copy")}
                            className="h-7 w-7 text-cyan-600 hover:bg-cyan-50 rounded border border-cyan-200"
                            title="Copy TSV"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportRow(item, idx, "csv")}
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200"
                            title="Download CSV"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                            title="Edit Record"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item._id || item.id!)}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Showing entries text info */}
        <div className="text-xs font-bold text-slate-500 select-none">
          Showing {Math.min(filtered.length, pageSize)} of {filtered.length} entries
        </div>

      </div>

      {/* Row Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none animate-in fade-in duration-100">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <span className="text-xl font-bold text-[#00c0a5] leading-none">✎</span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Edit Security Check</h3>
            </div>
            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Plant</Label>
                <select
                  value={editPlant}
                  onChange={(e) => setEditPlant(e.target.value)}
                  className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
                >
                  <option value="FORTUNE CONCRETE">FORTUNE CONCRETE</option>
                  <option value="MARVAL RMC">MARVAL RMC</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Gate Passing</Label>
                <select
                  value={editGatePassing}
                  onChange={(e) => setEditGatePassing(e.target.value)}
                  className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
                >
                  <option value="Entry">Entry</option>
                  <option value="Exit">Exit</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Gate No</Label>
                <Input
                  type="text"
                  value={editGateNo}
                  onChange={(e) => setEditGateNo(e.target.value)}
                  className="h-10 text-xs font-bold border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Type Of Movement</Label>
                <select
                  value={editTypeOfMovement}
                  onChange={(e) => setEditTypeOfMovement(e.target.value)}
                  className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
                >
                  <option value="Sales">Sales</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Visitor">Visitor</option>
                  <option value="Job Work">Job Work</option>
                  <option value="Branch Transfer">Branch Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Vehicle No</Label>
                <select
                  value={editVehicleNo}
                  onChange={(e) => setEditVehicleNo(e.target.value)}
                  className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
                >
                  {vehicles.map((v) => (
                    <option key={v.id || v._id} value={v.registrationNo}>
                      {v.registrationNo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Driver Name</Label>
                <Input
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(e.target.value)}
                  className="h-10 text-xs font-bold border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Date</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-10 text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Time</Label>
                  <Input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="h-10 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <Button
                  type="submit"
                  className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-9 px-4 rounded border-none shadow-sm active:scale-95 transition-all"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-9 px-4 rounded border-none shadow-sm active:scale-95 transition-all"
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </TransportLayout>
  );
}
