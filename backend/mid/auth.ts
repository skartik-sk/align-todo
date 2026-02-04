import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config'
const SECRET_KEY = process.env.SECRET_KEY || "defaultsecretkey";

export interface AuthRequest extends Request {
  userId?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Access denied" });
    return;
  }

  const token = authHeader.split(" ")[1]; 

  if(!token){
    res.status(401).json({ error: "Access denied" });
    return;
  }

  try {
    const verified = jwt.verify(token, SECRET_KEY) as unknown as { userId: number };
    req.userId = verified.userId;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

export { SECRET_KEY };