import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { autenticar, exigirTecnico } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import usuarioRoutes from "./routes/usuario.js";
import categoriaRoutes from "./routes/categoria.js";
import chamadoRoutes from "./routes/chamado.js";
import atendimentoRoutes from "./routes/atendimento.js";
import paginasRoutes from "./routes/paginas.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.use("/assets", express.static(path.join(raiz, "../../frontend/assets")));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", autenticar, usuarioRoutes);
app.use("/api/categorias", autenticar, categoriaRoutes);
app.use("/api/chamados", autenticar, chamadoRoutes);
app.use("/api/atendimento", autenticar, exigirTecnico, atendimentoRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ status: false, mensagem: "Rota não encontrada." });
});

app.use(paginasRoutes);

app.use((req, res) => {
  res.redirect("/");
});

app.use((erro, req, res, next) => {
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ status: false, mensagem: "Corpo da requisição inválido." });
  }
  console.error(erro);
  res.status(500).json({ status: false, mensagem: "Erro interno do servidor." });
});

export default app;
