"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-bone">
      <div className="w-full max-w-sm">
        <p className="eyebrow mb-2 text-ember">Shop Admin</p>
        <h1 className="display-caps text-4xl">Sign in</h1>

        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email" className="text-bone/55">
              Username
            </Label>
            <Input id="email" name="email" type="text" required autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="password" className="text-bone/55">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          {state.error && (
            <p className="border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
