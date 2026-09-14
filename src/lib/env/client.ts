import { z } from "zod";

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
});

export type ClientEnvironment = z.infer<typeof clientEnvironmentSchema>;

export function parseClientEnvironment(environment: {
  NEXT_PUBLIC_APP_URL?: string;
}): ClientEnvironment {
  return clientEnvironmentSchema.parse(environment);
}
