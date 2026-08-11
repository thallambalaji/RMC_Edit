import { Link, useLocation } from "wouter";
import { ClipboardList, Wallet, Settings } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PaymentFollowUpList from "@/pages/payment-follow-up-list";

export default function PaymentFollowUpHub() {
  const [location] = useLocation();

  const linkClass = (href: string) =>
    `text-xs font-medium py-2 px-3 rounded-md transition-all cursor-pointer block border ${
      location === href || (href === "/sales/payment-follow-up" && location.startsWith("/sales/payment-follow-up"))
        ? "bg-[#ea580c] text-white border-[#ea580c] shadow font-bold"
        : "text-gray-600 hover:text-[#ea580c] hover:bg-white border-transparent hover:border-gray-200 shadow-sm hover:shadow"
    }`;

  return (
    <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-white">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm">Sales Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Accordion type="multiple" defaultValue={["payment-followup"]} className="w-full space-y-2">
            
            <AccordionItem value="sales-enquiry" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#ea580c]"/> Sales Enquiry</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/sales/enquiry/new"><div className={linkClass("/sales/enquiry/new")}>Add Enquiry</div></Link>
                  <Link href="/sales/enquiry"><div className={linkClass("/sales/enquiry")}>Enquiry List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-followup" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-amber-500"/> Payment Follow Up</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/sales/payment-follow-up/new"><div className={linkClass("/sales/payment-follow-up/new")}>Add Payment Follow Up</div></Link>
                  <Link href="/sales/payment-follow-up"><div className={linkClass("/sales/payment-follow-up")}>Payment Follow Up List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sales-settings" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-gray-600"/> Sales Settings</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/sales/settings/master"><div className={linkClass("/sales/settings/master")}>Sales Master</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-3 min-w-0">
        <PaymentFollowUpList />
      </div>
    </div>
  );
}
