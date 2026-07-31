import { pool } from "@workspace/db";

const client = await pool.connect();
const { rows } = await client.query(
  "SELECT id, email, name, is_active, created_at FROM admins ORDER BY created_at"
);
console.log("Admins in DB:");
console.log(JSON.stringify(rows, null, 2));
client.release();
await pool.end();
