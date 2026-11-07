import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const dsn = process.env.DATABASE_URL;
if (!dsn) throw new Error("DATABASE_URL is required for db:migrate");
const connection = await mysql.createConnection(dsn);
await connection.execute(`CREATE TABLE IF NOT EXISTS _manus_migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
const dir = path.resolve("db/migrations");
const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  const [rows] = await connection.query<mysql.RowDataPacket[]>("SELECT name FROM _manus_migrations WHERE name = ?", [file]);
  if (rows.length) continue;
  const sql = await fs.readFile(path.join(dir, file), "utf8");
  const statements = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  await connection.beginTransaction();
  try {
    for (const statement of statements) await connection.query(statement);
    await connection.query("INSERT INTO _manus_migrations (name) VALUES (?)", [file]);
    await connection.commit();
    console.log(`Applied ${file}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
await connection.end();
console.log("Database migrations complete. Data import remains a separate approved step.");
