import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { usersTable } from "./db/schema";

export const db = drizzle(process.env.DATABASE_URL!);



async function main() {}

main();
