import { Router, type IRouter } from "express";
import { connectMongo, User } from "@workspace/mongo-db";
import {
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let adminPassword = "admin123";
const adminUser = {
  id: "1",
  username: "admin",
  fullName: "Super Admin",
  email: "sadmin@fortune.com",
  role: "admin",
};

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  // Hardcoded Admin
  if (username === "admin" && password === adminPassword) {
    res.cookie("userId", "1", { httpOnly: false, maxAge: 86400000 });
    res.json(LoginResponse.parse(adminUser));
    return;
  }

  try {
    await connectMongo();
    const user = await User.findOne({ username });
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.cookie("userId", String(user._id), { httpOnly: false, maxAge: 86400000 });
    res.json(LoginResponse.parse({
      id: String(user._id),
      username: user.username,
      fullName: user.username, // MongoDB schema has no fullName yet, using username
      email: user.username + "@fortune.com",
      role: user.role,
    }));
  } catch (err) {
    console.error("Critical login error (check MONGODB_URI):", err);
    res.status(500).json({ error: "Internal server error" });
  }
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

export default router;
