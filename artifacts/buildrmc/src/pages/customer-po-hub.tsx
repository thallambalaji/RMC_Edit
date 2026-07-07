import { Link } from "wouter";
import { Users, ShoppingCart, CalendarClock, FileSignature } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CustomerList from "@/pages/customer-list";

export default function CustomerPOHub() {
  const linkClass = "text-[11px] font-bold text-slate-600 hover:text-[#ea580c] hover:bg-orange-50/40 border border-transparent hover:border-orange-100/50 py-2 px-3 rounded-lg transition-all cursor-pointer block";

  return (
    <div className="flex h-full gap-4 bg-transparent">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-60 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Customer & PO Nav</h3>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <Accordion type="multiple" className="w-full space-y-2">
            
            <AccordionItem value="customer" className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#ea580c]"/> Customer</div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/customer/new">
                    <span className={linkClass}>Add Customer</span>
                  </Link>
                  <Link href="/customer-po/customer/godowns">
                    <span className={linkClass}>Godowns</span>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sales-order" className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#ea580c]"/> Sales Order</div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/sales-order/new">
                    <span className={linkClass}>Add Sales Order</span>
                  </Link>
                  <Link href="/customer-po/sales-order/list">
                    <span className={linkClass}>Sales Order List</span>
                  </Link>
                  <Link href="/customer-po/sales-order/report">
                    <span className={linkClass}>Sales Order Report</span>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="scheduling" className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#ea580c]"/> Scheduling</div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/scheduling/new">
                    <span className={linkClass}>Add Scheduling</span>
                  </Link>
                  <Link href="/customer-po/scheduling/list">
                    <span className={linkClass}>Scheduling List</span>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quotation" className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-[#ea580c]"/> Quotation</div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/quotation/new">
                    <span className={linkClass}>Add Quotation</span>
                  </Link>
                  <Link href="/customer-po/quotation/list">
                    <span className={linkClass}>Quotation List</span>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 pr-1 overflow-auto pb-6">
        <CustomerList />
      </div>
    </div>
  );
}

