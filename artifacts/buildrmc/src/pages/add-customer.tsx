import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateCustomer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ListPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddCustomer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAdvance, setShowAdvance] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    contact: "",
    email: "",
    address: "",
    gstNumber: "",
    creditTerms: "30 Days",
    state: "JAMMU AND KASHMIR",
    pinCode: "",
    location: "",
    panNo: "",
    marketingPerson: "fortune",
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    businessGroup: "READY MIX CONCRETE",
    contactPersonName: "",
    contactPersonPhone: "",
    sourceType: "",
    designation: "",
    plant: "All Plant",
    siteName: "",
    siteAddress: "",
    sitePinCode: ""
  });

  const { mutate: createCustomer, isPending } = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer added successfully!", description: `${formData.name} has been saved.` });
        navigate("/customer-po/customer/list");
      },
      onError: (error: any) => {
        toast({ 
          title: "Failed to add customer", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.address) {
      toast({ title: "Name, contact, and address are required", variant: "destructive" });
      return;
    }
    
    // @ts-ignore - types might be out of sync
    createCustomer({ data: {
      ...formData,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      creditDays: formData.creditDays ? parseInt(formData.creditDays) : undefined,
      openingBalance: formData.openingBalance ? parseFloat(formData.openingBalance) : undefined,
    }});
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => navigate("/customer-po/customer/list");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add Customer</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Add Customer</span>
        </nav>
      </div>

      <div className="flex justify-start mb-4">
        <Link href="/customer-po/customer/list" className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 shadow-sm transition-colors">
          <ListPlus className="h-4 w-4 mr-2" />
          + Customer List
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer GSTIN</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter GSTIN" 
                className="bg-white h-10 border-gray-300"
                value={formData.gstNumber}
                onChange={(e) => handleChange("gstNumber", e.target.value)}
              />
              <Button type="button" className="bg-cyan-500 hover:bg-cyan-600 text-white whitespace-nowrap px-4 h-10">Validate</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer Name <span className="text-rose-500">*</span></Label>
            <Input 
              value={formData.name} 
              onChange={(e) => handleChange("name", e.target.value)} 
              placeholder="Enter Customer Name" 
              className="bg-white h-10 border-gray-300" 
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Legal Name</Label>
            <Input 
              placeholder="Enter Legal Name" 
              className="bg-white h-10 border-gray-300"
              value={formData.legalName}
              onChange={(e) => handleChange("legalName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer Phone <span className="text-rose-500">*</span></Label>
            <Input 
              value={formData.contact} 
              onChange={(e) => handleChange("contact", e.target.value)} 
              placeholder="Enter Customer Phone" 
              className="bg-white h-10 border-gray-300" 
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer Email :</Label>
            <Input 
              placeholder="Ex: example@example.com" 
              className="bg-white h-10 border-gray-300"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer Address <span className="text-rose-500">*</span></Label>
            <Textarea 
              placeholder="Enter Customer Address" 
              className="bg-white min-h-[40px] border-gray-300" 
              required
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Location</Label>
            <Input 
              placeholder="Ex: Bangalore" 
              className="bg-white h-10 border-gray-300"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">PIN Code</Label>
            <Input 
              placeholder="Enter PIN" 
              className="bg-white h-10 border-gray-300"
              value={formData.pinCode}
              onChange={(e) => handleChange("pinCode", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">State</Label>
            <Select value={formData.state} onValueChange={(v) => handleChange("state", v)}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="JAMMU AND KASHMIR">JAMMU AND KASHMIR</SelectItem>
                <SelectItem value="KARNATAKA">KARNATAKA</SelectItem>
                <SelectItem value="MAHARASHTRA">MAHARASHTRA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">PAN No</Label>
            <Input 
              placeholder="Enter PAN" 
              className="bg-white h-10 border-gray-300"
              value={formData.panNo}
              onChange={(e) => handleChange("panNo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Marketing Person</Label>
            <Select value={formData.marketingPerson} onValueChange={(v) => handleChange("marketingPerson", v)}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fortune">FORTUNE CONCRETE</SelectItem>
                <SelectItem value="p2">Marketing Person 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Credit Limit</Label>
            <Input 
              type="number"
              placeholder="0.00" 
              className="bg-white h-10 border-gray-300"
              value={formData.creditLimit}
              onChange={(e) => handleChange("creditLimit", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Credit Days</Label>
            <Input 
              type="number"
              placeholder="0" 
              className="bg-white h-10 border-gray-300"
              value={formData.creditDays}
              onChange={(e) => handleChange("creditDays", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Opening Balance</Label>
            <Input 
              type="number"
              placeholder="0.00" 
              className="bg-white h-10 border-gray-300"
              value={formData.openingBalance}
              onChange={(e) => handleChange("openingBalance", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Business Group</Label>
            <Select value={formData.businessGroup} onValueChange={(v) => handleChange("businessGroup", v)}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="READY MIX CONCRETE">READY MIX CONCRETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Contact Person</Label>
            <Input 
              placeholder="Name" 
              className="bg-white h-10 border-gray-300"
              value={formData.contactPersonName}
              onChange={(e) => handleChange("contactPersonName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Plant</Label>
            <Select value={formData.plant} onValueChange={(v) => handleChange("plant", v)}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Plant">All Plant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Credit Terms</Label>
            <Select value={formData.creditTerms} onValueChange={(v) => handleChange("creditTerms", v)}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Immediate">Immediate</SelectItem>
                <SelectItem value="30 Days">30 Days</SelectItem>
                <SelectItem value="45 Days">45 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mb-4 bg-gray-50 border-gray-200"
            onClick={() => setShowAdvance(!showAdvance)}
          >
            {showAdvance ? "Hide Advance Option -" : "Show Advance Option +"}
          </Button>
          
          {showAdvance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Site Name</Label>
                <Input 
                  placeholder="Enter Site Name" 
                  className="bg-white h-10 border-gray-300"
                  value={formData.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Site Address</Label>
                <Input 
                  placeholder="Enter Site Address" 
                  className="bg-white h-10 border-gray-300"
                  value={formData.siteAddress}
                  onChange={(e) => handleChange("siteAddress", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Site PIN</Label>
                <Input 
                  placeholder="PIN" 
                  className="bg-white h-10 border-gray-300"
                  value={formData.sitePinCode}
                  onChange={(e) => handleChange("sitePinCode", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-10 justify-center">
          <Button 
            type="submit" 
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-10 h-10 font-bold min-w-[150px]"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>
          <Button 
            type="button" 
            onClick={handleCancel} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-10 h-10"
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
      </form>
    </div>
  );
}
