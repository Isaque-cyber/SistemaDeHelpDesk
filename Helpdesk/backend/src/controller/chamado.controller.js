import db from "../config/db.js";
import { agoraSemMilissegundos } from "../utils/tempo.js";
import {
  SELECT_CHAMADO,
  SELECT_HISTORICO,
  normalizarChamado,
  idValido,
} from "../utils/consultas.js";

const PRIORIDADES = ["Baixa", "Media", "Alta"];
const STATUS = ["Aberto", "Em atendimento", "Finalizado"];

const validarDados = async (corpo) => {
  const assunto = String(corpo?.assunto ?? "").trim();
  const descricao = String(corpo?.descricao ?? "").trim();
  const prioridade = String(corpo?.prioridade ?? "").trim();
  const categoriaId = idValido(corpo?.categoria_id);

  if (!assunto) return { erro: "O campo assunto é obrigatório." };
  if (assunto.length > 150) return { erro: "O assunto deve ter no máximo 150 caracteres." };
  if (!descricao) return { erro: "O campo descrição é obrigatório." };
  if (descricao.length > 5000) return { erro: "A descrição deve ter no máximo 5000 caracteres." };
  if (!categoriaId) return { erro: "Selecione uma categoria." };
  if (!prioridade) return { erro: "Selecione a prioridade." };
  if (!PRIORIDADES.includes(prioridade)) {
    return { erro: "Prioridade inválida. Use Baixa, Média ou Alta." };
  }

  const [categorias] = await db.query("SELECT id FROM categorias WHERE id = ?", [categoriaId]);
  if (categorias.length === 0) return { erro: "Categoria inválida." };

  return { dados: { assunto, descricao, prioridade, categoriaId } };
};

const buscarPorId = async (id) => {
  const [linhas] = await db.query(SELECT_CHAMADO + " WHERE c.id = ?", [id]);
  return linhas[0] ? normalizarChamado(linhas[0]) : null;
};

export const abrirChamado = async (req, res) => {
  const { erro, dados } = await validarDados(req.body);
  if (erro) return res.status(400).json({ status: false, mensagem: erro });

  const [resultado] = await db.query(
    `INSERT INTO chamados
       (assunto, descricao, categoria_id, prioridade, solicitante_id, tecnico_id, data_abertura, status)
     VALUES (?, ?, ?, ?, ?, NULL, ?, 'Aberto')`,
    [dados.assunto, dados.descricao, dados.categoriaId, dados.prioridade, req.usuario.id, agoraSemMilissegundos()]
  );

  const chamado = await buscarPorId(resultado.insertId);
  return res
    .status(201)
    .json({ status: true, mensagem: "Chamado aberto com sucesso.", chamado });
};

export const listarChamados = async (req, res) => {
  const filtros = [];
  const parametros = [];

  if (req.usuario.perfil !== "Tecnico") {
    filtros.push("c.solicitante_id = ?");
    parametros.push(req.usuario.id);
  }

  const busca = String(req.query.busca ?? "").trim();
  if (busca) {
    const termo = "%" + busca.replace(/[\\%_]/g, "\\$&") + "%";
    if (/^\d+$/.test(busca)) {
      filtros.push("(c.id = ? OR c.assunto LIKE ?)");
      parametros.push(Number(busca), termo);
    } else {
      filtros.push("c.assunto LIKE ?");
      parametros.push(termo);
    }
  }

  const where = filtros.length ? " WHERE " + filtros.join(" AND ") : "";
  const [linhas] = await db.query(
    SELECT_CHAMADO + where + " ORDER BY c.data_abertura DESC, c.id DESC",
    parametros
  );

  return res.json({ status: true, chamados: linhas.map(normalizarChamado) });
};

export const resumoChamados = async (req, res) => {
  const parametros = [];
  let where = "";
  if (req.usuario.perfil !== "Tecnico") {
    where = " WHERE solicitante_id = ?";
    parametros.push(req.usuario.id);
  }

  const [linhas] = await db.query(
    "SELECT status, COUNT(*) AS total FROM chamados" + where + " GROUP BY status",
    parametros
  );

  const resumo = Object.fromEntries(STATUS.map((status) => [status, 0]));
  for (const linha of linhas) resumo[linha.status] = Number(linha.total);

  return res.json({ status: true, resumo });
};

export const detalharChamado = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ status: false, mensagem: "Número de chamado inválido." });

  const chamado = await buscarPorId(id);
  if (!chamado) return res.status(404).json({ status: false, mensagem: "Chamado não encontrado." });

  if (req.usuario.perfil !== "Tecnico" && chamado.solicitante_id !== req.usuario.id) {
    return res
      .status(403)
      .json({ status: false, mensagem: "Você não tem permissão para visualizar este chamado." });
  }

  const [historico] = await db.query(SELECT_HISTORICO, [id]);
  return res.json({ status: true, chamado, historico });
};

export const alterarChamado = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ status: false, mensagem: "Número de chamado inválido." });

  const chamado = await buscarPorId(id);
  if (!chamado) return res.status(404).json({ status: false, mensagem: "Chamado não encontrado." });

  if (chamado.solicitante_id !== req.usuario.id) {
    return res
      .status(403)
      .json({ status: false, mensagem: "Você só pode editar os seus próprios chamados." });
  }
  if (chamado.status !== "Aberto") {
    return res
      .status(409)
      .json({ status: false, mensagem: "Só é possível editar chamados com status Aberto." });
  }

  const { erro, dados } = await validarDados(req.body);
  if (erro) return res.status(400).json({ status: false, mensagem: erro });

  const [resultado] = await db.query(
    `UPDATE chamados
        SET assunto = ?, descricao = ?, categoria_id = ?, prioridade = ?
      WHERE id = ? AND solicitante_id = ? AND status = 'Aberto'`,
    [dados.assunto, dados.descricao, dados.categoriaId, dados.prioridade, id, req.usuario.id]
  );

  if (resultado.affectedRows === 0) {
    return res
      .status(409)
      .json({ status: false, mensagem: "Não foi possível alterar o chamado. Atualize a página e tente novamente." });
  }

  return res.json({
    status: true,
    mensagem: "Chamado atualizado com sucesso.",
    chamado: await buscarPorId(id),
  });
};

export const excluirChamado = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ status: false, mensagem: "Número de chamado inválido." });

  const chamado = await buscarPorId(id);
  if (!chamado) return res.status(404).json({ status: false, mensagem: "Chamado não encontrado." });

  if (chamado.solicitante_id !== req.usuario.id) {
    return res
      .status(403)
      .json({ status: false, mensagem: "Você só pode excluir os seus próprios chamados." });
  }
  if (chamado.status !== "Aberto") {
    return res
      .status(409)
      .json({ status: false, mensagem: "Só é possível excluir chamados com status Aberto." });
  }
  if (chamado.total_historico > 0) {
    return res
      .status(409)
      .json({ status: false, mensagem: "Não é possível excluir um chamado que já possui registros de atendimento." });
  }

  const [resultado] = await db.query(
    `DELETE FROM chamados
      WHERE id = ? AND solicitante_id = ? AND status = 'Aberto'
        AND NOT EXISTS (SELECT 1 FROM historico_atendimentos h WHERE h.chamado_id = ?)`,
    [id, req.usuario.id, id]
  );

  if (resultado.affectedRows === 0) {
    return res
      .status(409)
      .json({ status: false, mensagem: "Não foi possível excluir o chamado. Atualize a página e tente novamente." });
  }

  return res.json({ status: true, mensagem: "Chamado excluído com sucesso." });
};
