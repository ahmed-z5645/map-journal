import { LoginForm } from "./login-form";
import { SITE_NAME } from "@/lib/site";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <h1 className="font-hand text-4xl">{SITE_NAME}</h1>
      <LoginForm next={next} />
    </main>
  );
}
