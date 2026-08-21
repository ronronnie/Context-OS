"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-md border border-[#fecaca] bg-[#fee2e2] p-4">
      <p className="text-sm font-medium text-[#991b1b]">This workspace could not load.</p>
      <p className="mt-2 text-sm leading-6 text-[#991b1b]">
        Retry the request. If it fails again, check the server logs and database connection.
      </p>
      <Button className="mt-4" onClick={reset} type="button" variant="secondary">
        Try again
      </Button>
    </section>
  );
}
