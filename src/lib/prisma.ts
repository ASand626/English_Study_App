import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7's client generator has no built-in engine — it always needs an
// explicit driver adapter to actually reach Postgres.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse the client across hot-reloads in dev so we don't exhaust Postgres
// connections every time a module is re-evaluated.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
