import { Router, type IRouter } from "express";
import { connectMongo, SalesEnquiry } from "@workspace/mongo-db";

const router: IRouter = Router();

// GET /api/enquiries
router.get("/enquiries", async (req, res) => {
  try {
    await connectMongo();
    const results = await SalesEnquiry.find().sort({ createdAt: -1 });
    res.json(results.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        id: String(r._id),
        enquiryDate: r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "-"
      };
    }));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/enquiries
router.post("/enquiries", async (req, res) => {
  try {
    const {
      contactPerson,
      mobile,
      altNumber,
      email,
      companyName,
      designation,
      customerAddress,
      requirements,
      createdBy,
      followedBy
    } = req.body;

    if (!contactPerson || !mobile || !designation || !customerAddress) {
      res.status(400).json({ error: "Required customer fields are missing" });
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      res.status(400).json({ error: "Mobile number must be exactly 10 digits" });
      return;
    }

    if (altNumber && !/^\d{10}$/.test(altNumber)) {
      res.status(400).json({ error: "Alternate phone number must be exactly 10 digits" });
      return;
    }


    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      res.status(400).json({ error: "Add at least one requirement" });
      return;
    }

    await connectMongo();

    // Generate enquiryId: ENQ/26-27/1001, etc.
    const count = await SalesEnquiry.countDocuments();
    const enquiryId = `ENQ/26-27/${1001 + count}`;

    const newEnquiry = new SalesEnquiry({
      enquiryId,
      contactPerson,
      mobile,
      altNumber,
      email,
      companyName,
      designation,
      customerAddress,
      requirements,
      createdBy: createdBy || "Admin",
      followedBy: followedBy || "Not Assigned",
      status: "pending"
    });

    await newEnquiry.save();
    res.status(201).json({ ...newEnquiry.toObject(), id: String(newEnquiry._id) });
  } catch (error: any) {
    console.error("Error creating sales enquiry:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/enquiries/:id
router.delete("/enquiries/:id", async (req, res) => {
  try {
    await connectMongo();
    await SalesEnquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

export default router;
