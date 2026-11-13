import db from "../config/db.js";
import { SELECT_CHAMADO, normalizarChamado, idValido } from "../utils/consultas.js";
import { ordenarPorAbertura } from "../utils/ordenacao.js";
import { agoraSemMilissegundos } from "../utils/tempo.js";

const LIMITE_TEXTO = 5000;

const falha = (status, mensagem) => ({ status, mensagem });

const executarEmTransacao = async (tarefa) => {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await tarefa(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
};

const bloquearChamado = async (conexao, id) => {
  const [linhas] = await conexao.query("SELECT * FROM chamados WHERE id = ? FOR UPDATE", [id]);
  return linhas[0] ?? null;
};

const responderFalha = (res, erro) =>
  res.status(erro.status).json({ status: false, mensagem: erro.mensagem });

export const listarFila = async (req, res) => {
  const [linhas] = await db.query(SELECT_CHAMADO);
  const ordenados = ordenarPorAbertura(linhas.map(normalizarChamado));
  return res.json({ status: true, chamados: ordenados });
};

export const assumirChamado = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ status: false, mensagem: "Número de chamado inválido." });

  try {
    await executarEmTransacao(async (conexao) => {
      const chamado = await bloquearChamado(conexao, id);
      if (!chamado) throw falha(404, "Chamado não encontrado.");
      if (chamado.status === "Finalizado") {
        throw falha(409, "Este chamado já foi finalizado e não pode ser alterado.");
      }
      if (chamado.tecnico_id !== null) {
        throw falha(409, "Este chamado já possui um técnico responsável.");
      }
      if (chamado.status !== "Aberto") {
        throw falha(409, "Somente chamados com status Aberto podem ser assumidos.");
      }

      await conexao.query(
        "UPDATE chamados SET tecnico_id = ?, status = 'Em atendimento' WHERE id = ?",
        [req.usuario.id, id]
      );
      await conexao.query(
        `INSERT INTO historico_atendimentos
           (chamado_id, tecnico_id, data_hora, observacao, status_resultante)
         VALUES (?, ?, ?, ?, 'Em atendimento')`,
        [id, req.usuario.id, agoraSemMilissegundos(), "Chamado assumido pelo técnico."]
      );
    });
  } catch (erro) {
    if (erro.status) return responderFalha(res, erro);
    throw erro;
  }

  return res.json({ status: true, mensagem: "Chamado assumido com sucesso." });
};

export const registrarAtendimento = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ status: false, mensagem: "Número de chamado inválido." });

  const observacao = String(req.body?.observacao ?? "").trim();
  const solucao = String(req.body?.solucao ?? "").trim();
  const finalizar = req.body?.finalizar === true;
  const dataInformada = req.body?.data_hora;

  try {
    const status = await executarEmTransacao(async (conexao) => {
      const chamado = await bloquearChamado(conexao, id);
      if (!chamado) throw falha(404, "Chamado não encontrado.");
      if (chamado.status === "Finalizado") {
        throw falha(409, "Este chamado já foi finalizado e não pode ser alterado.");
      }
      if (chamado.tecnico_id === null) {
        throw falha(409, "Assuma o chamado antes de registrar o atendimento.");
      }
      if (chamado.tecnico_id !== req.usuario.id) {
        throw falha(403, "Apenas o técnico responsável pode atualizar este atendimento.");
      }

      if (finalizar && !solucao) {
        throw falha(400, "Informe a descrição da solução para finalizar o chamado.");
      }
      if (!finalizar && !observacao && !solucao) {
        throw falha(400, "Informe a observação do atendimento.");
      }
      if (observacao.length > LIMITE_TEXTO || solucao.length > LIMITE_TEXTO) {
        throw falha(400, "Os textos devem ter no máximo 5000 caracteres.");
      }

      const agora = new Date();
      let dataHora = agoraSemMilissegundos();
      if (dataInformada !== undefined && dataInformada !== null && dataInformada !== "") {
        dataHora = new Date(dataInformada);
        if (Number.isNaN(dataHora.getTime())) {
          throw falha(400, "Data e hora do atendimento inválidas.");
        }
      }
      if (dataHora.getTime() < new Date(chamado.data_abertura).getTime()) {
        throw falha(400, "A data e hora do atendimento não podem ser anteriores à abertura do chamado.");
      }
      if (dataHora.getTime() > agora.getTime()) {
        throw falha(400, "A data e hora do atendimento não podem ser posteriores ao momento atual.");
      }

      const partes = [];
      if (observacao) partes.push(observacao);
      if (solucao) partes.push("Solução: " + solucao);
      const texto = partes.join("\n");
      const novoStatus = finalizar ? "Finalizado" : "Em atendimento";

      await conexao.query("UPDATE chamados SET status = ? WHERE id = ?", [novoStatus, id]);
      await conexao.query(
        `INSERT INTO historico_atendimentos
           (chamado_id, tecnico_id, data_hora, observacao, status_resultante)
         VALUES (?, ?, ?, ?, ?)`,
        [id, req.usuario.id, dataHora, texto, novoStatus]
      );

      return novoStatus;
    });

    return res.json({
      status: true,
      mensagem: status === "Finalizado" ? "Chamado finalizado com sucesso." : "Atendimento registrado com sucesso.",
    });
  } catch (erro) {
    if (erro.status) return responderFalha(res, erro);
    throw erro;
  }
};
