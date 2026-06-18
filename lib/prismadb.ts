import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// During Next.js build there is no DATABASE_URL — return a no-op proxy so
// static analysis doesn't throw. Real requests always have the env set.
const createClient = () => {
  if (!process.env.DATABASE_URL) {
    // Return a Proxy that silently swallows any method call at build time.
    return new Proxy({} as PrismaClient, {
      get: () =>
        new Proxy(() => Promise.resolve(null), {
          get: () => () => Promise.resolve(null),
          apply: () => Promise.resolve(null),
        }),
    });
  }
  return new PrismaClient();
};

const prismadb: PrismaClient = globalThis.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prismadb;

export default prismadb;
