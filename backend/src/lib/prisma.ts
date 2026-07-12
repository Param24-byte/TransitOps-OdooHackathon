// src/lib/prisma.ts
// Singleton Prisma client instance with PostgreSQL driver adapter.
//
// WHY a driver adapter? Prisma 7 no longer bundles its own database driver.
// Instead, it uses the native `pg` (node-postgres) driver via an adapter.
// This gives us full control over the connection pool and removes the
// Rust-based query engine, making the build lighter and faster.
//
// WHY a singleton? If we create a new PrismaClient in every service file,
// each one opens a NEW connection pool. That quickly exhausts PostgreSQL's
// connection limit (default: 100). By exporting one instance, all services
// share a single pool.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// The connection string comes from our .env file
const connectionString = process.env.DATABASE_URL!;

// Create the PostgreSQL adapter — this is the actual database driver
const adapter = new PrismaPg({ connectionString });

// Pass the adapter to PrismaClient (required in Prisma 7)
const prisma = new PrismaClient({ adapter });

export default prisma;
