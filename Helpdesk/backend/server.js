import app from "./app.js";
import db from "./config/db.js";
import { config } from "./config/env.js";

try {
  await db.query("SELECT 1");
} catch (erro) {
  console.error("Não foi possível conectar ao banco de dados: " + erro.message);
  process.exit(1);
}

app.listen(config.porta, () => {
  console.log("Servidor rodando na porta " + config.porta + " => http://localhost:" + config.porta);
});
