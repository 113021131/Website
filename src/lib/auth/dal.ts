import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export type AdminRole = Enums<"admin_role">;

export type AdminIdentity = {
  userId: string;
  email: string;
  role: AdminRole;
};

/**
 * Who is making this request, if they are an active admin.
 * `admin_users` is only readable by admins under RLS, so a signed-in user who is
 * not on the allowlist simply gets no row back.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("email, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  return { userId: user.id, email: data.email, role: data.role };
});

/**
 * Call at the top of every admin page and every admin Server Action.
 * Pass "owner" for owner-only screens (store settings, staff list).
 */
export async function requireAdmin(minimumRole: AdminRole = "staff"): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?alasan=akses");
  if (minimumRole === "owner" && admin.role !== "owner") redirect("/admin?alasan=khusus-pemilik");
  return admin;
}
