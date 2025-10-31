// middleware.ts (Root level)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Jika sudah login dan akses /login, redirect ke dashboard
    if (pathname === "/" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Cek permission
    if (token && pathname !== "/") {
      const permissions = JSON.parse((token.permissions as string) || "[]");
      const method = req.method;

      // Map HTTP method ke access type
      const accessMap: { [key: string]: string } = {
        GET: "read",
        POST: "write",
        PUT: "update",
        PATCH: "update",
        DELETE: "delete",
      };

      const requiredAccess = accessMap[method] || "read";

      // Cek permission
      const hasPermission = permissions.some((perm: any) => {
        const pathMatch = pathname.startsWith(perm.path);
        const hasAccess = perm.access.includes(requiredAccess);
        return pathMatch && hasAccess;
      });

      // Jika tidak ada permission dan bukan halaman dashboard
      if (
        !hasPermission &&
        pathname !== "/dashboard" &&
        pathname !== "/unauthorized"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Izinkan akses ke /login tanpa token
        if (req.nextUrl.pathname === "/") {
          return true;
        }
        // Untuk route lain, harus ada token
        return !!token;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/simulasi/:path*",
    "/roles/:path*",
    "/users/:path*",
    "/produk/:path*",
    "/pengajuan/:path*",
    "/debitur/:path*",
    "/angsuran/:path*",
    "/api/roles/:path*",
    "/api/users/:path*",
    "/api/produk/:path*",
    "/api/dapem/:path*",
    "/api/debitur/:path*",
    "/api/jadwal-angsuran/:path*",
    "/",
  ],
};
