import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreLayout } from "@/components/store-layout";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useGetMasters, useCreateMaster, useDeleteMaster } from "@workspace/api-client-react";
import { Pencil, Trash2, Search } from "lucide-react";
import { sanitizePhone, isValidPhone } from "@/lib/utils";


interface SupplierRecord {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  address: string;
  businessGroup: string;
  openingBalance: string;
}

const STORAGE_KEY = "rmc-store-suppliers";

export default function StoreSuppliers() {
  const { toast } = useToast();
  const [supplierId, setSupplierId] = useState<string>("");
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [businessGroup, setBusinessGroup] = useState("All Business");
  const [openingBalance, setOpeningBalance] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { data: dbMasters } = useGetMasters("supplier");
  const createMaster = useCreateMaster();
  const deleteMaster = useDeleteMaster();

  const filteredSuppliers = useMemo(() => {
    const value = searchText.trim().toLowerCase();
    if (!value) return suppliers;
    return suppliers.filter((supplier) =>
      (supplier.name || "").toLowerCase().includes(value) ||
      (supplier.phone || "").toLowerCase().includes(value) ||
      (supplier.gstin || "").toLowerCase().includes(value)
    );
  }, [suppliers, searchText]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSuppliers(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  const isEditing = useMemo(() => Boolean(supplierId), [supplierId]);

  const resetForm = () => {
    setSupplierId("");
    setName("");
    setGstin("");
    setPan("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBusinessGroup("All Business");
    setOpeningBalance("");
  };

  const handleSave = async () => {
    if (!name.trim() || !gstin.trim() || !phone.trim() || !address.trim() || !businessGroup.trim()) {
      toast({ title: "Missing required fields", description: "Please fill in all required supplier fields.", variant: "destructive" });
      return;
    }

    if (!isValidPhone(phone, true)) {
      toast({ title: "Validation Error", description: "Supplier Phone must be exactly 10 digits.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        const oldRecord = suppliers.find(s => s.id === supplierId);
        if (oldRecord && oldRecord.name !== name.trim()) {
          const oldMaster = dbMasters?.find(m => m.name === oldRecord.name);
          if (oldMaster) {
            await deleteMaster.mutateAsync(oldMaster.id);
          }
          await createMaster.mutateAsync({ type: "supplier", name: name.trim() });
        }
      } else {
        const exists = dbMasters?.some(m => m.name === name.trim());
        if (!exists) {
          await createMaster.mutateAsync({ type: "supplier", name: name.trim() });
        }
      }

      const record: SupplierRecord = {
        id: supplierId || String(Date.now()),
        name: name.trim(),
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        businessGroup,
        openingBalance: openingBalance.trim(),
      };

      setSuppliers((prev) => {
        const existing = prev.find((item) => item.id === record.id);
        if (existing) {
          return prev.map((item) => (item.id === record.id ? record : item));
        }
        return [record, ...prev];
      });

      toast({ title: `Supplier ${isEditing ? "updated" : "saved"}`, description: `${record.name} has been ${isEditing ? "updated" : "added"}.` });
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: "Error saving supplier", description: "Failed to save supplier to database.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (supplier: SupplierRecord) => {
    setSupplierId(supplier.id);
    setName(supplier.name);
    setGstin(supplier.gstin);
    setPan(supplier.pan);
    setPhone(supplier.phone);
    setEmail(supplier.email);
    setAddress(supplier.address);
    setBusinessGroup(supplier.businessGroup);
    setOpeningBalance(supplier.openingBalance);
  };

  const handleDelete = async (id: string) => {
    const record = suppliers.find(s => s.id === id);
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
    toast({ title: "Supplier deleted", description: "The supplier record has been removed." });
    if (supplierId === id) resetForm();

    if (record) {
      const oldMaster = dbMasters?.find(m => m.name === record.name);
      if (oldMaster) {
        try {
          await deleteMaster.mutateAsync(oldMaster.id);
        } catch (error) {
          console.error("Failed to delete master:", error);
        }
      }
    }
  };

  const handleValidateGstin = async () => {
    if (!gstin.trim()) {
      toast({ title: "GSTIN required", description: "Enter a GSTIN to validate.", variant: "destructive" });
      return;
    }
    setIsValidating(true);
    try {
      await customFetch(`/api/verify-gstin/${gstin.trim()}`);
      toast({ title: "GSTIN validated", description: "The GSTIN format is valid." });
    } catch (error: any) {
      toast({ title: "GSTIN validation failed", description: error?.message || "Could not validate GSTIN.", variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <StoreLayout title="Store Supplier" breadcrumbs={[{ label: "Add Supplier" }]} showFilterButton={false}>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add / Update Supplier's Detail's</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Supplier Name" />
            </div>
            <div className="grid gap-3 md:grid-cols-[2.5fr_1fr]">
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Customer GSTIN *</Label>
                <div className="flex items-end gap-2">
                  <Input className="min-w-0 flex-1" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="Enter GSTIN" />
                  <Button onClick={handleValidateGstin} disabled={isValidating} className="shrink-0 px-3 py-2 text-[10px] md:px-4">{isValidating ? "Validating" : "Validate"}</Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier PAN</Label>
                <Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="Enter PAN NO" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier Phone *</Label>
                <Input value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} placeholder="Enter 10-digit phone number" maxLength={10} />
              </div>
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier Address *</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter supplier's Address" className="min-h-[90px]" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Business Group *</Label>
                <Select value={businessGroup} onValueChange={setBusinessGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Business Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Business">All Business</SelectItem>
                    <SelectItem value="Ready Mix Concrete">Ready Mix Concrete</SelectItem>
                    <SelectItem value="Building Materials">Building Materials</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Opening Balance *</Label>
                <Input value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Enter Opening Balance" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : isEditing ? "Update Supplier" : "Save Supplier"}</Button>
            <Button variant="secondary" onClick={resetForm}>Reset</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-slate-900">Supplier List</h3>
              <span className="text-sm text-slate-500">{filteredSuppliers.length} suppliers</span>
            </div>
            <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 max-w-[200px]">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="h-6 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Business Group</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length ? filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.address || "-"}</TableCell>
                  <TableCell>{supplier.gstin || "-"}</TableCell>
                  <TableCell>{supplier.businessGroup}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(supplier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(supplier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-500">
                    No suppliers found. Add supplier details using the form.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </StoreLayout>
  );
}
