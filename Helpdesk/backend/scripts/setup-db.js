import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../src/config/env.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const arquivo = path.join(raiz, "../src/config/helpdesk_db.sql");

const { database, ...conexao } = config.db;
const script = await readFile(arquivo, "utf8");

const cliente = await mysql.createConnection({ ...conexao, multipleStatements: true });
try {
  await cliente.query(script);
  console.log("Banco " + database + " criado e populado com sucesso.");
} finally {
  await cliente.end();
}
