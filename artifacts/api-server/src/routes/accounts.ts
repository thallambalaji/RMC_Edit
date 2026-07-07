import { Router, type IRouter } from "express";
import { connectMongo, Account } from "@workspace/mongo-db";
import {
  CreateAccountBody,
  CreateLedgerEntryBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/accounts", async (_req, res): Promise<void> => {
  try {
    await connectMongo();
    const accounts = await Account.find().sort({ code: 1 });
    res.json(accounts.map(a => ({ ...a.toObject(), id: String(a._id), balance: a.balance || 0 })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/accounts", async (req, res): Promise<void> => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    await connectMongo();
    const account = new Account(parsed.data);
    await account.save();
    res.status(201).json({ ...account.toObject(), id: String(account._id), balance: account.balance || 0 });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Ledger entries placeholder
router.get("/ledger-entries", async (_req, res) => res.json([]));

export default router;
