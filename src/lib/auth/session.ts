import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export function assertAuthenticatedUserId(userId: string | null | undefined) {
  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  return userId;
}
