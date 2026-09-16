export const defaultJsonBodyLimit = 32 * 1024;

export class ApiRequestError extends Error {
  constructor(
    public readonly code: "INVALID_JSON" | "PAYLOAD_TOO_LARGE",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function readJsonBody(
  request: Request,
  maximumBytes = defaultJsonBodyLimit,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maximumBytes) {
    throw new ApiRequestError(
      "PAYLOAD_TOO_LARGE",
      "حجم درخواست بیش از حد مجاز است.",
      413,
    );
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) {
    throw new ApiRequestError(
      "PAYLOAD_TOO_LARGE",
      "حجم درخواست بیش از حد مجاز است.",
      413,
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError(
      "INVALID_JSON",
      "ساختار اطلاعات ارسال‌شده معتبر نیست.",
      400,
    );
  }
}
