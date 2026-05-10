import { useState } from "react";
import { Link } from "wouter";
import { useGetProducts, useCreateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Plus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Godowns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [stockUnit, setStockUnit] = useState("");

  const { data: products, isLoading } = useGetProducts();
  const { mutate: createProduct, isPending } = useCreateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Item added successfully" });
        setIsModalOpen(false);
        setItemName("");
        setStockUnit("");
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      },
      onError: (error: any) => {
        toast({ title: "Failed to add item", description: error.data?.error, variant: "destructive" });
      }
    }
  });

  const { mutate: deleteProduct } = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Item deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      },
      onError: (error: any) => {
        toast({ title: "Failed to delete item", description: error.data?.error, variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !stockUnit) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createProduct({ data: { 
      name: itemName, 
      unit: stockUnit, 
      category: "Godown Item", 
      unitPrice: 0,
      stockQty: 0, 
      minStockLevel: 0 
    } });
  };

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteProduct({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Godowns</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po/customer" className="hover:text-primary transition-colors">Customer</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Godowns</span>
        </nav>
      </div>

      <div className="flex justify-center mb-8">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white gap-2 px-8 h-10 font-bold uppercase tracking-wider shadow-md"
        >
          <Plus className="h-4 w-4" />
          New Items
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#3DB9C1]" />
            <p className="text-sm text-gray-500 font-medium">Loading Items...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#3DB9C1] hover:bg-[#3DB9C1]">
                <TableHead className="text-white font-bold py-4 text-center border-r border-white/20 w-24">S/L No</TableHead>
                <TableHead className="text-white font-bold text-center border-r border-white/20">Godown / Item Name</TableHead>
                <TableHead className="text-white font-bold text-center w-32 border-r border-white/20">Unit</TableHead>
                <TableHead className="text-white font-bold text-center w-24">Option</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-gray-400 italic">
                    No items found. Click "New Items" to add your first item.
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product, idx) => (
                  <TableRow key={product.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-center font-medium border-r border-gray-100">{idx + 1}</TableCell>
                    <TableCell className="text-center font-semibold text-gray-700 border-r border-gray-100">{product.name}</TableCell>
                    <TableCell className="text-center text-sm text-gray-500 border-r border-gray-100">{product.unit}</TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#3DB9C1] py-6 text-center">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Add New Item</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                Item Name <span className="text-rose-500 text-lg">*</span>
              </Label>
              <Input 
                placeholder="Enter Item Name" 
                className="h-12 border-gray-200 focus:border-[#3DB9C1] focus:ring-[#3DB9C1]/20 text-lg"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                Stock Unit <span className="text-rose-500 text-lg">*</span>
              </Label>
              <Select value={stockUnit} onValueChange={setStockUnit}>
                <SelectTrigger className="h-12 border-gray-200 focus:border-[#3DB9C1] focus:ring-[#3DB9C1]/20 text-lg">
                  <SelectValue placeholder="Choose Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="LITRES">LITRES</SelectItem>
                  <SelectItem value="M3">M3</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="NOS">NOS</SelectItem>
                  <SelectItem value="TONNS">TONNS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white px-12 h-12 text-lg font-bold uppercase tracking-widest shadow-lg shadow-[#3DB9C1]/30 transition-all active:scale-95"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Save Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
