import { Router, type IRouter } from "express";
import { connectMongo, User } from "@workspace/mongo-db";
import {
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USER = {
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
  if (username === "admin" && password === "admin123") {
    res.cookie("userId", "1", { httpOnly: false, maxAge: 86400000 });
    res.json(LoginResponse.parse(ADMIN_USER));
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
    console.error("Login failed:", err);
    res.status(401).json({ error: "Invalid credentials" });
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
    res.json(GetMeResponse.parse(ADMIN_USER));
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

export default router;
