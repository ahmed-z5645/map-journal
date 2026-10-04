"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, {} as LoginState);
  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-3">
      <input type="hidden" name="next" value={next ?? "/"} />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Password"
        required
        autoFocus
        className="rounded-md border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-500"
      />
      <button
        disabled={pending}
        className="rounded-md bg-stone-800 px-3 py-2 text-stone-50 disabled:opacity-60"
      >
        {pending ? "Opening…" : "Open the scrapbook"}
      </button>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
