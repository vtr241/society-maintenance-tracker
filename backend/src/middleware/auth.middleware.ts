import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "RESIDENT" | "ADMIN";
    name: string;
    flatNumber?: string | null;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authorization token missing or malformed" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "default_jwt_secret";

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: "RESIDENT" | "ADMIN";
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, flatNumber: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "User session expired or user not found" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as "RESIDENT" | "ADMIN",
      name: user.name,
      flatNumber: user.flatNumber,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: "Invalid or expired authorization token" });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    return;
  }
  next();
};
