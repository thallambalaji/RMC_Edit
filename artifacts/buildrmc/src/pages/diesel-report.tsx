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
import { TransportLayout, useTransportFilters } from "@/components/transport-layout";
import {
  FileText,
  Copy,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { ExportDropdown } from "@/components/export-dropdown";
import { useGetMasters } from "@workspace/api-client-react";

interface EngineData {
  engineType: string;
  calculationType: string;
  opening: number;
  closing: number;
}

interface FuelData {
  _id?: string;
  id?: string;
  plant?: string;
  date: string;
  vehicleNo: string;
  driverName?: string;
  litres: number;
  takenFrom?: string;
  dieselRate?: number;
  amount: number;
  pumpOperator: string;
  engines?: EngineData[];
}

export default function DieselReport() {
  const { toast } = useToast();
  const { showFilters } = useTransportFilters();
  const { data: dbPlants } = useGetMasters("plant");
  const headerStyle = "bg-[#ea580c] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";
  const [logs, setLogs] = useState<FuelData[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Filter State
  const [reportType, setReportType] = useState("Date Wise Consumption Report");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [plant, setPlant] = useState("All plant");

  // Display results state (only populated on Generate click)
  const [reportResults, setReportResults] = useState<FuelData[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diesel-consumptions");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = () => {
    setReportType("Date Wise Consumption Report");
    setFromDate("");
    setToDate("");
    setPlant("All plant");
    setReportResults([]);
    setHasGenerated(false);
  };

  const handleGenerate = () => {
    setLoading(true);
    // Filter logs based on selection
    const filtered = logs.filter((l) => {
      // Plant filter
      if (plant !== "All plant") {
        const itemPlant = l.plant || "";
        if (itemPlant.toLowerCase() !== plant.toLowerCase()) {
          return false;
        }
      }
      // From date filter
      if (fromDate) {
        const itemDate = new Date(l.date);
        const fDate = new Date(fromDate);
        if (itemDate < fDate) return false;
      }
      // To date filter
      if (toDate) {
        const itemDate = new Date(l.date);
        const tDate = new Date(toDate);
        if (itemDate > tDate) return false;
      }
      return true;
    });

    // Apply sorting/grouping based on reportType
    let processed = [...filtered];
    if (reportType === "Date Wise Consumption Report") {
      processed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (reportType === "Date With Vehicle Wise Consumption Report") {
      // Sort by Vehicle then by Date
      processed.sort((a, b) => {
        if (a.vehicleNo !== b.vehicleNo) {
          return a.vehicleNo.localeCompare(b.vehicleNo);
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }

    setReportResults(processed);
    setHasGenerated(true);
    setLoading(false);

    toast({
      title: "Report Generated",
      description: `Found ${processed.length} matching entries.`,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fuel record from the database?")) return;
    try {
      const res = await fetch(`/api/diesel-consumptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Log Deleted",
          description: "Fuel record deleted successfully.",
        });
        // Remove from list & results
        setLogs(prev => prev.filter(item => item._id !== id && item.id !== id));
        setReportResults(prev => prev.filter(item => item._id !== id && item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper date formatter: YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Individual Actions
  const printSingleLog = (item: FuelData) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const engineRowsHtml = item.engines && item.engines.length > 0
      ? item.engines.map((eng, idx) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eng.engineType}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${eng.calculationType}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${eng.opening}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${eng.closing}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${Number(eng.closing || 0) - Number(eng.opening || 0)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #777;">No Engine Readings Registered</td></tr>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Diesel Log - ${item.vehicleNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-container { margin-right: 20px; }
            .company-details h1 { margin: 0; font-size: 24px; color: #ea580c; font-weight: 800; }
            .company-details p { margin: 2px 0; font-size: 11px; color: #666; font-weight: 500; }
            .doc-title { text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 25px 0; letter-spacing: 1px; color: #222; }
            .grid-info { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .info-box { border: 1px solid #eee; padding: 12px; border-radius: 4px; background: #fafafa; }
            .info-box p { margin: 6px 0; font-size: 12px; }
            .info-box strong { color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background: #ea580c; color: white; padding: 8px; text-align: left; text-transform: uppercase; font-size: 10px; font-weight: 700; }
            td { border: 1px solid #eee; padding: 8px; }
            .footer-sigs { display: flex; justify-content: space-between; margin-top: 80px; }
            .sig-line { width: 200px; border-top: 1px dashed #999; text-align: center; font-size: 11px; padding-top: 8px; color: #666; font-weight: 600; }
          </style>
        </head>
        <body>
          <div style="display: flex; height: 6px; width: 100%;">
            <div style="width: 40%; background: linear-gradient(to right, #a855f7, #ec4899, #db2777);"></div>
            <div style="width: 30%; background: linear-gradient(to right, #06b6d4, #ea580c);"></div>
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
                    <stop offset="60%" stop-color="#ea580c" />
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
          <div class="doc-title">Diesel Consumption Log</div>
          <div class="grid-info">
            <div class="info-box">
              <p><strong>Log ID:</strong> ${item._id || item.id || "N/A"}</p>
              <p><strong>Consumption Date:</strong> ${formatDate(item.date)}</p>
              <p><strong>Plant Name:</strong> ${item.plant || ""}</p>
              <p><strong>Fuel Pump Source:</strong> ${item.takenFrom === "From Plant Stock" ? "Stock" : (item.takenFrom || "Stock")}</p>
            </div>
            <div class="info-box">
              <p><strong>Vehicle Number:</strong> ${item.vehicleNo}</p>
              <p><strong>Driver Name:</strong> ${item.driverName || item.pumpOperator || "Super Admin"}</p>
              <p><strong>Quantity:</strong> ${item.litres} Liters</p>
              <p><strong>Diesel Rate:</strong> ₹${item.dieselRate || 0} / L</p>
              <p><strong>Total Amount:</strong> ₹${item.amount?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div style="font-weight: 800; font-size: 13px; margin-bottom: 8px; color: #222; text-transform: uppercase; letter-spacing: 0.5px;">Engine Readings Details</div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Engine Type</th>
                <th>Calculation Type</th>
                <th style="text-align: right;">Opening Reading</th>
                <th style="text-align: right;">Closing Reading</th>
                <th style="text-align: right;">Net Run</th>
              </tr>
            </thead>
            <tbody>
              ${engineRowsHtml}
            </tbody>
          </table>

          <div class="footer-sigs">
            <div class="sig-line">Pump Operator / Prepared By</div>
            <div class="sig-line">Authorized Signatory</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copySingleLog = (item: FuelData) => {
    const text = `Date: ${formatDate(item.date)}\tVehicle No: ${item.vehicleNo}\tQuantity: ${item.litres} Ltrs\tRate: ₹${item.dieselRate || 0}\tAmount: ₹${item.amount}\tPlant: ${item.plant || ""}\tTaken From: ${item.takenFrom || "Stock"}\tDriver: ${item.driverName || item.pumpOperator || "Super Admin"}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied Details",
      description: "Single log details copied to clipboard.",
    });
  };

  const downloadSingleCSV = (item: FuelData) => {
    const headers = "Vehicle No,Date,Quantity,Rate,Amount,Driver,Plant,Taken From";
    const row = `"${item.vehicleNo}","${formatDate(item.date)}",${item.litres},${item.dieselRate || 0},${item.amount || 0},"${item.driverName || item.pumpOperator || "Super Admin"}","${item.plant || ""}","${item.takenFrom || "Stock"}"`;
    const csvContent = "data:text/csv;charset=utf-8," + [headers, row].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `diesel_log_${item.vehicleNo}_${item.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global Exports for all listed data
  const printAllLogs = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Check if consolidation report
    if (reportType === "Diesel Consolidate Report") {
      const consolidated = getConsolidatedData();
      const rowsHtml = consolidated.map((item, idx) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">${item.vehicleNo}</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: right; font-weight: bold;">${item.totalVolume.toFixed(1)} Ltrs</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: right; font-weight: bold;">₹${item.totalCost.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: right;">${item.avgRefuel.toFixed(1)} Ltrs</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${item.tripCount}</td>
        </tr>
      `).join("");

      const grandVolume = consolidated.reduce((sum, i) => sum + i.totalVolume, 0);
      const grandCost = consolidated.reduce((sum, i) => sum + i.totalCost, 0);

      printWindow.document.write(`
        <html>
          <head>
            <title>Diesel Consolidate Report</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
              .header { display: flex; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 20px; }
              .logo-container { margin-right: 20px; }
              .company-details h1 { margin: 0; font-size: 24px; color: #ea580c; font-weight: 800; }
              .company-details p { margin: 2px 0; font-size: 11px; color: #666; font-weight: 500; }
              .doc-title { text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 20px 0; letter-spacing: 1px; color: #222; }
              .report-meta { font-size: 12px; font-weight: bold; margin-bottom: 20px; color: #555; background: #fafafa; padding: 12px; border: 1px solid #eee; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background: #ea580c; color: white; padding: 8px; text-align: left; text-transform: uppercase; font-size: 10px; font-weight: 700; }
              td { border: 1px solid #eee; padding: 8px; }
              .summary-row td { background: #fafafa; font-weight: bold; border-top: 2px solid #ea580c; }
            </style>
          </head>
          <body>
            <div style="display: flex; height: 6px; width: 100%;">
              <div style="width: 40%; background: linear-gradient(to right, #a855f7, #ec4899, #db2777);"></div>
              <div style="width: 30%; background: linear-gradient(to right, #06b6d4, #ea580c);"></div>
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
                      <stop offset="60%" stop-color="#ea580c" />
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
            <div class="doc-title">Diesel Consolidate Report</div>
            <div class="report-meta">
              Report Generated: ${new Date().toLocaleDateString()} | 
              Plant: ${plant} | 
              From Date: ${fromDate || "Initial"} | To Date: ${toDate || "Latest"}
            </div>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Vehicle No</th>
                  <th style="text-align: right;">Total Volume (Ltrs)</th>
                  <th style="text-align: right;">Total Cost (₹)</th>
                  <th style="text-align: right;">Avg Refuel Size</th>
                  <th style="text-align: center;">Trip Count</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="summary-row">
                  <td colspan="2" style="text-align: right;">TOTAL:</td>
                  <td style="text-align: right;">${grandVolume.toFixed(1)} Ltrs</td>
                  <td style="text-align: right;">₹${grandCost.toLocaleString()}</td>
                  <td colspan="2"></td>
                </tr>
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // Default Date Wise or Date with Vehicle Wise
    const rowsHtml = reportResults.map((item, idx) => {
      const enginesSummary = item.engines && item.engines.length > 0
        ? item.engines.map(e => `${e.engineType} (${e.opening} - ${e.closing} ${e.calculationType})`).join("<br/>")
        : "N/A";
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #eee;">${item.vehicleNo}</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${formatDate(item.date)}</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: right; font-weight: bold;">${item.litres}</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: right;">₹${item.dieselRate || 0}</td>
          <td style="padding: 8px; border: 1px solid #eee; text-align: right; font-weight: bold;">₹${item.amount?.toLocaleString() || 0}</td>
          <td style="padding: 8px; border: 1px solid #eee;">${item.driverName || item.pumpOperator || "Super Admin"}</td>
          <td style="padding: 8px; border: 1px solid #eee;">${item.plant || ""}</td>
          <td style="padding: 8px; border: 1px solid #eee; font-size: 10px; color: #555;">${enginesSummary}</td>
        </tr>
      `;
    }).join("");

    const grandVolume = reportResults.reduce((sum, item) => sum + item.litres, 0);
    const grandCost = reportResults.reduce((sum, item) => sum + (item.amount || 0), 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Diesel Consumption Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-container { margin-right: 20px; }
            .company-details h1 { margin: 0; font-size: 24px; color: #ea580c; font-weight: 800; }
            .company-details p { margin: 2px 0; font-size: 11px; color: #666; font-weight: 500; }
            .doc-title { text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 20px 0; letter-spacing: 1px; color: #222; }
            .report-meta { font-size: 12px; font-weight: bold; margin-bottom: 20px; color: #555; background: #fafafa; padding: 12px; border: 1px solid #eee; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #ea580c; color: white; padding: 8px; text-align: left; text-transform: uppercase; font-size: 10px; font-weight: 700; }
            td { border: 1px solid #eee; padding: 8px; }
            .summary-row td { background: #fafafa; font-weight: bold; border-top: 2px solid #ea580c; }
          </style>
        </head>
        <body>
          <div style="display: flex; height: 6px; width: 100%;">
            <div style="width: 40%; background: linear-gradient(to right, #a855f7, #ec4899, #db2777);"></div>
            <div style="width: 30%; background: linear-gradient(to right, #06b6d4, #ea580c);"></div>
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
                    <stop offset="60%" stop-color="#ea580c" />
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
          <div class="doc-title">${reportType}</div>
          <div class="report-meta">
            Report Generated: ${new Date().toLocaleDateString()} | 
            Plant: ${plant} | 
            From Date: ${fromDate || "Initial"} | To Date: ${toDate || "Latest"}
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Vehicle No</th>
                <th>Date</th>
                <th style="text-align: right;">Quantity (Ltrs)</th>
                <th style="text-align: right;">Rate (₹)</th>
                <th style="text-align: right;">Total Amount</th>
                <th>Driver/Operator</th>
                <th>Plant</th>
                <th>Engine Readings</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="summary-row">
                <td colspan="3" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right;">${grandVolume.toFixed(1)} Ltrs</td>
                <td></td>
                <td style="text-align: right;">₹${grandCost.toLocaleString()}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyAllLogs = () => {
    if (reportType === "Diesel Consolidate Report") {
      const consolidated = getConsolidatedData();
      const headers = "Vehicle No\tTotal Volume (Ltrs)\tTotal Cost (₹)\tAvg Refuel\tTrip Count";
      const rows = consolidated.map(item =>
        `${item.vehicleNo}\t${item.totalVolume.toFixed(1)}\t${item.totalCost}\t${item.avgRefuel.toFixed(1)}\t${item.tripCount}`
      ).join("\n");
      navigator.clipboard.writeText(`${headers}\n${rows}`);
    } else {
      const headers = "Vehicle No\tDate\tQuantity (Ltrs)\tRate (₹)\tAmount (₹)\tDriver\tPlant\tTaken From";
      const rows = reportResults.map(item =>
        `${item.vehicleNo}\t${formatDate(item.date)}\t${item.litres}\t${item.dieselRate || 0}\t${item.amount || 0}\t${item.driverName || item.pumpOperator || "Super Admin"}\t${item.plant || ""}\t${item.takenFrom || "Stock"}`
      ).join("\n");
      navigator.clipboard.writeText(`${headers}\n${rows}`);
    }

    toast({
      title: "Copied All",
      description: "All report logs copied to clipboard.",
    });
  };

  const downloadAllCSV = () => {
    let csvContent = "";
    if (reportType === "Diesel Consolidate Report") {
      const consolidated = getConsolidatedData();
      const headers = "Vehicle No,Total Volume (Ltrs),Total Cost (₹),Avg Refuel,Trip Count";
      const rows = consolidated.map(item =>
        `"${item.vehicleNo}",${item.totalVolume.toFixed(1)},${item.totalCost},${item.avgRefuel.toFixed(1)},${item.tripCount}`
      );
      csvContent = [headers, ...rows].join("\n");
    } else {
      const headers = "Vehicle No,Date,Quantity (Ltrs),Rate (₹),Amount (₹),Driver,Plant,Taken From";
      const rows = reportResults.map(item =>
        `"${item.vehicleNo}","${formatDate(item.date)}",${item.litres},${item.dieselRate || 0},${item.amount || 0},"${item.driverName || item.pumpOperator || "Super Admin"}","${item.plant || ""}","${item.takenFrom || "Stock"}"`
      );
      csvContent = [headers, ...rows].join("\n");
    }

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `diesel_consumption_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Completed",
      description: "CSV file downloaded successfully.",
    });
  };

  // Consolidation calculation helper
  const getConsolidatedData = () => {
    const map: Record<string, { totalVolume: number; totalCost: number; tripCount: number }> = {};
    reportResults.forEach((l) => {
      if (!map[l.vehicleNo]) {
        map[l.vehicleNo] = { totalVolume: 0, totalCost: 0, tripCount: 0 };
      }
      map[l.vehicleNo].totalVolume += l.litres;
      map[l.vehicleNo].totalCost += l.amount || 0;
      map[l.vehicleNo].tripCount += 1;
    });

    return Object.entries(map).map(([vehicleNo, d]) => ({
      vehicleNo,
      totalVolume: d.totalVolume,
      totalCost: d.totalCost,
      tripCount: d.tripCount,
      avgRefuel: d.totalVolume / d.tripCount,
    }));
  };

  return (
    <TransportLayout
      breadcrumbs={[
        { label: "Diesel Consumption" },
        { label: "Diesel Consumption Report" }
      ]}
      title="DIESEL CONSUMPTION REPORT"
      activePath="/transport/diesel/report"
    >
      <div className="w-full flex-1 flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden min-h-[calc(100vh-140px)]">
        
        {/* Advanced Filters Panel */}
        {showFilters && (
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Report Type *</Label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
            >
              <option value="Date Wise Consumption Report">Date Wise Consumption Report</option>
              <option value="Date With Vehicle Wise Consumption Report">Date With Vehicle Wise Consumption Report</option>
              <option value="Diesel Consolidate Report">Diesel Consolidate Report</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 text-xs font-semibold bg-white border-slate-200 rounded focus:border-[#ea580c] focus:ring-[#ea580c]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 text-xs font-semibold bg-white border-slate-200 rounded focus:border-[#ea580c] focus:ring-[#ea580c]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Plant *</Label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="w-full h-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
            >
              <option value="All plant">All plant</option>
              {dbPlants?.map((p: any) => (
                <option key={p.id || p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              onClick={handleGenerate}
              className="bg-[#ea580c] hover:bg-[#d97706] text-white font-bold text-xs h-10 px-6 rounded border-none shadow-sm active:scale-95 transition-all"
            >
              Generate
            </Button>
            <Button
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-10 px-6 rounded border-none shadow-sm active:scale-95 transition-all"
            >
              Clear
            </Button>
          </div>
        </div>
        )}

        {/* Global actions and results list */}
        <div className="flex-1 overflow-auto p-4 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Generating report...
            </div>
          ) : !hasGenerated ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed rounded-lg">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-slate-350 mb-3" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7A48.656 48.656 0 0012 4.5c-1.232 0-2.453.046-3.662.138a4.006 4.006 0 00-3.7 3.7C4.546 9.547 4.5 10.768 4.5 12s.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7c1.209.092 2.43.138 3.662.138 1.232 0 2.453-.046 3.662-.138a4.006 4.006 0 003.7-3.7C19.454 14.453 19.5 13.232 19.5 12z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 8v4l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">No Report Generated</h3>
              <p className="text-[11px] text-slate-450 max-w-xs font-medium">Select report filters above and click Generate to view consumption data.</p>
            </div>
          ) : reportResults.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed rounded-lg">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">No matching logs found</h3>
              <p className="text-[11px] text-slate-400 mt-1">Try modifying your date filters or plant selections.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              
              {/* Export Toolbar */}
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 select-none">
                <div className="text-xs font-bold text-slate-600 uppercase">
                  Showing {reportResults.length} records matching criteria
                </div>
                <div className="flex items-center gap-2">
                  <ExportDropdown onCopy={copyAllLogs} onCSV={downloadAllCSV} onPDF={printAllLogs} />
                </div>
              </div>

              {/* Report Tables based on Type */}
              {reportType === "Diesel Consolidate Report" ? (
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm flex-1">
                  <Table>
                    <TableHeader className="bg-[#ea580c] hover:bg-[#ea580c]">
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableHead className={`${headerStyle} w-20`}>S.No</TableHead>
                        <TableHead className={`${headerStyle} text-left`}>Vehicle No</TableHead>
                        <TableHead className={`${headerStyle} text-right`}>Total Volume (Ltrs)</TableHead>
                        <TableHead className={`${headerStyle} text-right`}>Total Cost (₹)</TableHead>
                        <TableHead className={`${headerStyle} text-right`}>Avg Refuel Size (Ltrs)</TableHead>
                        <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter w-32">Trip Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getConsolidatedData().map((item, idx) => (
                        <TableRow
                          key={idx}
                          className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/10"
                          }`}
                        >
                          <TableCell className="font-bold text-slate-600 text-xs py-3 px-4">{idx + 1}</TableCell>
                          <TableCell className="font-extrabold text-slate-700 text-xs px-3">{item.vehicleNo}</TableCell>
                          <TableCell className="font-black text-slate-800 text-xs px-3 text-right">{item.totalVolume.toFixed(1)}</TableCell>
                          <TableCell className="font-black text-[#ea580c] text-xs px-3 text-right">₹{item.totalCost.toLocaleString()}</TableCell>
                          <TableCell className="font-semibold text-slate-600 text-xs px-3 text-right">{item.avgRefuel.toFixed(1)}</TableCell>
                          <TableCell className="font-bold text-slate-600 text-xs px-4 text-center">{item.tripCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm flex-1">
                  <Table>
                    <TableHeader className="bg-[#ea580c] hover:bg-[#ea580c]">
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle w-24`}>S.No</TableHead>
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Vehicle No</TableHead>
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Date</TableHead>
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle text-right`}>Quantity</TableHead>
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle text-right`}>Rate</TableHead>
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle text-right`}>Amount</TableHead>
                        <TableHead rowSpan={2} className={`${headerStyle} align-middle text-left`}>Plant</TableHead>
                        <TableHead colSpan={4} className="bg-[#ea580c] text-white font-black py-1 px-2 text-center text-[9px] border-r border-white/10 uppercase tracking-tighter border-b border-white/10">Engine</TableHead>
                        <TableHead rowSpan={2} className="bg-[#ea580c] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter align-middle w-40">Actions</TableHead>
                      </TableRow>
                      <TableRow className="border-0 hover:bg-transparent bg-[#ea580c]">
                        <TableHead className={headerStyle}>Engine Type</TableHead>
                        <TableHead className={headerStyle}>Type</TableHead>
                        <TableHead className={`${headerStyle} text-right`}>Opening</TableHead>
                        <TableHead className={`${headerStyle} text-right`}>Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportResults.map((item, idx) => (
                        <TableRow
                          key={item._id || item.id}
                          className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/10"
                          }`}
                        >
                          <TableCell className="font-bold text-slate-600 text-xs py-3 px-4">{idx + 1}</TableCell>
                          <TableCell className="font-extrabold text-slate-700 text-xs px-3">{item.vehicleNo}</TableCell>
                          <TableCell className="font-bold text-slate-600 text-xs px-3">{formatDate(item.date)}</TableCell>
                          <TableCell className="font-black text-slate-800 text-xs px-3 text-right">{item.litres}</TableCell>
                          <TableCell className="font-medium text-slate-500 text-xs px-3 text-right">₹{item.dieselRate || 0}</TableCell>
                          <TableCell className="font-black text-slate-800 text-xs px-3 text-right">₹{item.amount?.toLocaleString() || 0}</TableCell>
                          <TableCell className="font-semibold text-slate-650 text-xs px-3">{item.plant || ""}</TableCell>

                          {/* Engine sub-rows span */}
                          <TableCell className="p-0" colSpan={4}>
                            {item.engines && item.engines.length > 0 ? (
                              item.engines.map((eng, eIdx) => (
                                <div
                                  key={eIdx}
                                  className={`grid grid-cols-4 text-xs font-semibold ${
                                    eIdx > 0 ? "border-t border-slate-100" : ""
                                  }`}
                                >
                                  <div className="p-3 border-r border-slate-100 text-slate-650 font-bold">{eng.engineType}</div>
                                  <div className="p-3 border-r border-slate-100 text-slate-500">{eng.calculationType}</div>
                                  <div className="p-3 border-r border-slate-100 text-slate-700 text-right">{eng.opening}</div>
                                  <div className="p-3 text-slate-700 text-right">{eng.closing}</div>
                                </div>
                              ))
                            ) : (
                              <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 p-3 text-center">
                                <div className="col-span-4">N/A</div>
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="px-4">
                            <div className="flex items-center justify-center gap-1.5 select-none">
                              <Button
                                onClick={() => printSingleLog(item)}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#ea580c] hover:text-[#ea580c] hover:bg-orange-50/40 rounded-full border-none flex items-center justify-center"
                                title="Print PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => copySingleLog(item)}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full border-none flex items-center justify-center"
                                title="Copy"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => downloadSingleCSV(item)}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border-none flex items-center justify-center"
                                title="CSV"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(item._id || item.id!)}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full border-none flex items-center justify-center"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TransportLayout>
  );
}
