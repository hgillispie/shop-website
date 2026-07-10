import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add a Postgres connection string to .env.local.",
    );
  }
  return drizzle(neon(url), { schema });
}

let cached: Db | null = null;

// Lazy so importing this module (e.g. during build-time page-data collection)
// never throws — only an actual query does, and only once DATABASE_URL is required.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!cached) cached = createDb();
    return Reflect.get(cached as object, prop, receiver);
  },
});
