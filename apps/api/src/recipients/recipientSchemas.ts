import { z } from "zod";

export const createRecipientBodySchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(200),
});

