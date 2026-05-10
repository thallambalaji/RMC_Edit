import { Router, type IRouter } from "express";
import { connectMongo, Invoice, Customer, DeliveryChallan, SalesOrder, Product } from "@workspace/mongo-db";
import { DashboardFilterQuery } from "@workspace/api-zod";

const router: IRouter = Router();

// 1. Today Accounts Overview
router.get("/dashboard/accounts-overview", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const plants = ["FORTUNE CONCRETE", "NARVAL RMC"];
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    const results = [];

    for (const plant of plants) {
      // Today Stats
      const todayInvoices = await Invoice.aggregate([
        { $match: { plant, invoiceDate: today } },
        { $group: { _id: null, qty: { $sum: "$quantity" } } }
      ]);
      
      const todayDcsCount = await DeliveryChallan.countDocuments({ dcDate: today });
      // SalesOrder model not created yet in this turn, but assuming standard name
      // const todaySalesCount = await SalesOrder.countDocuments({ orderDate: today });

      // Month Stats
      const monthInvoices = await Invoice.aggregate([
        { $match: { plant, invoiceDate: { $gte: firstDayOfMonth } } },
        { $group: { _id: null, qty: { $sum: "$quantity" } } }
      ]);

      results.push({
        plantName: plant,
        todayInvoiceQuantity: todayInvoices[0]?.qty || 0,
        todayDcQuantity: todayDcsCount || 0,
        todaySalesDocument: 0, // Placeholder until SalesOrder is migrated
        thisMonthInvoiceQuantity: monthInvoices[0]?.qty || 0,
        thisMonthDcQuantity: 0,
        thisMonthSalesDocument: 0
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
  res.json([]);
});

// 4. Inventory Overview (Mocked)
router.get("/dashboard/inventory-overview", async (req, res): Promise<void> => {
  res.json([
    { item: "SAND", supplier: "ASTRA ROCK MINING INDUSTRIES LLP", emptyWeight: 14500, loadedWeight: 36680, netWeight: 22180, plantName: "FORTUNE CONCRETE" },
    { item: "SAND", supplier: "ASTRA ROCK MINING INDUSTRIES LLP", emptyWeight: 12700, loadedWeight: 37310, netWeight: 24610, plantName: "FORTUNE CONCRETE" },
    { item: "MAHA CEMENT", supplier: "FORTUNE CONCRETE", emptyWeight: 15450, loadedWeight: 51000, netWeight: 35550, plantName: "FORTUNE CONCRETE" }
  ]);
});

// 5. Average Overview
router.get("/dashboard/average-overview", async (req, res): Promise<void> => {
  console.log("Dashboard average-overview request received");
  try {
    await connectMongo();
    // Use aggregate with safety
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

// 6. Scheduling Overview (Mocked for now)
router.get("/dashboard/scheduling-overview", async (req, res): Promise<void> => {
  res.json([]);
});

// 7. Payment Followup (Mocked for now)
router.get("/dashboard/payment-followup", async (req, res): Promise<void> => {
  res.json([]);
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

// 9. Stats / Counters (Mocked)
router.get("/dashboard/stats", async (req, res): Promise<void> => {
  res.json({
    pendingQuotationCount: 0,
    pendingSupplierPoCount: 0,
    pendingSchedulingPoCount: 0,
    cubeTest7DaysPending: 9,
    cubeTest28DaysPending: 12,
    cubeTestPendingForNewCast: 125
  });
});

export default router;
