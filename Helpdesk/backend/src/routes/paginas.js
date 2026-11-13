import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { obterSessao } from "../middleware/auth.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const pasta = path.join(raiz, "../../../frontend/pages");

const enviar = (res, arquivo) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(pasta, arquivo));
};

const router = Router();

router.get("/login", async (req, res) => {
  if (await obterSessao(req)) return res.redirect("/");
  enviar(res, "login.html");
});

router.get("/", async (req, res) => {
  if (!(await obterSessao(req))) return res.redirect("/login");
  enviar(res, "index.html");
});

router.get("/chamados", async (req, res) => {
  if (!(await obterSessao(req))) return res.redirect("/login");
  enviar(res, "chamados.html");
});

router.get("/atendimento", async (req, res) => {
  const usuario = await obterSessao(req);
  if (!usuario) return res.redirect("/login");
  if (usuario.perfil !== "Tecnico") return res.redirect("/");
  enviar(res, "atendimento.html");
});

export default router;
