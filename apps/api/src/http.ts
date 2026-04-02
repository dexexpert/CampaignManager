import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "validation_error",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  console.error(err);
  return res.status(500).json({ error: "internal_error" });
}

