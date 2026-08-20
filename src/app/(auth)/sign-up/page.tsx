import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { PRODUCT_NAME } from "@/config/product";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <p className="text-sm font-medium text-[var(--accent-strong)]">{PRODUCT_NAME}</p>
      <h1 className="mt-2 text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Create an authenticated workspace owner before adding products, sources,
        knowledge, tasks, or Context Packs.
      </p>
      <div className="mt-6">
        <AuthForm mode="sign-up" />
      </div>
      <p className="mt-5 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link className="font-medium text-[var(--accent-strong)]" href="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
  );
}
