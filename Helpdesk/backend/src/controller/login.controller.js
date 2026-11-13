import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import db from "../config/db.js";
import { criarSessao, encerrarSessao } from "../middleware/auth.js";

export const autenticacao = async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const senha = String(req.body?.senha ?? "");

  if (!email || !senha) {
    return res
      .status(400)
      .json({ status: false, mensagem: "Informe o e-mail e a senha." });
  }

  const [linhas] = await db.query(
    "SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = ?",
    [email]
  );
  const usuario = linhas[0];
  const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;

  if (!senhaConfere) {
    return res.status(401).json({ status: false, mensagem: "E-mail ou senha inválidos" });
  }

  criarSessao(res, usuario.id, randomUUID());

  return res.json({
    status: true,
    usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
  });
};

export const logout = (req, res) => {
  encerrarSessao(req, res);
  return res.json({ status: true, mensagem: "Sessão encerrada." });
};
