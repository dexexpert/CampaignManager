import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type JwtUser } from "./tokens.js";

export type AuthedRequest = Request & { user: JwtUser };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];

  if (!token) return res.status(401).json({ error: "unauthorized" });

  try {
    const user = verifyAccessToken(token);
    (req as AuthedRequest).user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}

