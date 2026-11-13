import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

/**
 * First line of defence for /admin: refresh the Supabase session cookie and
 * send visitors without a session to the login page.
 *
 * This is an optimistic check only. Every admin page and Server Action calls
 * requireAdmin() again, and the database enforces RLS regardless.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isOpenAdminPath = pathname === "/admin/login" || pathname.startsWith("/admin/auth/");

  const redirectToLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (!supabaseUrl || !supabasePublishableKey) {
    return isOpenAdminPath ? NextResponse.next({ request }) : redirectToLogin();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isOpenAdminPath) {
    return redirectToLogin();
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
