import { Router, type IRouter } from "express";
import { connectMongo, Invoice, Customer, Product } from "@workspace/mongo-db";

const router: IRouter = Router();

router.get("/reports/sales", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    
    const totalSales = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: "paid" });
    const pendingInvoices = await Invoice.countDocuments({ status: "pending" });

    const topCustomers = await Invoice.aggregate([
      { $group: { _id: "$customerId", totalAmount: { $sum: "$totalAmount" } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } }
    ]);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      topCustomers: topCustomers.map(cs => ({
        customerId: String(cs._id),
        customerName: cs.customer?.name || "Unknown",
        totalAmount: cs.totalAmount,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/reports/inventory", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const products = await Product.find();
    const lowStockItems = products.filter(p => (p.stockQty || 0) <= (p.minQty || 0)).length;
    const totalValue = products.reduce((sum, p) => sum + (p.unitPrice || 0) * (p.stockQty || 0), 0);

    res.json({
      totalProducts: products.length,
      lowStockItems,
      totalInventoryValue: totalValue,
      recentTransactions: [], // Placeholder
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
