import { redirect } from "next/navigation";

/**
 * A memorable admin entry point: middleware sends visitors to /login first (and back here after),
 * so by the time this runs you're logged in and land on the map in admin mode.
 */
export default function AdminPage() {
  redirect("/");
}
