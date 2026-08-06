import { type DefaultSession } from "next-auth";

type AppRole = "DEALER_USER" | "DEALER_ADMIN" | "INTERNAL_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      dealerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    dealerId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    dealerId: string | null;
  }
}
