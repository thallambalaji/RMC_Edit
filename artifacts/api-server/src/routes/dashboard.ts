import { Router, type IRouter } from "express";
import { 
  connectMongo, Invoice, Customer, DeliveryChallan, SalesOrder, Product, 
  StoreInventory, Schedule, Quotation, PurchaseOrder, CubeEntry, Master, PaymentFollowUp 
} from "@workspace/mongo-db";
import { DashboardFilterQuery } from "@workspace/api-zod";

const router: IRouter = Router();

// 1. Today Accounts Overview
router.get("/dashboard/accounts-overview", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    
    const dbPlants = await Master.find({ type: "plant" });
    const plants = dbPlants.map(p => p.name);
    
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    const results = [];

    for (const plant of plants) {
      // Today Stats
      const todayInvoices = await Invoice.aggregate([
        { $match: { plant, invoiceDate: today } },
        { $group: { _id: null, qty: { $sum: "$quantity" } } }
      ]);
      
      const todayDcsCount = await DeliveryChallan.countDocuments({ plant, dcDate: today });
      const todaySalesCount = await SalesOrder.countDocuments({ plant, poDate: today });

      // Month Stats
      const monthInvoices = await Invoice.aggregate([
        { $match: { plant, invoiceDate: { $gte: firstDayOfMonth } } },
        { $group: { _id: null, qty: { $sum: "$quantity" } } }
      ]);

      const monthDcsCount = await DeliveryChallan.countDocuments({
        plant,
        dcDate: { $gte: firstDayOfMonth }
      });

      const monthSalesCount = await SalesOrder.countDocuments({
        plant,
        poDate: { $gte: firstDayOfMonth }
      });

      results.push({
        plantName: plant,
        todayInvoiceQuantity: todayInvoices[0]?.qty || 0,
        todayDcQuantity: todayDcsCount || 0,
        todaySalesDocument: todaySalesCount || 0,
        thisMonthInvoiceQuantity: monthInvoices[0]?.qty || 0,
        thisMonthDcQuantity: monthDcsCount || 0,
        thisMonthSalesDocument: monthSalesCount || 0
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Dashboard accounts-overview failed:", err);
    res.json([]);
  }
});

// 2. Invoice Overview
router.get("/dashboard/invoice-overview", async (req, res): Promise<void> => {
  try {
    const parsed = DashboardFilterQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const { plant, from, to } = parsed.data;

    await connectMongo();
    const filter: any = {};
    if (plant && plant !== "All Plant") filter.plant = plant;
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = from;
      if (to) filter.invoiceDate.$lte = to;
    }

    const invoices = await Invoice.find(filter).populate("customerId");

    res.json(invoices.map(inv => ({
      customerName: (inv.customerId as any)?.name || "Unknown",
      grade: inv.grade,
      quantity: inv.quantity,
      noOfInvoice: 1,
      netAmount: inv.totalAmount,
      plant: inv.plant
    })));
  } catch (err) {
    res.json([]);
  }
});

// 3. DC Overview
router.get("/dashboard/dc-overview", async (req, res): Promise<void> => {
  try {
    const parsed = DashboardFilterQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const { plant, from, to } = parsed.data;

    await connectMongo();
    const filter: any = {};
    if (plant && plant !== "All Plant") filter.plant = plant;
    if (from || to) {
      filter.dcDate = {};
      if (from) filter.dcDate.$gte = from;
      if (to) filter.dcDate.$lte = to;
    }

    const dcs = await DeliveryChallan.find(filter).populate("customerId");

    res.json(dcs.map(dc => ({
      customerName: (dc.customerId as any)?.name || "Unknown",
      grade: dc.grade,
      quantity: dc.quantity,
      noOfInvoice: 1,
      netAmount: dc.netAmount || 0,
      plant: dc.plant
    })));
  } catch (err) {
    res.json([]);
  }
});

// 4. Inventory Overview
router.get("/dashboard/inventory-overview", async (req, res): Promise<void> => {
  try {
    const parsed = DashboardFilterQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const { plant, from, to } = parsed.data;

    await connectMongo();
    const filter: any = {};
    if (plant && plant !== "All Plant") filter.plant = plant;
    if (from || to) {
      filter.inventoryDate = {};
      if (from) filter.inventoryDate.$gte = from;
      if (to) filter.inventoryDate.$lte = to;
    }

    const records = await StoreInventory.find(filter).sort({ inventoryDate: -1 }).limit(10);
    res.json(records.map(r => ({
      item: r.itemName,
      supplier: r.supplierName,
      emptyWeight: r.emptyWeight,
      loadedWeight: r.loadedWeight,
      netWeight: r.netWeight,
      plantName: r.plant
    })));
  } catch (err) {
    res.json([]);
  }
});

