import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { ExportDropdown } from "@/components/export-dropdown";

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

export default function SecurityCheckReport() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Filters State
  const [reportType, setReportType] = useState("Date Wise Check");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");

  // Applied Filters State
  const [appliedReportType, setAppliedReportType] = useState("Date Wise Check");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [appliedVehicleNo, setAppliedVehicleNo] = useState("");

  const fetchData = async () => {
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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = () => {
    setAppliedReportType(reportType);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedVehicleNo(vehicleNo);
    setGenerated(true);
    toast({
      title: "Report Generated",
      description: "Displaying matching security check logs.",
    });
  };

  const handleClear = () => {
    setReportType("Date Wise Check");
    setFromDate("");
    setToDate("");
    setVehicleNo("");
    setAppliedReportType("Date Wise Check");
    setAppliedFromDate("");
    setAppliedToDate("");
    setAppliedVehicleNo("");
    setGenerated(false);
  };

  // Report Filter Logic
  const filteredLogs = useMemo(() => {
    if (!generated) return [];
    return logs.filter((l, idx) => {
      // 1. Date Range filtering
      if (appliedFromDate && l.date < appliedFromDate) return false;
      if (appliedToDate && l.date > appliedToDate) return false;

      // 2. Report Type specific filtering
      if (appliedReportType === "Vehicle Wise Report" && appliedVehicleNo) {
        if (l.vehicleNo !== appliedVehicleNo) return false;
      }
      if (appliedReportType === "Date With Unchecked Data") {
        // e.g. entry without vehicle registered or custom logic, but let's show all matching date
      }

      return true;
    });
  }, [logs, generated, appliedReportType, appliedFromDate, appliedToDate, appliedVehicleNo]);

  // PDF Print with company header
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredLogs
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
            .title { text-align: center; font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 25px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; padding: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; text-align: center; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div style="display: flex; height: 6px; width: 100%;">
            <div style="width: 40%; background: linear-gradient(to right, #a855f7, #ec4899, #db2777);"></div>
            <div style="width: 30%; background: linear-gradient(to right, #06b6d4, #3b82f6);"></div>
            <div style="width: 30%; background: linear-gradient(to right, #f97316, #ef4444);"></div>
          </div>
          <div style="background-color: #131522; padding: 16px; display: flex; align-items: center; gap: 20px; color: white; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
            <div style="background-color: black; width: 64px; height: 64px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #1e293b;">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="aGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="100%" stop-color="#f43f5e" />
                  </linearGradient>
                  <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#06b6d4" />
                    <stop offset="60%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#f97316" />
                  </linearGradient>
                </defs>
                <path d="M 18 80 L 46 20 L 56 20 L 28 80 Z" fill="url(#aGrad)" />
                <path d="M 46 20 L 56 20 L 36 80 L 26 80 Z" fill="url(#eGrad)" />
                <path d="M 51 20 L 82 20 L 78 30 L 48 30 Z" fill="url(#eGrad)" />
                <path d="M 41 47 L 76 47 L 72 57 L 38 57 Z" fill="url(#eGrad)" />
                <path d="M 31 70 L 82 70 L 78 80 L 27 80 Z" fill="url(#eGrad)" />
              </svg>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: white; line-height: 1; text-align: left;">FORTUNE CONCRETE</h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 600; color: #f97316; letter-spacing: 1px; text-align: left;">Building Trust &bull; Delivering Excellence</p>
              <div style="width: 100%; height: 1px; background-color: rgba(51, 65, 85, 0.6); margin: 6px 0;"></div>
              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 8px; color: #cbd5e1; font-weight: bold;">
                <span style="display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                  Kompally, TS
                </span>
                <span style="display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                  9010514880
                </span>
                <span style="display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: 4px; height: 4px; background-color: #f97316;"></span>
                  abcs3d@gmail.com
                </span>
              </div>
            </div>
          </div>
          <div class="title">Security Check Report (${appliedReportType})</div>
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

  const handleExport = (type: "copy" | "csv") => {
    if (filteredLogs.length === 0) return;
    const headers = ["Security No", "Gate No", "Gate Passing", "Date", "Time", "Vehicle No", "Driver Name", "Type of movement", "Plant"];

    if (type === "copy") {
      const tsvContent = [
        headers.join("\t"),
        ...filteredLogs.map((l, idx) =>
          [`SEC-${idx + 1}`, l.gateNo, l.gatePassing, l.date, l.time, l.vehicleNo || "N/A", l.driverName || "N/A", l.typeOfMovement, l.plant].join("\t")
        ),
      ].join("\n");
      navigator.clipboard.writeText(tsvContent);
      toast({ title: "Copied to Clipboard" });
    } else if (type === "csv") {
      const csvContent = [
        headers.join(","),
        ...filteredLogs.map((l, idx) =>
          [`"SEC-${idx + 1}"`, `"${l.gateNo}"`, `"${l.gatePassing}"`, `"${l.date}"`, `"${l.time}"`, `"${l.vehicleNo || "N/A"}"`, `"${l.driverName || "N/A"}"`, `"${l.typeOfMovement}"`, `"${l.plant}"`].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "security_check_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    }
  };

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Security" }, { label: "Security Check Report" }]}
      title="SECURITY CHECK REPORT"
      activePath="/transport/security/report"
    >
      <div className="w-full py-4 px-4 bg-[#f8fafc] min-h-[calc(100vh-140px)] flex flex-col space-y-4 rounded-lg">
        
        {/* Filters Card matching Screenshot */}
        <Card className="border border-slate-200/60 shadow-xs bg-white rounded-md p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            
            {/* Report Type Dropdown */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Report Type <span className="text-rose-500">*</span>
              </Label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full h-10 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
              >
                <option value="Date Wise Check">Date Wise Check</option>
                <option value="Date With Cycle Wise Check">Date With Cycle Wise Check</option>
                <option value="Date With Unchecked Data">Date With Unchecked Data</option>
                <option value="Vehicle Wise Report">Vehicle Wise Report</option>
              </select>
            </div>

            {/* From Date selector */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 text-xs font-semibold bg-white border-slate-300 rounded"
              />
            </div>

            {/* To Date selector */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 text-xs font-semibold bg-white border-slate-300 rounded"
              />
            </div>

          </div>

          {/* Conditional Vehicle Selection */}
          {reportType === "Vehicle Wise Report" && (
            <div className="mt-4 max-w-sm space-y-1 animate-in fade-in duration-100">
              <Label className="text-xs font-bold text-slate-700">Select Vehicle *</Label>
              <select
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full h-10 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00c0a5]"
              >
                <option value="">Choose Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id || v._id} value={v.registrationNo}>
                    {v.registrationNo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Generate and Clear Buttons */}
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 select-none">
            <Button
              onClick={handleGenerate}
              className="bg-[#00c0a5] hover:bg-[#00a890] text-white font-bold text-xs h-9 px-6 rounded border-none active:scale-95 transition-all"
            >
              Generate
            </Button>
            <Button
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-9 px-6 rounded border-none active:scale-95 transition-all"
            >
              Clear
            </Button>
          </div>
        </Card>

        {/* Results Area */}
        {generated && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Table Actions Bar */}
            <div className="flex items-center justify-between bg-white p-3 rounded border border-slate-200/60 select-none">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Generated {filteredLogs.length} matching report records
              </div>
              <ExportDropdown onCopy={() => handleExport("copy")} onCSV={() => handleExport("csv")} onPDF={handlePrint} />
            </div>

            {/* Generated Data Table */}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-xs font-bold text-slate-400 uppercase">
                        No report entries found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((item, idx) => (
                      <TableRow
                        key={item._id || item.id}
                        className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/10"
                        }`}
                      >
                        <TableCell className="font-bold text-slate-500 text-xs py-3 px-3 text-center">SEC-{idx + 1}</TableCell>
                        <TableCell className="font-bold text-slate-700 text-xs px-3 text-center">{item.gateNo}</TableCell>
                        <TableCell className="text-xs px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {item.gatePassing}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-600 text-xs px-3 text-center">{item.date}</TableCell>
                        <TableCell className="font-semibold text-slate-600 text-xs px-3 text-center">{item.time}</TableCell>
                        <TableCell className="font-extrabold text-[#1e40af] text-xs px-3 text-center">{item.vehicleNo || "N/A"}</TableCell>
                        <TableCell className="font-bold text-slate-700 text-xs px-3 uppercase">{item.driverName || "N/A"}</TableCell>
                        <TableCell className="font-bold text-slate-700 text-xs px-3 text-center">{item.typeOfMovement}</TableCell>
                        <TableCell className="font-extrabold text-slate-800 text-xs px-3 text-center uppercase">{item.plant}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

          </div>
        )}

      </div>
    </TransportLayout>
  );
}
