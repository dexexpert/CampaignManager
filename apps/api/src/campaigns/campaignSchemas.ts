import { z } from "zod";

export const createCampaignBodySchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50_000),
  recipientEmails: z.array(z.string().email().max(255)).min(1).max(500),
});

export const updateCampaignBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    subject: z.string().min(1).max(200).optional(),
    body: z.string().min(1).max(50_000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "at least one field required" });

export const scheduleCampaignBodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

