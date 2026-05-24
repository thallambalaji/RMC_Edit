import { Link, useLocation } from "wouter";
import { Users, ShoppingCart, CalendarClock, FileSignature, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CustomerList from "@/pages/customer-list";

export default function CustomerSubHub() {
  const [location] = useLocation();

  return (
    <div className="flex h-full gap-4 bg-[#f8fafc]">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm">Customer & PO Nav</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Accordion type="multiple" defaultValue={["customer"]} className="w-full space-y-2">
            
            <AccordionItem value="customer" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#1e40af]"/> Customer</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/customer/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Customer</div></Link>
                  <Link href="/customer-po/customer"><div className={`text-xs font-medium py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm ${location === '/customer-po/customer' ? 'bg-[#1e40af] text-white' : 'text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 hover:shadow'}`}>Customer List</div></Link>
                  <Link href="/customer-po/customer/godowns"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Godowns</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sales-order" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-cyan-600"/> Sales Order</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/sales-order/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Sales Order</div></Link>
                  <Link href="/customer-po/sales-order/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Sales Order List</div></Link>
                  <Link href="/customer-po/sales-order/report"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Sales Order Report</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="scheduling" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-purple-500"/> Scheduling</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/scheduling/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Scheduling</div></Link>
                  <Link href="/customer-po/scheduling/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Scheduling List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quotation" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-orange-500"/> Quotation</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/customer-po/quotation/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Quotation</div></Link>
                  <Link href="/customer-po/quotation/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Quotation List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 pr-2 overflow-auto pb-10">
        <CustomerList />
      </div>
    </div>
  );
}
