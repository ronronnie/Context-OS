"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");

    startTransition(async () => {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-4">
      {mode === "sign-up" ? (
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            name="name"
            required
            autoComplete="name"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        />
      </label>
      {error ? (
        <p
          className="rounded-md border border-[#fecaca] bg-[#fee2e2] px-3 py-2 text-sm text-[#991b1b]"
          id="auth-form-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button
        aria-describedby={error ? "auth-form-error" : undefined}
        className="w-full"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Working..." : mode === "sign-up" ? "Sign up" : "Sign in"}
      </Button>
    </form>
  );
}
