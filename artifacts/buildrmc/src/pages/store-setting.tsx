import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StoreLayout } from "@/components/store-layout";
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface StoreSettingEntry {
  id: string;
  product: string;
  unit: string;
  openingStock: string;
  plant: string;
}

const STORAGE_KEY = "rmc-store-setting-entries";

export default function StoreSetting() {
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [product, setProduct] = useState("10MM");
  const [unit, setUnit] = useState("KG");
  const [openingStock, setOpeningStock] = useState("");
  const [entries, setEntries] = useState<StoreSettingEntry[]>([]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return entries;
    return entries.filter((entry) =>
      entry.product.toLowerCase().includes(value) ||
      entry.plant.toLowerCase().includes(value)
    );
  }, [entries, search]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / Number(perPage)));
  const pageEntries = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * Number(perPage);
    return filteredEntries.slice(start, start + Number(perPage));
  }, [filteredEntries, currentPage, perPage, totalPages]);

  const clearForm = () => {
    setPlant("FORTUNE CONCRETE");
    setProduct("10MM");
    setUnit("KG");
    setOpeningStock("");
  };

  const addEntry = () => {
    if (!openingStock.trim()) return;
    const record: StoreSettingEntry = {
      id: String(Date.now()),
      product,
      unit,
      openingStock: openingStock.trim(),
      plant,
    };

    setEntries((prev) => [record, ...prev]);
    clearForm();
  };

  const handlePrevious = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <StoreLayout title="Store Setting" breadcrumbs={[{ label: "Store Setting" }]}> 
      <div className="space-y-4">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">Add/Update Vehicle</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plant *</Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FORTUNE CONCRETE">FORTUNE CONCRETE</SelectItem>
                    <SelectItem value="MAIN YARD">MAIN YARD</SelectItem>
                    <SelectItem value="SECONDARY PLANT">SECONDARY PLANT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product/Store Item *</Label>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10MM">10MM</SelectItem>
                    <SelectItem value="DIESEL">DIESEL</SelectItem>
                    <SelectItem value="CEMENT">CEMENT</SelectItem>
                    <SelectItem value="SAND">SAND</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="NOS">NOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Opening Stock *</Label>
                <Input
                  value={openingStock}
                  onChange={(e) => setOpeningStock(e.target.value)}
                  placeholder="Enter opening stock"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="bg-cyan-600 text-white hover:bg-cyan-700 border-transparent"
                onClick={addEntry}
              >
                Add Opening Stock
              </Button>
              <Button variant="secondary" onClick={clearForm}>
                Clear
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-slate-500">Show</p>
                <div className="mt-2 flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                  <Select value={perPage} onValueChange={(value) => {
                    setPerPage(value);
                    setCurrentPage(1);
                  }}>
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
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    className="min-w-[180px] border-0 bg-transparent px-0 py-0 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S/L No</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Opening Stock</TableHead>
                    <TableHead>Plant</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageEntries.length > 0 ? (
                    pageEntries.map((entry, index) => (
                      <TableRow key={entry.id}>
                        <TableCell>{(currentPage - 1) * Number(perPage) + index + 1}</TableCell>
                        <TableCell>{entry.product}</TableCell>
                        <TableCell>{entry.openingStock}</TableCell>
                        <TableCell>{entry.plant}</TableCell>
                        <TableCell>
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-slate-500">
                        No records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Showing {pageEntries.length === 0 ? 0 : (currentPage - 1) * Number(perPage) + 1} to {Math.min(currentPage * Number(perPage), filteredEntries.length)} of {filteredEntries.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100" onClick={handlePrevious} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                  {currentPage}
                </span>
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100" onClick={handleNext} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
