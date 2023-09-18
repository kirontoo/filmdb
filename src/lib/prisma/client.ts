import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const client =
  globalThis.prisma ||
  new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "info",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });
if (process.env.NODE_ENV !== "production") globalThis.prisma = client;

export default client;
