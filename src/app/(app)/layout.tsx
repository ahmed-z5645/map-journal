import { Suspense } from "react";
import { countDrafts, listPeopleWithCounts } from "@/db/queries";
import { isAdmin } from "@/lib/session";
import { AppMenu } from "./app-menu";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const [drafts, people] = await Promise.all([admin ? countDrafts() : 0, listPeopleWithCounts()]);
  return (
    <div className="h-dvh">
      <main className="h-full overflow-y-auto">{children}</main>
      <Suspense>
        <AppMenu admin={admin} drafts={drafts} people={people} />
      </Suspense>
    </div>
  );
}
