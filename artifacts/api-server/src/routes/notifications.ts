import { Router, type IRouter } from "express";
import { connectMongo, Quotation, CubeEntry, PaymentFollowUp, Product } from "@workspace/mongo-db";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  try {
    await connectMongo();

    const notifications: any[] = [];
    let idCounter = 1;

    // 1. Pending / Recent Quotations
    const quotations = await Quotation.find().sort({ createdAt: -1 }).limit(5);
    for (const q of quotations) {
      notifications.push({
        id: `q-${q._id || idCounter++}`,
        title: "Quotation Created",
        desc: `Quotation #${q.quotationNo} for ${q.customerName}`,
        time: q.date || "Recent",
        read: false,
        href: "/customer-po"
      });
    }

    // 2. Pending Cube Tests
    const cubeEntries = await CubeEntry.find().sort({ createdAt: -1 }).limit(5);
    for (const entry of cubeEntries) {
      let pendingDays: string[] = [];
      if (!entry.results || entry.results.length === 0) {
        pendingDays.push("Casting");
      } else {
        entry.results.forEach((r: any) => {
          if (!r.cube1Load || !r.cube2Load || !r.cube3Load) {
            if (r.testingDays) pendingDays.push(`${r.testingDays}-day`);
          }
        });
      }
      if (pendingDays.length > 0) {
        notifications.push({
          id: `c-${entry._id || idCounter++}`,
          title: "Cube Test Due",
          desc: `Grade ${entry.grade} (${entry.customerName}) ${pendingDays.join(", ")} testing pending`,
          time: "Action required",
          read: false,
          href: "/qc"
        });
      }
    }

    // 3. Pending Payment Followups
    const followups = await PaymentFollowUp.find({ status: "pending" }).populate("customerId").limit(5);
    for (const f of followups) {
      const custName = (f.customerId as any)?.name || "Customer";
      notifications.push({
        id: `pf-${f._id || idCounter++}`,
        title: "Payment Follow-up",
        desc: `Follow-up for ${custName}: ${f.description || "Pending payment"}`,
        time: f.nextDate || "Due",
        read: false,
        href: "/sales"
      });
    }

    // 4. Low Stock Alerts
    const lowStockProducts = await Product.find({ $expr: { $lte: ["$stockQty", "$minQty"] } }).limit(5);
    for (const p of lowStockProducts) {
      if (p.minQty > 0) {
        notifications.push({
          id: `p-${p._id || idCounter++}`,
          title: "Low Stock Alert",
          desc: `${p.name} stock level (${p.stockQty} ${p.unit || ''}) is below minimum (${p.minQty})`,
          time: "Inventory",
          read: false,
          href: "/store"
        });
      }
    }

    res.json(notifications);
  } catch (err) {
    console.error("Notifications fetch failed:", err);
    res.json([]);
  }
});

export default router;
