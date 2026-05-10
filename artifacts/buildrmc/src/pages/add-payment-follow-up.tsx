import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  ChevronRight,
  Wallet,
  Sparkles,
  ListPlus,
  User,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ----- Mock customer database -----
const CUSTOMERS: Record<
  string,
  { name: string; phone: string; email: string; balance: string }
> = {
  ramesh: {
    name: "Ramesh Constructions Pvt Ltd",
    phone: "+91 98765 43210",
    email: "ramesh@constructions.com",
    balance: "₹ 2,45,800",
  },
  kumar: {
    name: "Kumar Builders",
    phone: "+91 91234 56789",
    email: "kumar@builders.com",
    balance: "₹ 98,500",
  },
};

export default function AddPaymentFollowUp() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState("");
  const [status, setStatus] = useState("");
  const [followupDate, setFollowupDate] = useState("2026-05-09");
  const [followupTime, setFollowupTime] = useState("14:49:15");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedCustomer = customer ? CUSTOMERS[customer] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }
    if (!status) {
      toast({ title: "Please select a FollowUp Status", variant: "destructive" });
      return;
    }
    toast({ title: "Follow-up successfully added!", description: `Follow-up for ${selectedCustomer?.name} saved.` });
    navigate("/sales/payment-follow-up");
  };

  const handleCancel = () => {
    navigate("/sales/payment-follow-up");
  };

  return (
    <div
      className="space-y-6"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-200">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              Add Payment Follow Up
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Track and schedule customer payment reminders
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <nav className="text-xs text-muted-foreground flex items-center gap-1">
            <Link href="/dashboard" className="hover:text-blue-500 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/sales" className="hover:text-blue-500 transition-colors">
              Sales
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/sales/payment-follow-up" className="hover:text-blue-500 transition-colors">
              Payment Follow Up
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium">Add</span>
          </nav>
          <Link href="/sales/payment-follow-up/list">
            <Button className="bg-gradient-to-r from-[#1e40af] to-[#1d4ed8] hover:opacity-90 text-white gap-2 shadow-md shadow-cyan-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-sm">
              <ListPlus className="h-4 w-4" />
              + Payment Follow Up List
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Form Card ── */}
        <form
          onSubmit={handleSubmit}
          className="flex-[2] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(-16px)",
            transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
          }}
        >
          <div className="px-7 pt-5 pb-3 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-white">
            <h3 className="text-sm font-bold text-gray-600 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 inline-block" />
              Follow Up Details
            </h3>
          </div>

          <div className="p-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Customer — full width */}
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Customer <span className="text-rose-500">*</span>
                </Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus:ring-2 focus:ring-blue-300 transition-all duration-200 bg-white">
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ramesh">Ramesh Constructions Pvt Ltd</SelectItem>
                    <SelectItem value="kumar">Kumar Builders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FollowUp Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  FollowUp Date
                </Label>
                <Input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 transition-all duration-200"
                />
              </div>

              {/* FollowUp Time */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  FollowUp Time <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="time"
                  step={1}
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                  className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 transition-all duration-200"
                />
              </div>

              {/* FollowUp Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  FollowUp Status <span className="text-rose-500">*</span>
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus:ring-2 focus:ring-blue-300 transition-all duration-200">
                    <SelectValue placeholder="Choose Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next FollowUp Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Next FollowUp Date
                </Label>
                <Input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 transition-all duration-200"
                />
              </div>

              {/* Next FollowUp Time */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Next FollowUp Time <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="time"
                  step={1}
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 transition-all duration-200"
                />
              </div>

              {/* Description — full width */}
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  FollowUp Description
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about this follow-up..."
                  className="h-11 border-gray-200 rounded-lg hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 h-11 font-bold rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-10 h-11 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>

        {/* ── Customer Details Panel ── */}
        <div
          className="w-full lg:w-72 space-y-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(16px)",
            transition: "opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s",
          }}
        >
          <Label className="font-bold text-sm text-gray-700 px-1 block">
            Customer Details
          </Label>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Colour band */}
            <div className="h-2 bg-gradient-to-r from-[#1e40af] to-blue-500" />

            {selectedCustomer ? (
              <div className="p-5 space-y-4">
                {[
                  { icon: User, label: "Customer Name", value: selectedCustomer.name, color: "text-blue-500" },
                  { icon: Phone, label: "Phone Number", value: selectedCustomer.phone, color: "text-emerald-500" },
                  { icon: Mail, label: "Email", value: selectedCustomer.email, color: "text-orange-500" },
                  { icon: AlertCircle, label: "Pending Balance", value: selectedCustomer.balance, color: "text-rose-500", highlight: true },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3"
                    style={{
                      animation: `fadeIn 0.3s ease ${i * 0.06}s both`,
                    }}
                  >
                    <div className={`p-1.5 rounded-lg bg-gray-50 ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className={`text-sm font-bold mt-0.5 ${item.highlight ? "text-rose-600" : "text-gray-700"}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    Select a customer to view their details
                  </p>
                </div>
                {/* Skeleton rows */}
                <div className="border-t border-gray-50">
                  {["Customer Name", "Phone Number", "Email", "Pending Balance"].map((label, i) => (
                    <div key={label} className="grid grid-cols-5 border-b border-white last:border-0">
                      <div className="col-span-2 bg-gradient-to-r from-[#1e40af] to-[#1d4ed8] text-white p-3 text-xs font-semibold">
                        {label}:
                      </div>
                      <div className="col-span-3 bg-gray-50 p-3">
                        <div
                          className="h-3 rounded-full bg-gray-200 animate-pulse"
                          style={{ width: `${40 + i * 15}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick tip card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">💡 Quick Tip</p>
            <p className="text-xs text-blue-600/80 leading-relaxed">
              Set a "Next FollowUp Date" to automatically get reminded about pending payments.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
