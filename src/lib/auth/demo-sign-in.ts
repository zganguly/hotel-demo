"use server";

import { auth } from "@/lib/auth/auth";
import { resolvePostLoginPath } from "@/lib/auth/redirect";

export async function signInDemoUser(email: string, propertySlug: string, callbackUrl?: string) {
  const password = process.env.DEMO_SEED_PASSWORD ?? "demo-password";
  const result = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (!result?.user) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    redirectTo: resolvePostLoginPath(callbackUrl, propertySlug),
  };
}
