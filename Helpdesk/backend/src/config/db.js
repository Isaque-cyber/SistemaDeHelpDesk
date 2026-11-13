import mysql from "mysql2/promise";
import { config } from "./env.js";

const db = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "local",
});

export default db;
