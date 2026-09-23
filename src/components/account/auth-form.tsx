"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountUser } from "@/features/account/schemas";
import type { ApiEnvelope } from "@/lib/api/contracts";

type AuthFormProps = { mode: "login" | "register" };

function safeReturnPath() {
  const candidate = new URLSearchParams(window.location.search).get("returnTo");
  return candidate?.startsWith("/") && !candidate.startsWith("//")
    ? candidate
    : "/account";
}

export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister
              ? { name, phone, email, password, passwordConfirmation }
              : { identifier, password },
          ),
        },
      );
      const payload = (await response.json()) as ApiEnvelope<AccountUser>;
      if (!response.ok || !payload.data) {
        setError(payload.error?.message ?? "درخواست انجام نشد.");
        return;
      }
      window.location.assign(safeReturnPath());
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main-content">
      <Container className="py-12 sm:py-20">
        <section className="bg-surface border-border/70 mx-auto grid max-w-5xl overflow-hidden rounded-xl border shadow-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-primary text-primary-foreground flex flex-col justify-between p-7 sm:p-10">
            <div>
              <span className="flex size-12 items-center justify-center rounded-full bg-white/10">
                <LockKeyhole aria-hidden="true" />
              </span>
              <p className="mt-8 text-sm text-white/55">حساب خصوصی AVELIA</p>
              <h1 className="mt-3 text-3xl leading-[1.45] font-semibold sm:text-4xl">
                {isRegister ? "فضایی برای انتخاب‌های شما" : "خوش آمدید"}
              </h1>
              <p className="mt-5 leading-8 text-white/65">
                سفارش‌ها، نشانی تحویل و وضعیت پرداخت در حساب شما نگهداری می‌شود
                تا هر انتخاب قابل پیگیری باشد.
              </p>
            </div>
            <p className="mt-12 text-xs leading-6 text-white/40">
              رمز عبور فقط به‌صورت هش‌شده ذخیره می‌شود.
            </p>
          </div>

          <form
            onSubmit={(event) => void submit(event)}
            className="p-6 sm:p-10"
          >
            <p className="text-accent text-sm font-medium">
              {isRegister ? "ثبت‌نام" : "ورود"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {isRegister ? "ساخت حساب کاربری" : "ورود به حساب کاربری"}
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {isRegister ? (
                <>
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium">
                      نام و نام خانوادگی
                    </span>
                    <Input
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium">
                      شماره موبایل
                    </span>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      required
                      placeholder="09121234567"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium">
                      ایمیل
                    </span>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      dir="ltr"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                </>
              ) : (
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    ایمیل یا شماره موبایل
                  </span>
                  <Input
                    autoComplete="username"
                    dir="ltr"
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                </label>
              )}
              <div className={isRegister ? "" : "sm:col-span-2"}>
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="account-password"
                >
                  رمز عبور
                </label>
                <Input
                  id="account-password"
                  type="password"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {isRegister ? (
                <label>
                  <span className="mb-2 block text-sm font-medium">
                    تکرار رمز عبور
                  </span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirmation}
                    onChange={(event) =>
                      setPasswordConfirmation(event.target.value)
                    }
                  />
                </label>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="border-danger/20 bg-danger/5 text-danger mt-6 rounded-lg border px-4 py-3 text-sm leading-7"
              >
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="mt-7 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              {isRegister ? "ساخت حساب" : "ورود امن"}
              {!isSubmitting ? <ArrowLeft aria-hidden="true" /> : null}
            </Button>
            <p className="text-muted-foreground mt-6 text-center text-sm">
              {isRegister ? "قبلاً حساب ساخته‌اید؟" : "هنوز حساب ندارید؟"}{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href={isRegister ? "/login" : "/register"}
              >
                {isRegister ? "وارد شوید" : "ثبت‌نام کنید"}
              </Link>
            </p>
          </form>
        </section>
      </Container>
    </main>
  );
}
