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
import { ShieldCheck, LogIn, LogOut, AlertOctagon } from "lucide-react";

interface SecurityData {
  _id?: string;
  id?: string;
  date: string;
  time: string;
  vehicleNo: string;
  driverName: string;
  gatePassNo: string;
  checkType: string;
  status: string;
}

export default function SecurityCheckReport() {
  const [logs, setLogs] = useState<SecurityData[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/security-checks");
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

  const stats = useMemo(() => {
    const entries = logs.filter((l) => l.checkType === "In").length;
    const exits = logs.filter((l) => l.checkType === "Out").length;
    const hold = logs.filter((l) => l.status === "hold" || l.status === "violation").length;
    return { entries, exits, hold };
  }, [logs]);

  const activeHolds = useMemo(() => {
    return logs.filter((l) => l.status === "hold" || l.status === "violation");
  }, [logs]);

  return (
    <TransportLayout
      breadcrumbs={[{ label: "Security" }, { label: "Security Check Report" }]}
      title="SECURITY CHECK REPORT"
      activePath="/transport/security/report"
    >
      <div className="space-y-4 flex-1 overflow-auto max-h-full hide-scrollbar">
        {/* Statistics KPI */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <Card className="bg-white border p-4 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-full">
              <LogIn className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Gate Entries</p>
              <p className="text-xl font-black text-slate-800">{stats.entries} Entries</p>
            </div>
          </Card>

          <Card className="bg-white border p-4 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-full">
              <LogOut className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Gate Exits</p>
              <p className="text-xl font-black text-slate-800">{stats.exits} Exits</p>
            </div>
          </Card>

          <Card className="bg-white border p-4 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-3 bg-rose-50 rounded-full">
              <AlertOctagon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Hold / Violations</p>
              <p className="text-xl font-black text-slate-800">{stats.hold} Logs Flagged</p>
            </div>
          </Card>
        </div>

        {/* Flagged Holds Panel */}
        <Card className="border bg-white shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" /> Active Gate Holds & Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow className="border-b">
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3 px-4">Flag Date & Time</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Vehicle No</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Driver Name</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3">Gate Pass No</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-center">Status Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeHolds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      No active gate holds or warning flags recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeHolds.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 border-b last:border-0 bg-rose-50/10">
                      <TableCell className="font-bold text-slate-500 text-xs py-3 px-4">{item.date} at {item.time}</TableCell>
                      <TableCell className="font-extrabold text-[#1e40af] text-xs px-3">{item.vehicleNo}</TableCell>
                      <TableCell className="font-bold text-slate-700 text-xs px-3">{item.driverName}</TableCell>
                      <TableCell className="font-black text-slate-800 text-xs px-3 uppercase">{item.gatePassNo}</TableCell>
                      <TableCell className="text-xs px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                          {item.status}
                        </span>
                      </TableCell>
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
