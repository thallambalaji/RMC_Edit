import { Router, type IRouter } from "express";
import { connectMongo, InventoryTicket } from "@workspace/mongo-db";
import { z } from "zod";

const router: IRouter = Router();

// Zod schema for validation
const createTicketSchema = z.object({
  ticketNo: z.string(),
  plant: z.string(),
  vehicleNo: z.string(),
  weightType: z.string(),
  weight: z.string().or(z.number()),
  createdBy: z.string().optional(),
});

router.get("/inventory-tickets", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const tickets = await InventoryTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error("Failed to fetch inventory tickets from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/inventory-tickets", async (req, res): Promise<void> => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await connectMongo();
    const ticket = new InventoryTicket({
      ...parsed.data,
      weight: Number(parsed.data.weight),
      createdBy: parsed.data.createdBy || "Super Admin",
    });

    await ticket.save();
    console.log("✅ Inventory Ticket saved successfully:", ticket._id);
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error("❌ Failed to save inventory ticket to MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.put("/inventory-tickets/:id", async (req, res): Promise<void> => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await connectMongo();
    const result = await InventoryTicket.findByIdAndUpdate(
      req.params.id,
      {
        ...parsed.data,
        weight: Number(parsed.data.weight),
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ error: "Inventory ticket not found" });
      return;
    }

    console.log("✅ Inventory Ticket updated successfully:", result._id);
    res.json(result);
  } catch (error: any) {
    console.error("❌ Failed to update inventory ticket in MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.delete("/inventory-tickets/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const result = await InventoryTicket.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Inventory ticket not found" });
      return;
    }
    res.json({ message: "Inventory ticket deleted successfully" });
  } catch (error) {
    console.error("Failed to delete inventory ticket from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
