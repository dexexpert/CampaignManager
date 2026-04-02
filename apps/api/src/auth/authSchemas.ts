import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(200),
  password: z.string().min(8).max(200),
});

export const loginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

