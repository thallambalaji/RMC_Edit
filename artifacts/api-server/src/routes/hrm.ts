import { Router, type IRouter } from "express";
import { connectMongo, Employee } from "@workspace/mongo-db";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(e: any) {
  const obj = e.toObject ? e.toObject() : e;
  return {
    ...obj,
    id: String(obj._id),
    salary: obj.salary || 0,
  };
}

router.get("/employees", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const employees = await Employee.find().sort({ createdAt: 1 });
    res.json(employees.map(toApi));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const employee = new Employee(parsed.data);
    await employee.save();
    res.status(201).json(toApi(employee));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(toApi(employee));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.put("/employees/:id", async (req, res): Promise<void> => {
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const employee = await Employee.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(toApi(employee));
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  try {
    await connectMongo();
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Attendance and Payroll placeholders
router.get("/attendance", async (_req, res) => res.json([]));
router.get("/payroll", async (_req, res) => res.json([]));

export default router;
