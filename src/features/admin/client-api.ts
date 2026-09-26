import type { ApiEnvelope } from "@/lib/api/contracts";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function readAdminEnvelope<
  Data,
  Meta extends Record<string, unknown> = Record<string, never>,
>(response: Response) {
  const payload = (await response.json()) as ApiEnvelope<Data, Meta>;
  if (!response.ok || payload.error || !payload.data) {
    const firstFieldError = payload.error?.fieldErrors
      ? Object.values(payload.error.fieldErrors).flat()[0]
      : undefined;
    throw new AdminApiError(
      firstFieldError ?? payload.error?.message ?? "درخواست مدیریت انجام نشد.",
      response.status,
    );
  }
  return payload;
}
