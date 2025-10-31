// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      position: string;
      roleId: string;
      roleName: string;
      permissions: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    position: string;
    roleId: string;
    roleName: string;
    permissions: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    position: string;
    roleId: string;
    roleName: string;
    permissions: string;
  }
}
