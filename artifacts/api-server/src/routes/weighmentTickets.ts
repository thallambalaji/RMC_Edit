import { Router, type IRouter } from "express";
import { connectMongo, WeighmentTicket } from "@workspace/mongo-db";
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

router.get("/weighment-tickets/by-vehicle/:vehicleNo", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const vehicleNoParam = decodeURIComponent(req.params.vehicleNo).trim();
    const allTickets = await WeighmentTicket.find().sort({ createdAt: -1 });
    
    const matchedTickets = allTickets.filter((t) => {
      if (!t.vehicleNo) return false;
      const cleanDb = t.vehicleNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const cleanParam = vehicleNoParam.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return cleanDb === cleanParam || t.vehicleNo.toLowerCase() === vehicleNoParam.toLowerCase();
    });

    const latestEmpty = matchedTickets.find(t => 
      t.weightType?.toLowerCase().includes("empty") || t.weightType?.toLowerCase().includes("tare")
    );
    const latestLoaded = matchedTickets.find(t => 
      t.weightType?.toLowerCase().includes("loaded") || t.weightType?.toLowerCase().includes("gross")
    );

    const emptyWeight = latestEmpty ? Number(latestEmpty.weight) || 0 : 0;
    const loadedWeight = latestLoaded ? Number(latestLoaded.weight) || 0 : 0;
    const netWeight = Math.max(0, loadedWeight - emptyWeight);

    res.json({
      tickets: matchedTickets,
      latestEmpty,
      latestLoaded,
      emptyWeight,
      loadedWeight,
      netWeight
    });
  } catch (error: any) {
    console.error("Failed to fetch tickets by vehicle:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.get("/weighment-tickets", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const tickets = await WeighmentTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.post("/weighment-tickets", async (req, res): Promise<void> => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await connectMongo();
    const ticket = new WeighmentTicket({
      ...parsed.data,
      weight: Number(parsed.data.weight),
      createdBy: parsed.data.createdBy || "Super Admin",
    });

    await ticket.save();
    console.log("✅ Ticket saved successfully:", ticket._id);
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error("❌ Failed to save ticket to MongoDB:");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.errors) console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

router.put("/weighment-tickets/:id", async (req, res): Promise<void> => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await connectMongo();
    const result = await WeighmentTicket.findByIdAndUpdate(
      req.params.id,
      {
        ...parsed.data,
        weight: Number(parsed.data.weight),
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    console.log("✅ Ticket updated successfully:", result._id);
    res.json(result);
  } catch (error: any) {
    console.error("❌ Failed to update ticket in MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


router.delete("/weighment-tickets/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const result = await WeighmentTicket.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Failed to delete ticket from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
