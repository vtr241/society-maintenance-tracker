import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const generateToken = (userId: string, role: string, email: string): string => {
  const secret = process.env.JWT_SECRET || "default_jwt_secret";
  return jwt.sign({ id: userId, role, email }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, flatNumber, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required" });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNormalized } });
    if (existing) {
      res.status(409).json({ success: false, message: "A user with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role === "ADMIN" ? "ADMIN" : "RESIDENT";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNormalized,
        passwordHash,
        role: userRole,
        flatNumber: flatNumber ? flatNumber.trim() : null,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        flatNumber: true,
        phone: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.role, user.email);

    res.status(201).json({
      success: true,
      message: "Account registered successfully",
      data: { user, token },
    });
  } catch (error: any) {
    console.error("[AuthController.register] Error:", error);
    res.status(500).json({ success: false, message: "Internal server error during registration" });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailNormalized } });

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id, user.role, user.email);

    res.json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          flatNumber: user.flatNumber,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error("[AuthController.login] Error:", error);
    res.status(500).json({ success: false, message: "Internal server error during login" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        flatNumber: true,
        phone: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error: any) {
    console.error("[AuthController.getMe] Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
