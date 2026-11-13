export const SELECT_CHAMADO = `
  SELECT
    c.id,
    c.assunto,
    c.descricao,
    c.categoria_id,
    cat.nome AS categoria,
    c.prioridade,
    c.solicitante_id,
    sol.nome AS solicitante,
    c.tecnico_id,
    tec.nome AS tecnico,
    c.data_abertura,
    c.status,
    (SELECT COUNT(*) FROM historico_atendimentos h WHERE h.chamado_id = c.id) AS total_historico
  FROM chamados c
  JOIN categorias cat ON cat.id = c.categoria_id
  JOIN usuarios sol ON sol.id = c.solicitante_id
  LEFT JOIN usuarios tec ON tec.id = c.tecnico_id
`;

export const SELECT_HISTORICO = `
  SELECT
    h.id,
    h.chamado_id,
    h.tecnico_id,
    u.nome AS tecnico,
    h.data_hora,
    h.observacao,
    h.status_resultante
  FROM historico_atendimentos h
  JOIN usuarios u ON u.id = h.tecnico_id
  WHERE h.chamado_id = ?
  ORDER BY h.data_hora ASC, h.id ASC
`;

export const normalizarChamado = (linha) => ({
  ...linha,
  total_historico: Number(linha.total_historico),
});

export const idValido = (valor) => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
};
