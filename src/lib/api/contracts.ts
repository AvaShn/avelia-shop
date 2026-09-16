import { z } from "zod";

export const apiErrorSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});

export const apiMetaSchema = z
  .object({
    requestId: z.string().uuid(),
  })
  .catchall(z.unknown());

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiMeta = z.infer<typeof apiMetaSchema>;

export type ApiEnvelope<
  Data,
  Meta extends Record<string, unknown> = Record<string, never>,
> =
  | {
      data: Data;
      error: null;
      meta: ApiMeta & Meta;
    }
  | {
      data: null;
      error: ApiError;
      meta: ApiMeta & Partial<Meta>;
    };

export function createApiEnvelopeSchema<
  DataSchema extends z.ZodType,
  MetaSchema extends z.ZodType = typeof apiMetaSchema,
>(dataSchema: DataSchema, metaSchema?: MetaSchema) {
  const resolvedMetaSchema = metaSchema ?? apiMetaSchema;

  return z.union([
    z.object({
      data: dataSchema,
      error: z.null(),
      meta: resolvedMetaSchema,
    }),
    z.object({
      data: z.null(),
      error: apiErrorSchema,
      meta: resolvedMetaSchema,
    }),
  ]);
}
