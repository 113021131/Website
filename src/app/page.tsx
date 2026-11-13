import { redirect } from "next/navigation";

/**
 * Phase 0: the real home page is built in Phase 1 from the hero direction the
 * owner picks. Until then "/" opens the prototype picker.
 */
export default function HomePage() {
  redirect("/prototypes/hero");
}
