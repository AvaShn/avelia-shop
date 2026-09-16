"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApiEnvelope } from "@/lib/api/contracts";

type TelegramHandoff = {
  telegramUrl: string;
  expiresAt: string;
};

export function TelegramHandoffButton({ orderToken }: { orderToken: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueInTelegram() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/telegram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderToken }),
      });
      const payload = (await response.json()) as ApiEnvelope<TelegramHandoff>;
      if (!response.ok || payload.error || !payload.data) {
        throw new Error(
          payload.error?.message ?? "ساخت لینک تلگرام انجام نشد.",
        );
      }

      window.location.assign(payload.data.telegramUrl);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "ارتباط با تلگرام برقرار نشد. دوباره تلاش کنید.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        className="w-full sm:w-auto"
        size="lg"
        disabled={isLoading}
        onClick={() => void continueInTelegram()}
      >
        {isLoading ? (
          <>
            در حال ساخت لینک امن
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          </>
        ) : (
          <>
            ادامه امن در تلگرام
            <Send aria-hidden="true" />
          </>
        )}
      </Button>
      {error ? (
        <p className="text-danger mt-3 text-sm leading-7" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
