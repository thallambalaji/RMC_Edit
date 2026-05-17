import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransportLayout } from "@/components/transport-layout";
import { Flame, DollarSign, BarChart3, TrendingUp } from "lucide-react";

interface FuelData {
  id?: string;
  _id?: string;
  date: string;
  vehicleNo: string;
  litres: number;
  amount: number;
}

export default function DieselReport() {
  const [logs, setLogs] = useState<FuelData[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/diesel-consumptions");
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  // Compute Aggregates
  const summary = useMemo(() => {
    const totalLitres = logs.reduce((sum, l) => sum + l.litres, 0);
    const totalAmount = logs.reduce((sum, l) => sum + l.amount, 0);
    const avgCost = totalLitres > 0 ? totalAmount / totalLitres : 0;

    // Vehicle aggregation
    const vehicleMap: Record<string, { litres: number; amount: number; count: number }> = {};
    logs.forEach((l) => {
      if (!vehicleMap[l.vehicleNo]) {
        vehicleMap[l.vehicleNo] = { litres: 0, amount: 0, count: 0 };
      }
      vehicleMap[l.vehicleNo].litres += l.litres;
      vehicleMap[l.vehicleNo].amount += l.amount;
      vehicleMap[l.vehicleNo].count += 1;
    });

    const vehicleSummary = Object.entries(vehicleMap).map(([reg, data]) => ({
      vehicleNo: reg,
      totalLitres: data.litres,
      totalAmount: data.amount,
      avgRefuel: data.litres / data.count,
    }));

    return { totalLitres, totalAmount, avgCost, vehicleSummary };
  }, [logs]);

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Diesel Consumption" }, { label: "Consumption Report" }]}
      title="DIESEL CONSUMPTION REPORT"
      activePath="/transport/diesel/report"
    >
      <div className="space-y-4 flex-1 overflow-auto max-h-full hide-scrollbar">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <Card className="bg-white border p-4 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-full">
              <Flame className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Fuel Volume</p>
              <p className="text-xl font-black text-slate-800">{summary.totalLitres.toFixed(1)} Ltrs</p>
            </div>
          </Card>

          <Card className="bg-white border p-4 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-full">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Fuel Cost</p>
              <p className="text-xl font-black text-slate-800">₹ {summary.totalAmount.toLocaleString()}</p>
            </div>
          </Card>

          <Card className="bg-white border p-4 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avg Cost / Litre</p>
              <p className="text-xl font-black text-slate-800">₹ {summary.avgCost.toFixed(2)}/L</p>
            </div>
          </Card>
        </div>

        {/* Aggregate breakdown */}
        <Card className="border bg-white shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Vehicle-by-Vehicle Refuel Aggregates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow className="border-b">
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3 px-4">Vehicle Registration No</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">Total Fuel Refueled</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">Total Fuel Cost (₹)</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">Avg Refuel Size (Ltrs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.vehicleSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      No refuel reports available.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.vehicleSummary.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 border-b last:border-0">
                      <TableCell className="font-extrabold text-[#1e40af] text-xs py-3 px-4">{item.vehicleNo}</TableCell>
                      <TableCell className="font-bold text-slate-800 text-xs px-3 text-right">{item.totalLitres.toFixed(1)} L</TableCell>
                      <TableCell className="font-black text-emerald-600 text-xs px-3 text-right">₹ {item.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-slate-600 text-xs px-3 text-right">{item.avgRefuel.toFixed(1)} L / trip</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TransportLayout>
  );
}
