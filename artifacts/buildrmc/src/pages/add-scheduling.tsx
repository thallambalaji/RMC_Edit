import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetCustomers,
  useGetSalesOrders,
  useCreateSchedule,
} from "@workspace/api-client-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ListPlus, Loader2, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AddScheduling() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [pump1, setPump1] = useState("");
  const [pump2, setPump2] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [isStrict, setIsStrict] = useState(false);
  const [disableToTime, setDisableToTime] = useState(false);

  // Live data
  const { data: customers, isLoading: customersLoading } = useGetCustomers();
  const { data: allOrders } = useGetSalesOrders();

  // Filter sales orders by selected customer
  const customerOrders = useMemo(() => {
    if (!allOrders || !customerId) return [];
    return allOrders.filter((o) => o.customerId === customerId);
  }, [allOrders, customerId]);

  // Get items of selected order
  const selectedOrder = useMemo(
    () => allOrders?.find((o) => o.id === salesOrderId),
    [allOrders, salesOrderId]
  );

  const { mutate: createSchedule, isPending: isSubmitting } = useCreateSchedule({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Scheduling saved successfully!" });
        queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
        navigate("/customer-po/scheduling/list");
      },
      onError: (err: any) => {
        console.error("Schedule error:", err);
        toast({
          title: "Failed to save schedule",
          description: err?.message || "Please check all required fields.",
          variant: "destructive",
        });
      },
    },
  });

  const handleClear = () => {
    setCustomerId("");
    setSalesOrderId("");
    setPump1("");
    setPump2("");
    setFromTime("");
    setToTime("");
    setIsStrict(false);
    setDisableToTime(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Validation Error", description: "Please select a customer.", variant: "destructive" });
      return;
    }
    if (!salesOrderId) {
      toast({ title: "Validation Error", description: "Please select a Sales Order (PO).", variant: "destructive" });
      return;
    }
    if (!pump1) {
      toast({ title: "Validation Error", description: "Please select Pump 1.", variant: "destructive" });
      return;
    }
    if (!fromTime) {
      toast({ title: "Validation Error", description: "Please set the From Time.", variant: "destructive" });
      return;
    }

    createSchedule({
      customerId,
      salesOrderId,
      plant,
      pump1,
      pump2: pump2 || undefined,
      fromTime,
      toTime: disableToTime ? undefined : toTime || undefined,
      isStrict,
      status: "scheduled",
    });
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-[#3DB9C1]" />
          Add Scheduling
        </h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po/scheduling" className="hover:text-primary transition-colors">Scheduling</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Add Scheduling</span>
        </nav>
      </div>

      {/* Quick nav button */}
      <div className="flex justify-start">
        <Link href="/customer-po/scheduling/list">
          <Button className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white gap-2 h-9">
            <ListPlus className="h-4 w-4" />
            + Scheduling List
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Form ─────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

            {/* Customer */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Customer <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v);
                  setSalesOrderId(""); // reset order when customer changes
                }}
              >
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder={customersLoading ? "Loading..." : "Select Customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {customers?.length === 0 && (
                    <div className="p-2 text-sm text-gray-400 italic text-center">No customers found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Plant */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Plant <span className="text-rose-500">*</span>
              </Label>
              <Select value={plant} onValueChange={setPlant}>
                <SelectTrigger className="h-10 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                  <SelectItem value="Plant B">Plant B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sales Order / PO */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Sales Order (PO) <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={salesOrderId}
                onValueChange={setSalesOrderId}
                disabled={!customerId}
              >
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder={!customerId ? "Select a customer first" : "Choose PO"} />
                </SelectTrigger>
                <SelectContent>
                  {customerOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.poNumber} — {o.poDate}
                    </SelectItem>
                  ))}
                  {customerId && customerOrders.length === 0 && (
                    <div className="p-2 text-sm text-gray-400 italic text-center">No orders for this customer</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Pump 1 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Pump 1 <span className="text-rose-500">*</span>
              </Label>
              <Select value={pump1} onValueChange={setPump1}>
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder="Choose Pump" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pump A">Pump A</SelectItem>
                  <SelectItem value="Pump B">Pump B</SelectItem>
                  <SelectItem value="Pump C">Pump C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Time */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                From Time <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="h-10 border-gray-300"
              />
            </div>

            {/* Pump 2 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Pump 2</Label>
              <Select value={pump2} onValueChange={setPump2}>
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder="Choose Pump (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Pump A">Pump A</SelectItem>
                  <SelectItem value="Pump B">Pump B</SelectItem>
                  <SelectItem value="Pump C">Pump C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* To Time */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">To Time</Label>
              <Input
                type="datetime-local"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                disabled={disableToTime}
                className="h-10 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="strict"
                  checked={isStrict}
                  onCheckedChange={(v) => setIsStrict(!!v)}
                  className="border-gray-400"
                />
                <label htmlFor="strict" className="text-sm font-medium cursor-pointer">
                  Is it strict schedule?
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="disable-to-time"
                  checked={disableToTime}
                  onCheckedChange={(v) => setDisableToTime(!!v)}
                  className="border-gray-400"
                />
                <label htmlFor="disable-to-time" className="text-sm font-medium cursor-pointer">
                  Disable To Time?
                </label>
              </div>
            </div>
          </div>

          {/* Grade table from selected order */}
          <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 bg-gradient-to-r from-[#3DB9C1] to-[#2ea4ac] text-white">
              {["Grade", "Quantity", "PO Quantity", "Rem. Quantity"].map((h) => (
                <div key={h} className="p-3 font-bold text-center text-xs uppercase border-r border-white/20 last:border-0">{h}</div>
              ))}
            </div>
            {selectedOrder?.items && selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 text-center text-sm border-t border-gray-100">
                  <div className="p-3 border-r border-gray-100 font-semibold text-gray-700">{item.grade}</div>
                  <div className="p-3 border-r border-gray-100 text-gray-600">{item.quantity}</div>
                  <div className="p-3 border-r border-gray-100 text-gray-600">{item.quantity}</div>
                  <div className="p-3 text-gray-600">{item.remainingQty ?? item.quantity}</div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-4 text-center text-sm text-gray-400 italic">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border-r border-gray-100 last:border-0 min-h-[44px] flex items-center justify-center">—</div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white px-8 h-11 font-bold shadow-md shadow-[#3DB9C1]/20"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Start Scheduling
            </Button>
            <Button
              type="button"
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 h-11 font-bold"
            >
              Clear
            </Button>
          </div>
        </form>

        {/* ── Scheduling Graph ─────────────────────────────────────── */}
        <div className="w-full lg:w-5/12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="bg-gray-50 p-3 text-center font-bold text-sm border-b border-gray-100 text-gray-700">
            Scheduling Graph
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            {customerId && salesOrderId ? (
              <div className="w-full space-y-4">
                <div className="text-center text-sm text-gray-500 font-medium mb-4">
                  Order: <span className="text-[#3DB9C1] font-bold">{selectedOrder?.poNumber}</span>
                </div>
                {selectedOrder?.items?.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="font-semibold">{item.grade}</span>
                      <span>{item.remainingQty ?? item.quantity} / {item.quantity} m³ remaining</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-[#3DB9C1] to-emerald-400 h-3 rounded-full transition-all"
                        style={{
                          width: `${item.quantity > 0 ? Math.max(5, ((item.remainingQty ?? item.quantity) / item.quantity) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-gray-400 mt-4 italic">
                  Graph will update after scheduling is submitted
                </p>
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm text-center">
                Select a customer and PO to preview the scheduling graph
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
