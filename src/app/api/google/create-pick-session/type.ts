import { z } from 'zod';

export const GooglePickingSessionResponseSchema = z.object({
  id: z.string(),
  pickerUri: z.string(),
});

export type GooglePickingSessionResponse = z.infer<
  typeof GooglePickingSessionResponseSchema
>;

export const CreatePickSessionResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    id: z.string(),
    pickerUri: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type CreatePickSessionResponse = z.infer<
  typeof CreatePickSessionResponseSchema
>;
