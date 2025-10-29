import { z } from 'zod';

export const analysisRequestSchema = z.object({
  question: z.string({ required_error: 'question is required' }).min(1, 'question cannot be empty'),
  context: z.string({ required_error: 'context is required' }).min(1, 'context cannot be empty'),
  personalData: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    })
    .strip()
    .optional(),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

export const analysisChunkSchema = z.object({
  type: z.literal('analysis'),
  content: z.string().min(1),
});

export const analysisResponseSchema = z.object({
  analysis: z.string().min(1),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

export class ValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super('Invalid request payload');
    this.issues = issues;
  }
}

export const parseAnalysisRequest = (payload: unknown): AnalysisRequest => {
  const result = analysisRequestSchema.safeParse(payload);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
};
