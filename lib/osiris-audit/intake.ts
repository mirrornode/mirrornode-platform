import { z } from 'zod';

const artifactLinkSchema = z
  .string()
  .trim()
  .url('Each artifact reference must be a valid URL')
  .max(2048, 'Artifact URLs must be 2048 characters or fewer');

export const osirisAuditIntakeSchema = z
  .object({
    sessionId: z
      .string()
      .trim()
      .min(1, 'Stripe session is required')
      .max(255, 'Stripe session is too long')
      .refine((value) => value.startsWith('cs_'), 'Invalid Stripe session'),
    systemSummary: z
      .string()
      .trim()
      .min(10, 'System summary must be at least 10 characters')
      .max(4000, 'System summary must be 4000 characters or fewer'),
    primaryGoal: z
      .string()
      .trim()
      .min(10, 'Primary goal must be at least 10 characters')
      .max(2000, 'Primary goal must be 2000 characters or fewer'),
    concerns: z
      .string()
      .trim()
      .min(1, 'At least one concern is required')
      .max(4000, 'Concerns must be 4000 characters or fewer'),
    artifactLinks: z.array(artifactLinkSchema).max(5, 'Provide no more than 5 artifact links').default([]),
    additionalContext: z
      .string()
      .trim()
      .max(4000, 'Additional context must be 4000 characters or fewer')
      .default(''),
  })
  .strict();

export type OsirisAuditIntake = z.infer<typeof osirisAuditIntakeSchema>;
