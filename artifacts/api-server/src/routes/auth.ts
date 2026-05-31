import { Router, type IRouter } from "express";
import { connectMongo, User, RolePermission } from "@workspace/mongo-db";
import {
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let adminPassword = "admin@2026";
const adminUser = {
  id: "1",
  username: "admin@aeccentric.com",
  fullName: "Admin",
  email: "admin@aeccentric.com",
  role: "admin",
};

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  // Strict Temporary Restriction
  if (username !== "admin@aeccentric.com" || password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials. Temporary restriction: Only admin@aeccentric.com is permitted." });
    return;
  }

  res.cookie("userId", "1", { httpOnly: false, maxAge: 86400000 });
  res.json(LoginResponse.parse(adminUser));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.clearCookie("userId");
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.cookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (userId === "1") {
    res.json(GetMeResponse.parse(adminUser));
    return;
  }

  try {
    await connectMongo();
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json(GetMeResponse.parse({
      id: String(user._id),
      username: user.username,
      fullName: user.username,
      email: user.username + "@fortune.com",
      role: user.role,
    }));
  } catch (err) {
    console.error("Auth me failed:", err);
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.put("/auth/profile", async (req, res): Promise<void> => {
  const userId = req.cookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { fullName, email } = req.body;
  if (!fullName || !email) {
    res.status(400).json({ error: "Full Name and Email are required" });
    return;
  }

  if (userId === "1") {
    adminUser.fullName = fullName;
    adminUser.email = email;
    res.json(GetMeResponse.parse(adminUser));
    return;
  }

  try {
    await connectMongo();
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    user.username = fullName; // We can map fullName to username, or store it
    await user.save();
    res.json(GetMeResponse.parse({
      id: String(user._id),
      username: user.username,
      fullName: user.username,
      email: email,
      role: user.role,
    }));
  } catch (err: any) {
    console.error("Update profile failed:", err);
    res.status(500).json({ error: err.message || "Failed to update profile" });
  }
});

router.put("/auth/change-password", async (req, res): Promise<void> => {
  const userId = req.cookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (userId === "1") {
    if (currentPassword !== adminPassword) {
      res.status(400).json({ error: "Incorrect current password" });
      return;
    }
    adminPassword = newPassword;
    res.json({ success: true });
    return;
  }

  try {
    await connectMongo();
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.passwordHash !== currentPassword) {
      res.status(400).json({ error: "Incorrect current password" });
      return;
    }
    user.passwordHash = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err: any) {
    console.error("Change password failed:", err);
    res.status(500).json({ error: err.message || "Failed to change password" });
  }
});

const DEFAULT_PERMISSIONS = [
  {
    roleId: "admin",
    permissions: {
      "Customer & PO": ["read", "create", "edit", "delete"],
      "Sales & Enquiries": ["read", "create", "edit", "delete"],
      "Billing & Invoices": ["read", "create", "edit", "delete"],
      "Delivery Challan": ["read", "create", "edit", "delete"],
      "Weighbridge & Weighment": ["read", "create", "edit", "delete"],
      "QC Mix & Recipes": ["read", "create", "edit", "delete"],
      "Fleet & Transport": ["read", "create", "edit", "delete"],
    }
  },
  {
    roleId: "manager",
    permissions: {
      "Customer & PO": ["read", "create", "edit"],
      "Sales & Enquiries": ["read", "create", "edit"],
      "Billing & Invoices": ["read", "create", "edit"],
      "Delivery Challan": ["read"],
      "Weighbridge & Weighment": ["read"],
      "QC Mix & Recipes": ["read"],
      "Fleet & Transport": ["read"],
    }
  },
  {
    roleId: "dispatcher",
    permissions: {
      "Customer & PO": ["read"],
      "Sales & Enquiries": ["read"],
      "Billing & Invoices": [],
      "Delivery Challan": ["read", "create", "edit"],
      "Weighbridge & Weighment": ["read", "create", "edit"],
      "QC Mix & Recipes": [],
      "Fleet & Transport": ["read", "create", "edit"],
    }
  },
  {
    roleId: "qc_engineer",
    permissions: {
      "Customer & PO": ["read"],
      "Sales & Enquiries": [],
      "Billing & Invoices": [],
      "Delivery Challan": ["read"],
      "Weighbridge & Weighment": [],
      "QC Mix & Recipes": ["read", "create", "edit"],
      "Fleet & Transport": [],
    }
  }
];

router.get("/auth/permissions", async (req, res): Promise<void> => {
  const userId = req.cookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    await connectMongo();
    const records = await RolePermission.find();

    // If no records in database, seed/return default permissions
    if (records.length === 0) {
      const formatted = DEFAULT_PERMISSIONS.map(p => ({
        roleId: p.roleId,
        permissions: p.permissions
      }));
      res.json(formatted);
      return;
    }

    const formatted = records.map((r: any) => ({
      roleId: r.roleId,
      permissions: Object.fromEntries(r.permissions)
    }));
    res.json(formatted);
  } catch (err: any) {
    console.error("Get permissions failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch permissions" });
  }
});

router.put("/auth/permissions", async (req, res): Promise<void> => {
  const userId = req.cookies?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let isAdmin = false;
  if (userId === "1") {
    isAdmin = true;
  } else {
    try {
      await connectMongo();
      const user = await User.findById(userId);
      if (user && user.role === "admin") {
        isAdmin = true;
      }
    } catch { }
  }

  if (!isAdmin) {
    res.status(403).json({ error: "Access denied. Only Super Admins can configure permissions." });
    return;
  }

  const { roleId, permissions } = req.body;
  if (!roleId || !permissions) {
    res.status(400).json({ error: "Role ID and permissions config map are required" });
    return;
  }

  try {
    await connectMongo();
    let record = await RolePermission.findOne({ roleId });
    if (!record) {
      record = new RolePermission({ roleId, permissions });
    } else {
      record.permissions = permissions;
    }
    await record.save();
    res.json({ success: true, record: { roleId: record.roleId, permissions: Object.fromEntries(record.permissions) } });
  } catch (err: any) {
    console.error("Save permissions failed:", err);
    res.status(500).json({ error: err.message || "Failed to save permissions" });
  }
});

export default router;
