import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "supersecretkey";

// Extend the Express Request interface to include userId
export interface AuthRequest extends Request {
  userId?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Access denied" });
    return;
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  try {
    const verified = jwt.verify(token, SECRET_KEY) as { userId: number };
    req.userId = verified.userId;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

export { SECRET_KEY };