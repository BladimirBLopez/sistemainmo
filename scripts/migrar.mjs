import { Pool } from "@neondatabase/serverless";
import fs from "node:fs";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(fs.readFileSync(process.argv[2], "utf8"));
await pool.end();
console.log("OK:", process.argv[2]);
