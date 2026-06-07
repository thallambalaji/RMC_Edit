import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreLayout } from "@/components/store-layout";
import { useToast } from "@/hooks/use-toast";
import { useGetMasters, useCreateMaster, useDeleteMaster } from "@workspace/api-client-react";
import { Plus, RefreshCcw, Search, Edit3, Trash2 } from "lucide-react";

interface StoreItemRecord {
  id: string;
  name: string;
  type: string;
  group: string;
  unit: string;
  hsnCode: string;
  openingStock: string;
  department: string;
  status: string;
}

const STORAGE_KEY = "rmc-store-items";

export default function StoreItems() {
  const { toast } = useToast();
  const [itemId, setItemId] = useState<string>("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Inventory");
  const [group, setGroup] = useState("Raw Materials");
  const [unit, setUnit] = useState("MT");
  const [hsnCode, setHsnCode] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [department, setDepartment] = useState("N/A");
  const [status, setStatus] = useState("active");
  const [items, setItems] = useState<StoreItemRecord[]>([]);
  const [searchText, setSearchText] = useState("");

  const { data: dbMasters } = useGetMasters("item");
  const createMaster = useCreateMaster();
  const deleteMaster = useDeleteMaster();

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(normalized) ||
      item.type.toLowerCase().includes(normalized) ||
      item.group.toLowerCase().includes(normalized)
    );
  }, [items, searchText]);

  const isEditing = useMemo(() => Boolean(itemId), [itemId]);

  const resetForm = () => {
    setItemId("");
    setName("");
    setType("Inventory");
    setGroup("Raw Materials");
    setUnit("MT");
    setHsnCode("");
    setOpeningStock("");
    setDepartment("N/A");
    setStatus("active");
  };

  const handleSave = async () => {
    if (!name.trim() || !type.trim() || !group.trim() || !unit.trim() || !openingStock.trim()) {
      toast({ title: "Missing required fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      if (isEditing) {
        const oldRecord = items.find(i => i.id === itemId);
        if (oldRecord && oldRecord.name !== name.trim()) {
          const oldMaster = dbMasters?.find(m => m.name === oldRecord.name);
          if (oldMaster) {
            await deleteMaster.mutateAsync(oldMaster.id);
          }
          await createMaster.mutateAsync({ type: "item", name: name.trim() });
        }
      } else {
        const exists = dbMasters?.some(m => m.name === name.trim());
        if (!exists) {
          await createMaster.mutateAsync({ type: "item", name: name.trim() });
        }
      }

      const record: StoreItemRecord = {
        id: itemId || String(Date.now()),
        name: name.trim(),
        type,
        group,
        unit,
        hsnCode: hsnCode.trim(),
        openingStock: openingStock.trim(),
        department,
        status,
      };

      setItems((prev) => {
        const existing = prev.find((item) => item.id === record.id);
        if (existing) {
          return prev.map((item) => (item.id === record.id ? record : item));
        }
        return [record, ...prev];
      });

      toast({ title: `Store item ${isEditing ? "updated" : "saved"}`, description: `${record.name} has been ${isEditing ? "updated" : "added"}.` });
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: "Error saving item", description: "Failed to save item to database.", variant: "destructive" });
    }
  };

  const handleEdit = (item: StoreItemRecord) => {
    setItemId(item.id);
    setName(item.name);
    setType(item.type);
    setGroup(item.group);
    setUnit(item.unit);
    setHsnCode(item.hsnCode);
    setOpeningStock(item.openingStock);
    setDepartment(item.department);
    setStatus(item.status);
  };

  const handleDelete = async (id: string) => {
    const record = items.find(i => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Store item deleted", description: "The store item has been removed." });
    if (itemId === id) resetForm();

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

  return (
    <StoreLayout title="Store Items" breadcrumbs={[{ label: "Store Item" }]} showFilterButton={false}> 
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Add Store Item</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Item Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter item name" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Item Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Item Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Asset">Asset</SelectItem>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Item Group *</Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Item Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                    <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Of Measurement *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="NOS">NOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">HSN CODE</Label>
                <Input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="Enter HSN code" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Opening Stock *</Label>
                <Input value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} placeholder="Enter opening stock" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Procurement">Procurement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleSave} className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white">
              <Plus className="h-4 w-4 mr-2" /> {isEditing ? "Update Store Item" : "Save Store Item"}
            </Button>
            <Button variant="secondary" onClick={resetForm} className="border-slate-300 text-slate-700 hover:bg-slate-100">
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Store Items</h3>
              <p className="text-sm text-slate-500">Manage items available in the store.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Show</span>
                <Select value="10" onValueChange={() => {}}>
                  <SelectTrigger className="min-w-[4rem]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600">entries</span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search" className="min-w-[180px] bg-transparent border-0 px-0 py-0 text-sm" />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Opening Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Item Group</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-900 uppercase tracking-tight text-xs">{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.openingStock}</TableCell>
                    <TableCell className={item.status === "active" ? "text-emerald-600" : "text-slate-500"}>{item.status}</TableCell>
                    <TableCell>{item.group}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => handleEdit(item)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-800" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">
                    No store items added yet.
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
