import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CustomerPOHub from "@/pages/customer-po-hub";
import CustomerSubHub from "@/pages/customer-sub-hub";
import AddCustomer from "@/pages/add-customer";
import CustomerList from "@/pages/customer-list";
import Godowns from "@/pages/godowns";
import SalesOrderSubHub from "@/pages/sales-order-sub-hub";
import AddSalesOrder from "@/pages/add-sales-order";
import SalesOrderList from "@/pages/sales-order-list";
import SalesOrderReport from "@/pages/sales-order-report";
import SchedulingSubHub from "@/pages/scheduling-sub-hub";
import AddScheduling from "@/pages/add-scheduling";
import SchedulingList from "@/pages/scheduling-list";
import QuotationSubHub from "@/pages/quotation-sub-hub";
import AddQuotation from "@/pages/add-quotation";
import QuotationList from "@/pages/quotation-list";
import SalesEnquiryHub from "@/pages/sales-enquiry-hub";
import AddEnquiry from "@/pages/add-enquiry";
import EnquiryList from "@/pages/enquiry-list";
import SalesHub from "@/pages/sales-hub";
import PaymentFollowUpHub from "@/pages/payment-follow-up-hub";
import AddPaymentFollowUp from "@/pages/add-payment-follow-up";
import PaymentFollowUpList from "@/pages/payment-follow-up-list";
import SalesSettingsHub from "@/pages/sales-settings-hub";
import SalesMaster from "@/pages/sales-master";
import Billing from "@/pages/billing";
import AddInvoice from "@/pages/add-invoice";
import DeliveryChallans from "@/pages/dc";
import Sales from "@/pages/sales";
import QC from "@/pages/qc";
import Accounts from "@/pages/accounts";
import Store from "@/pages/store";
import Transport from "@/pages/transport";
import HRM from "@/pages/hrm";
import Reports from "@/pages/reports";
import SalesDocumentList from "@/pages/sales-document-list";
import SalesDocumentReport from "@/pages/sales-document-report";
import ConsolidateSalesDocumentList from "@/pages/consolidate-sales-document-list";
import InvoiceReport from "@/pages/invoice-report";
import ConsolidateInvoiceList from "@/pages/consolidate-invoice-list";
import GenerateAnnexure from "@/pages/generate-annexure";
import DebitCreditNoteList from "@/pages/debit-credit-note-list";
import RMCReportHub from "@/pages/rmc-report";
import SalesInvoiceHub from "@/pages/sales-invoice-hub";
import DCHub from "@/pages/dc-hub";
import AddDC from "@/pages/add-dc";
import AddSalesDocument from "@/pages/add-sales-document";
import DCList from "@/pages/dc-list";
import DCSubHub from "@/pages/dc-sub-hub";
import DCReport from "@/pages/dc-report";
import WeighmentHub from "@/pages/weighment-hub";
import Tickets from "@/pages/tickets";
import AddWeighment from "@/pages/add-weighment";
import WeighmentList from "@/pages/weighment-list";
import WeighmentReport from "@/pages/weighment-report";
import AddMixDesign from "@/pages/add-mix-design";
import MixDesignList from "@/pages/mix-design-list";
import AddRecipe from "@/pages/add-recipe";
import RecipeList from "@/pages/recipe-list";
import AddCubeTest from "@/pages/add-cube-test";
import CubeTestList from "@/pages/cube-test-list";
import BatchList from "@/pages/batch-list";
import BatchReport from "@/pages/batch-report";
import QcSettings from "@/pages/qc-settings";
import VehicleList from "@/pages/vehicle-list";
import AddVehicle from "@/pages/add-vehicle";
import AddDriver from "@/pages/add-driver";
import DriverList from "@/pages/driver-list";
import AddPumpDg from "@/pages/add-pump-dg";
import PumpDgList from "@/pages/pump-dg-list";
import AddDiesel from "@/pages/add-diesel";
import DieselList from "@/pages/diesel-list";
import DieselReport from "@/pages/diesel-report";
import TransportSettings from "@/pages/transport-settings";
import AddSecurityCheck from "@/pages/add-security";
import SecurityCheckList from "@/pages/security-list";
import SecurityCheckReport from "@/pages/security-report";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isError || !user) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/">{user ? <Redirect to="/dashboard" /> : <Login />}</Route>
      <Route path="/login">{user ? <Redirect to="/dashboard" /> : <Login />}</Route>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/customer-po/customer/new"><ProtectedRoute component={AddCustomer} /></Route>
      <Route path="/customer-po/customer/list"><ProtectedRoute component={() => <Redirect to="/customer-po/customer" />} /></Route>
      <Route path="/customer-po/customer/godowns"><ProtectedRoute component={Godowns} /></Route>
      <Route path="/customer-po/customer"><ProtectedRoute component={CustomerSubHub} /></Route>
      <Route path="/customer-po/sales-order/new"><ProtectedRoute component={AddSalesOrder} /></Route>
      <Route path="/customer-po/sales-order/list"><ProtectedRoute component={() => <Redirect to="/customer-po/sales-order" />} /></Route>
      <Route path="/customer-po/sales-order/report"><ProtectedRoute component={SalesOrderReport} /></Route>
      <Route path="/customer-po/sales-order"><ProtectedRoute component={SalesOrderSubHub} /></Route>
      <Route path="/customer-po/scheduling/new"><ProtectedRoute component={AddScheduling} /></Route>
      <Route path="/customer-po/scheduling/list"><ProtectedRoute component={() => <Redirect to="/customer-po/scheduling" />} /></Route>
      <Route path="/customer-po/scheduling"><ProtectedRoute component={SchedulingSubHub} /></Route>
      <Route path="/customer-po/quotation/new"><ProtectedRoute component={AddQuotation} /></Route>
      <Route path="/customer-po/quotation/list"><ProtectedRoute component={() => <Redirect to="/customer-po/quotation" />} /></Route>
      <Route path="/customer-po/quotation"><ProtectedRoute component={QuotationSubHub} /></Route>
      <Route path="/customer-po"><ProtectedRoute component={CustomerPOHub} /></Route>
      <Route path="/billing/new"><ProtectedRoute component={AddInvoice} /></Route>
      <Route path="/billing/sales-document/new"><ProtectedRoute component={AddSalesDocument} /></Route>
      <Route path="/billing/sales-document"><ProtectedRoute component={SalesDocumentList} /></Route>
      <Route path="/billing/sales-document-report"><ProtectedRoute component={SalesDocumentReport} /></Route>
      <Route path="/billing/consolidate-sales-document-list"><ProtectedRoute component={ConsolidateSalesDocumentList} /></Route>
      <Route path="/billing/invoice-report"><ProtectedRoute component={InvoiceReport} /></Route>
      <Route path="/billing/consolidate-invoice-list"><ProtectedRoute component={ConsolidateInvoiceList} /></Route>
      <Route path="/billing/generate-annexure"><ProtectedRoute component={GenerateAnnexure} /></Route>
      <Route path="/billing/debit-credit-note-list"><ProtectedRoute component={DebitCreditNoteList} /></Route>
      <Route path="/billing/rmc-report"><ProtectedRoute component={RMCReportHub} /></Route>
      <Route path="/billing/sales-invoice"><ProtectedRoute component={SalesInvoiceHub} /></Route>
      <Route path="/billing"><ProtectedRoute component={Billing} /></Route>
      <Route path="/dc/delivery-challan"><ProtectedRoute component={DCSubHub} /></Route>
      <Route path="/dc/report"><ProtectedRoute component={DCReport} /></Route>
      <Route path="/dc/weighment/tickets"><ProtectedRoute component={Tickets} /></Route>
      <Route path="/dc/weighment/new"><ProtectedRoute component={AddWeighment} /></Route>
      <Route path="/dc/weighment/list"><ProtectedRoute component={WeighmentList} /></Route>
      <Route path="/dc/weighment/report"><ProtectedRoute component={WeighmentReport} /></Route>
      <Route path="/dc/weighment"><ProtectedRoute component={WeighmentHub} /></Route>
      <Route path="/dc/new"><ProtectedRoute component={AddDC} /></Route>
      <Route path="/dc/list"><ProtectedRoute component={DCList} /></Route>
      <Route path="/dc"><ProtectedRoute component={DCHub} /></Route>
      <Route path="/sales/enquiry/new"><ProtectedRoute component={AddEnquiry} /></Route>
      <Route path="/sales/enquiry/list"><ProtectedRoute component={EnquiryList} /></Route>
      <Route path="/sales/enquiry"><ProtectedRoute component={SalesEnquiryHub} /></Route>
      <Route path="/sales/payment-follow-up/new"><ProtectedRoute component={AddPaymentFollowUp} /></Route>
      <Route path="/sales/payment-follow-up/list"><ProtectedRoute component={PaymentFollowUpList} /></Route>
      <Route path="/sales/payment-follow-up"><ProtectedRoute component={PaymentFollowUpHub} /></Route>
      <Route path="/sales/settings/master"><ProtectedRoute component={SalesMaster} /></Route>
      <Route path="/sales/settings"><ProtectedRoute component={SalesSettingsHub} /></Route>
      <Route path="/sales"><ProtectedRoute component={Sales} /></Route>
      <Route path="/qc/mix-design/new"><ProtectedRoute component={AddMixDesign} /></Route>
      <Route path="/qc/mix-design/list"><ProtectedRoute component={MixDesignList} /></Route>
      <Route path="/qc/recipe/new"><ProtectedRoute component={AddRecipe} /></Route>
      <Route path="/qc/recipe/list"><ProtectedRoute component={RecipeList} /></Route>
      <Route path="/qc/cube-test/new"><ProtectedRoute component={AddCubeTest} /></Route>
      <Route path="/qc/cube-test/list"><ProtectedRoute component={CubeTestList} /></Route>
      <Route path="/qc/cube-test/report"><ProtectedRoute component={() => <div className="p-8 bg-white rounded-lg border shadow-sm"><h2 className="text-xl font-bold mb-4 text-[#1e40af]">Cube Test Report</h2><p className="text-gray-500 text-sm">Statistical analysis of concrete compressive strength across all grades.</p></div>} /></Route>
      <Route path="/qc/batch/list"><ProtectedRoute component={BatchList} /></Route>
      <Route path="/qc/batch/report"><ProtectedRoute component={BatchReport} /></Route>
      <Route path="/qc/settings"><ProtectedRoute component={QcSettings} /></Route>
      <Route path="/qc"><ProtectedRoute component={QC} /></Route>
      <Route path="/accounts"><ProtectedRoute component={Accounts} /></Route>
      <Route path="/store"><ProtectedRoute component={Store} /></Route>
      <Route path="/transport/vehicle/new"><ProtectedRoute component={AddVehicle} /></Route>
      <Route path="/transport/vehicle/edit/:id"><ProtectedRoute component={AddVehicle} /></Route>
      <Route path="/transport/vehicle/list"><ProtectedRoute component={VehicleList} /></Route>
      <Route path="/transport/driver/new"><ProtectedRoute component={AddDriver} /></Route>
      <Route path="/transport/driver/list"><ProtectedRoute component={DriverList} /></Route>
      <Route path="/transport/pump-dg/new"><ProtectedRoute component={AddPumpDg} /></Route>
      <Route path="/transport/pump-dg/list"><ProtectedRoute component={PumpDgList} /></Route>
      <Route path="/transport/diesel/new"><ProtectedRoute component={AddDiesel} /></Route>
      <Route path="/transport/diesel/list"><ProtectedRoute component={DieselList} /></Route>
      <Route path="/transport/diesel/report"><ProtectedRoute component={DieselReport} /></Route>
      <Route path="/transport/settings"><ProtectedRoute component={TransportSettings} /></Route>
      <Route path="/transport/security/new"><ProtectedRoute component={AddSecurityCheck} /></Route>
      <Route path="/transport/security/list"><ProtectedRoute component={SecurityCheckList} /></Route>
      <Route path="/transport/security/report"><ProtectedRoute component={SecurityCheckReport} /></Route>
      <Route path="/transport"><ProtectedRoute component={() => <Redirect to="/transport/vehicle/list" />} /></Route>
      <Route path="/hrm"><ProtectedRoute component={HRM} /></Route>
      <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
