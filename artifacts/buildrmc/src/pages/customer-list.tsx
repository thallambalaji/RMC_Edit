import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetCustomers, useDeleteCustomer } from "@workspace/api-client-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, Plus, Loader2, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");

  const { data: customers, isLoading } = useGetCustomers();
  const { mutate: deleteCustomer } = useDeleteCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      },
      onError: (error: any) => {
        toast({ title: "Failed to delete customer", description: error.data?.error, variant: "destructive" });
      }
    }
  });

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => {
      const name = c.name || "";
      const contact = c.contact || "";
      const matchesName = name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesPhone = contact.includes(phoneFilter);
      return matchesName && matchesPhone;
    });
  }, [customers, nameFilter, phoneFilter]);

  const handleClear = () => {
    setNameFilter("");
    setPhoneFilter("");
    setStatusFilter("Active");
  };

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer List</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Customer List</span>
        </nav>
      </div>

      <div className="flex justify-start mb-4">
        <Link href="/customer-po/customer/new" className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 shadow-sm transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          + Add Customer
        </Link>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
          <div className="space-y-2 col-span-1 md:col-span-1">
            <Label className="text-sm font-semibold">Customer Name :</Label>
            <Input 
              placeholder="Type name here..." 
              className="bg-white h-10 border-gray-300"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-1">
            <Label className="text-sm font-semibold">Customer Phone :</Label>
            <Input 
              placeholder="Type phone no here..." 
              className="bg-white h-10 border-gray-300"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Status :</Label>
            <div className="flex items-center gap-4 h-10">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  checked={statusFilter === "Active"} 
                  onChange={() => setStatusFilter("Active")}
                  className="h-4 w-4 text-cyan-600" 
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  checked={statusFilter === "Deactivated"}
                  onChange={() => setStatusFilter("Deactivated")}
                  className="h-4 w-4 text-cyan-600" 
                />
                <span className="text-sm">Deactivated</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Alphabetic Wise :</Label>
            <Select defaultValue="all">
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Customer</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Date Sorting :</Label>
            <Select defaultValue="na">
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="na">N/A</SelectItem></SelectContent>
            </Select>
          </div>
          <Button 
            className="bg-rose-500 hover:bg-rose-600 text-white h-10 font-bold"
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-20 h-9 bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4">Copy</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4">CSV</Button>
            <Button variant="outline" size="sm" className="bg-gray-400 text-white hover:bg-gray-500 border-0 h-8 px-4">PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#3DB9C1]" />
              <p className="text-sm text-gray-500 font-medium">Loading customers...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-white border-b border-gray-200">
                  <TableHead className="text-gray-900 font-bold py-4 px-4 text-center">Customer Name</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">Address</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">Phone</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">GSTIN No</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">PAN No</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">Plant</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">Sales Person</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">Reg Date</TableHead>
                  <TableHead className="text-gray-900 font-bold px-4 text-center">Option</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-gray-400">No customers found</TableCell>
                   </TableRow>
                ) : filteredCustomers.map((customer, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50">
                    <TableCell className="text-center text-[10px] text-blue-600 font-bold border-r border-gray-100">{customer.name}</TableCell>
                    <TableCell className="text-center text-[10px] max-w-[200px] border-r border-gray-100">{customer.address}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100">{customer.contact}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100">{customer.gstNumber || "--"}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100">--</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100">All Plant</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100">--</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100">
                      {customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy") : "--"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/customer-po/customer/edit/${customer.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing {filteredCustomers.length > 0 ? 1 : 0} to {filteredCustomers.length} of {filteredCustomers.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-gray-400 h-8">Previous</Button>
            <div className="h-8 w-8 flex items-center justify-center rounded text-xs cursor-pointer bg-cyan-500 text-white">1</div>
            <Button variant="outline" size="sm" className="text-gray-600 h-8">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
