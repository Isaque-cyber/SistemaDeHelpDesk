import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { config } from "../config/env.js";

const NOME_COOKIE = "token";
const tokensRevogados = new Map();

const limparRevogados = () => {
  const agora = Date.now();
  for (const [jti, expira] of tokensRevogados) {
    if (expira <= agora) tokensRevogados.delete(jti);
  }
};

export const lerCookie = (req, nome) => {
  const cabecalho = req.headers.cookie;
  if (!cabecalho) return null;
  for (const parte of cabecalho.split(";")) {
    const indice = parte.indexOf("=");
    if (indice === -1) continue;
    if (parte.slice(0, indice).trim() === nome) {
      try {
        return decodeURIComponent(parte.slice(indice + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const criarSessao = (res, usuarioId, jti) => {
  const token = jwt.sign({ id: usuarioId, jti }, config.jwtSegredo, {
    expiresIn: config.sessaoHoras + "h",
  });
  res.cookie(NOME_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: config.sessaoHoras * 60 * 60 * 1000,
    path: "/",
  });
};

export const encerrarSessao = (req, res) => {
  const token = lerCookie(req, NOME_COOKIE);
  if (token) {
    const dados = jwt.decode(token);
    if (dados?.jti && dados?.exp) {
      limparRevogados();
      tokensRevogados.set(dados.jti, dados.exp * 1000);
    }
  }
  res.clearCookie(NOME_COOKIE, { path: "/" });
};

export const obterSessao = async (req) => {
  const token = lerCookie(req, NOME_COOKIE);
  if (!token) return null;
  let dados;
  try {
    dados = jwt.verify(token, config.jwtSegredo);
  } catch {
    return null;
  }
  if (!dados.jti || tokensRevogados.has(dados.jti)) return null;
  const [linhas] = await db.query(
    "SELECT id, nome, email, perfil FROM usuarios WHERE id = ?",
    [dados.id]
  );
  return linhas[0] ?? null;
};

export const autenticar = async (req, res, next) => {
  const usuario = await obterSessao(req);
  if (!usuario) {
    return res
      .status(401)
      .json({ status: false, mensagem: "Sessão inválida ou expirada. Faça login novamente." });
  }
  req.usuario = usuario;
  next();
};

export const exigirTecnico = (req, res, next) => {
  if (req.usuario?.perfil !== "Tecnico") {
    return res
      .status(403)
      .json({ status: false, mensagem: "Acesso permitido apenas para usuários com perfil Técnico." });
  }
  next();
};
