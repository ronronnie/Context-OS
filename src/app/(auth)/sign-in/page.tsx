import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { PRODUCT_NAME } from "@/config/product";

export default function SignInPage() {
  return (
    <div className="w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <p className="text-sm font-medium text-[var(--accent-strong)]">{PRODUCT_NAME}</p>
      <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Access to Product Memory is protected. Product data is retrieved only for
        the authenticated owner.
      </p>
      <div className="mt-6">
        <AuthForm mode="sign-in" />
      </div>
      <p className="mt-5 text-sm text-[var(--muted)]">
        Need an account?{" "}
        <Link className="font-medium text-[var(--accent-strong)]" href="/sign-up">
          Sign up
        </Link>
      </p>
    </div>
  );
}
