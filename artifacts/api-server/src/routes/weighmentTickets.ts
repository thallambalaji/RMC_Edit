import { Router, type IRouter } from "express";
import { connectMongo, WeighmentTicket } from "@workspace/mongo-db";
import { z } from "zod";

const router: IRouter = Router();

// Zod schema for validation
const createTicketSchema = z.object({
  ticketNo: z.string().optional(),
  plant: z.string().optional(),
  vehicleNo: z.string(),
  weightType: z.string().optional().default("Loaded Weight"),
  weight: z.string().or(z.number()),
  status: z.enum(["OPEN", "CLOSED"]).optional().default("OPEN"),
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

    // Find the single active OPEN ticket for this vehicle
    const activeOpenTicket = matchedTickets.find(t => (t.status === "OPEN" || !t.status));

    let latestEmpty = null;
    let latestLoaded = null;
    let emptyWeight = 0;
    let loadedWeight = 0;

    if (activeOpenTicket) {
      const isTypeEmpty = activeOpenTicket.weightType?.toLowerCase().includes("empty") || activeOpenTicket.weightType?.toLowerCase().includes("tare");
      if (isTypeEmpty) {
        latestEmpty = activeOpenTicket;
        emptyWeight = Number(activeOpenTicket.weight) || 0;
      } else {
        latestLoaded = activeOpenTicket;
        loadedWeight = Number(activeOpenTicket.weight) || 0;
      }
    }

    res.json({
      tickets: matchedTickets,
      activeTicket: activeOpenTicket || null,
      latestEmpty,
      latestLoaded,
      emptyWeight,
      loadedWeight,
      netWeight: 0
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

    // Check if vehicle already has an active OPEN ticket
    const cleanReqVeh = parsed.data.vehicleNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const existingTickets = await WeighmentTicket.find({ status: { $ne: "CLOSED" } });
    const existingOpen = existingTickets.find(t => {
      const cleanDbVeh = t.vehicleNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return cleanDbVeh === cleanReqVeh;
    });

    if (existingOpen) {
      res.status(400).json({ 
        error: `Vehicle ${parsed.data.vehicleNo} already has an active OPEN ticket (${existingOpen.ticketNo} - ${existingOpen.weightType}: ${existingOpen.weight} KG). Please complete Add Weighment to close this ticket before raising a new one.` 
      });
      return;
    }

    const plantValue = (parsed.data.plant && parsed.data.plant.trim()) ? parsed.data.plant.trim() : "Main Plant";
    const ticketNoValue = (parsed.data.ticketNo && parsed.data.ticketNo.trim()) 
      ? parsed.data.ticketNo.trim() 
      : `TKT1/2627/${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = new WeighmentTicket({
      ...parsed.data,
      ticketNo: ticketNoValue,
      plant: plantValue,
      status: "OPEN",
      weight: Number(parsed.data.weight),
      createdBy: parsed.data.createdBy || "Super Admin",
    });

    await ticket.save();
    console.log("✅ Ticket created with status OPEN:", ticket.ticketNo);
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error("❌ Failed to save ticket to MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Close active ticket by vehicle number (called automatically when Add Weighment / Delivery Challan is recorded)
router.post("/weighment-tickets/close-by-vehicle/:vehicleNo", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const vehicleNoParam = decodeURIComponent(req.params.vehicleNo).trim();
    const cleanParam = vehicleNoParam.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    
    const openTickets = await WeighmentTicket.find({ status: { $ne: "CLOSED" } });
    const ticketToClose = openTickets.find(t => {
      const cleanDb = t.vehicleNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return cleanDb === cleanParam;
    });

    if (ticketToClose) {
      ticketToClose.status = "CLOSED";
      ticketToClose.closedAt = new Date();
      if (req.body?.deliveryNo) {
        ticketToClose.closedByDeliveryNo = req.body.deliveryNo;
      }
      await ticketToClose.save();
      console.log(`✅ Closed ticket ${ticketToClose.ticketNo} for vehicle ${vehicleNoParam}`);
      res.json({ message: "Ticket closed successfully", ticket: ticketToClose });
    } else {
      res.json({ message: "No open ticket found for vehicle", vehicleNo: vehicleNoParam });
    }
  } catch (error: any) {
    console.error("Failed to close ticket by vehicle:", error);
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
