import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const config = {
  porta: Number(process.env.PORT) || 3000,
  jwtSegredo: process.env.JWT_SECRET || "helpdesk_segredo_local",
  sessaoHoras: 8,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "senai",
    database: process.env.DB_NAME || "helpdesk_db",
  },
};
