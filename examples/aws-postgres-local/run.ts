import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  database: "postgres",
});

handler();

async function handler() {
  const client = await pool.connect();
  const result = await client.query("SELECT NOW()");
  client.release();

  console.log(result.rows[0].now);
  process.exit(0);
}