// 5. Average Overview
router.get("/dashboard/average-overview", async (req, res): Promise<void> => {
  console.log("Dashboard average-overview request received");
  try {
    await connectMongo();
    const results = await Invoice.aggregate([
      {
        $group: {
          _id: {
            year: { $year: { $toDate: "$invoiceDate" } },
            month: { $month: { $toDate: "$invoiceDate" } },
            plant: "$plant"
          },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          plantName: "$_id.plant",
          totalQuantity: 1,
          totalLoadedQty: "$totalQuantity",
          averageRate: { $cond: [ { $eq: ["$totalQuantity", 0] }, 0, { $divide: ["$totalAmount", "$totalQuantity"] } ] }
        }
      }
    ]);
    console.log("Dashboard average-overview results count:", results.length);
    res.json(results || []);
  } catch (err) {
    console.error("Dashboard average-overview failed:", err);
    res.json([]);
  }
});

// 6. Scheduling Overview
router.get("/dashboard/scheduling-overview", async (req, res): Promise<void> => {
  try {
    const parsed = DashboardFilterQuery.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const { plant, from, to } = parsed.data;

    await connectMongo();
    const filter: any = {};
    if (plant && plant !== "All Plant") filter.plant = plant;
    if (from || to) {
      filter.fromTime = {};
      if (from) filter.fromTime.$gte = from;
      if (to) filter.fromTime.$lte = to + "T23:59:59.999Z";
    }

    const schedules = await Schedule.find(filter)
      .populate("customerId")
      .populate("salesOrderId");

    res.json(schedules.map(sch => {
      const salesOrder = sch.salesOrderId as any;
      const firstItem = salesOrder?.items?.[0];
      
      // Basic formatting helper
      const formatTime = (isoString?: string) => {
        if (!isoString) return "N/A";
        try {
          const d = new Date(isoString);
          if (isNaN(d.getTime())) return isoString;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch {
          return isoString;
        }
      };

      return {
        customerName: (sch.customerId as any)?.name || "Unknown",
        site: salesOrder?.siteAddress || "N/A",
        grade: firstItem?.grade || "N/A",
        quantity: firstItem?.quantity || 0,
        startDateTime: formatTime(sch.fromTime),
        endDateTime: formatTime(sch.toTime),
        plant: sch.plant
      };
    }));
  } catch (err) {
    res.json([]);
  }
});

// 7. Payment Followup
router.get("/dashboard/payment-followup", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const followups = await PaymentFollowUp.find({
      status: "pending",
      nextDate: { $exists: true, $ne: "" }
    })
    .populate("customerId")
    .sort({ nextDate: 1 })
    .limit(10);

    res.json(followups.map(f => ({
      customerName: (f.customerId as any)?.name || "Unknown",
      nextFollowupDate: f.nextDate || "N/A",
      followupDescription: f.description || "No description provided"
    })));
  } catch (err) {
    res.json([]);
  }
});

// 8. Current Stock
router.get("/dashboard/current-stock", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const products = await Product.find();
    res.json(products.map(p => ({
      item: p.name,
      stock: p.stockQty || 0
    })));
  } catch (err) {
    res.json([]);
  }
});

// 9. Stats / Counters
router.get("/dashboard/stats", async (req, res): Promise<void> => {
  try {
    await connectMongo();

    const pendingQuotationCount = await Quotation.countDocuments();
    const pendingSupplierPoCount = await PurchaseOrder.countDocuments({ remainingQuantity: { $gt: 0 } });
    const pendingSchedulingPoCount = await Schedule.countDocuments({ status: "scheduled" });

    const cubeEntries = await CubeEntry.find();
    
    let cubeTest7DaysPending = 0;
    let cubeTest28DaysPending = 0;
    let cubeTestPendingForNewCast = 0;

    cubeEntries.forEach(entry => {
      if (!entry.results || entry.results.length === 0) {
        cubeTestPendingForNewCast++;
      } else {
        entry.results.forEach((res: any) => {
          const isPending = !res.cube1Load || !res.cube2Load || !res.cube3Load;
          if (isPending) {
            if (res.testingDays === "7") {
              cubeTest7DaysPending++;
            } else if (res.testingDays === "28") {
              cubeTest28DaysPending++;
            } else {
              cubeTestPendingForNewCast++;
            }
          }
        });
      }
    });

    res.json({
      pendingQuotationCount,
      pendingSupplierPoCount,
      pendingSchedulingPoCount,
      cubeTest7DaysPending,
      cubeTest28DaysPending,
      cubeTestPendingForNewCast
    });
  } catch (err) {
    console.error("Dashboard stats failed:", err);
    res.json({
      pendingQuotationCount: 0,
      pendingSupplierPoCount: 0,
      pendingSchedulingPoCount: 0,
      cubeTest7DaysPending: 0,
      cubeTest28DaysPending: 0,
      cubeTestPendingForNewCast: 0
    });
  }
});

export default router;
