import {
  api,
  iniciarPagina,
  toast,
  esc,
  formatarData,
  paraCampoDataHora,
  seloStatus,
  seloPrioridade,
  mostrarAlerta,
  ocultarAlerta,
} from "./comum.js";

await iniciarPagina();

const fila = document.getElementById("fila");
const filaVazia = document.getElementById("filaVazia");
const contagem = document.getElementById("contagem");
const painelTitulo = document.getElementById("painelTitulo");
const painelVazio = document.getElementById("painelVazio");
const painelCorpo = document.getElementById("painelCorpo");
const detalhes = document.getElementById("detalhes");
const alerta = document.getElementById("alertaAtendimento");
const formAtendimento = document.getElementById("formAtendimento");
const campoObservacao = document.getElementById("observacao");
const campoSolucao = document.getElementById("solucao");
const campoDataHora = document.getElementById("dataHora");
const botoes = [
  document.getElementById("btnAssumir"),
  document.getElementById("btnRegistrar"),
  document.getElementById("btnFinalizar"),
];

let chamados = [];
let selecionadoId = null;

const alternarBotoes = (desabilitar) => botoes.forEach((b) => (b.disabled = desabilitar));

function desenharFila() {
  filaVazia.hidden = chamados.length > 0;
  contagem.textContent = chamados.length ? "(" + chamados.length + ")" : "";
  fila.innerHTML = chamados
    .map(
      (c) => `
      <li>
        <button type="button" class="fila-item ${c.id === selecionadoId ? "ativo" : ""}" data-id="${c.id}">
          <span class="fila-topo">
            <span class="fila-assunto">#${c.id} · ${esc(c.assunto)}</span>
            ${seloStatus(c.status)}
          </span>
          <span class="fila-meta">
            <span>${formatarData(c.data_abertura)}</span>
            <span>${esc(c.categoria)}</span>
            <span>Prioridade: ${seloPrioridade(c.prioridade)}</span>
            <span>Técnico: ${c.tecnico ? esc(c.tecnico) : "—"}</span>
          </span>
        </button>
      </li>`
    )
    .join("");
}

async function carregarFila() {
  const dados = await api("/api/atendimento/chamados");
  chamados = dados.chamados;
  desenharFila();
}

function limparFormulario() {
  campoObservacao.value = "";
  campoSolucao.value = "";
  campoDataHora.value = paraCampoDataHora();
}

async function selecionar(id) {
  const { chamado, historico } = await api("/api/chamados/" + id);
  selecionadoId = chamado.id;
  ocultarAlerta(alerta);
  painelTitulo.textContent = "Chamado #" + chamado.id;
  painelVazio.hidden = true;
  painelCorpo.hidden = false;

  detalhes.innerHTML = `
    <dl class="detalhes">
      <div class="largo"><dt>Assunto</dt><dd><strong>${esc(chamado.assunto)}</strong></dd></div>
      <div class="largo"><dt>Descrição</dt><dd class="texto-longo">${esc(chamado.descricao)}</dd></div>
      <div><dt>Categoria</dt><dd>${esc(chamado.categoria)}</dd></div>
      <div><dt>Prioridade</dt><dd>${seloPrioridade(chamado.prioridade)}</dd></div>
      <div><dt>Status</dt><dd>${seloStatus(chamado.status)}</dd></div>
      <div><dt>Abertura</dt><dd>${formatarData(chamado.data_abertura)}</dd></div>
      <div><dt>Solicitante</dt><dd>${esc(chamado.solicitante)}</dd></div>
      <div><dt>Técnico responsável</dt><dd>${chamado.tecnico ? esc(chamado.tecnico) : "Ainda não atribuído"}</dd></div>
    </dl>
    <h3 class="subtitulo">Histórico de atendimento</h3>
    ${
      historico.length
        ? `<ul class="linha-tempo">${historico
            .map(
              (h) => `
          <li class="${h.status_resultante === "Finalizado" ? "fim" : ""}">
            <div class="meta"><strong>${esc(h.tecnico)}</strong><span>${formatarData(h.data_hora)}</span>${seloStatus(h.status_resultante)}</div>
            <p>${esc(h.observacao)}</p>
          </li>`
            )
            .join("")}</ul>`
        : '<p class="vazio">Nenhum registro de atendimento até o momento.</p>'
    }`;

  limparFormulario();
  desenharFila();
}

async function executar(tarefa, aoConcluir) {
  if (selecionadoId === null) return;
  ocultarAlerta(alerta);
  alternarBotoes(true);
  try {
    const resposta = await tarefa();
    toast(resposta.mensagem, "sucesso");
    await aoConcluir();
  } catch (erro) {
    mostrarAlerta(alerta, erro.message);
  } finally {
    alternarBotoes(false);
  }
}

async function atualizarTela() {
  await carregarFila();
  await selecionar(selecionadoId);
}

function montarCorpoRegistro(finalizar) {
  const dataHora = campoDataHora.value ? new Date(campoDataHora.value) : null;
  return {
    observacao: campoObservacao.value.trim(),
    solucao: campoSolucao.value.trim(),
    data_hora: dataHora && !Number.isNaN(dataHora.getTime()) ? dataHora.toISOString() : null,
    finalizar,
  };
}

fila.addEventListener("click", async (evento) => {
  const item = evento.target.closest("button[data-id]");
  if (!item) return;
  try {
    await selecionar(Number(item.dataset.id));
  } catch (erro) {
    toast(erro.message, "erro");
  }
});

document.getElementById("btnAssumir").addEventListener("click", () =>
  executar(
    () => api("/api/atendimento/chamados/" + selecionadoId + "/assumir", { method: "POST" }),
    atualizarTela
  )
);

formAtendimento.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!campoObservacao.value.trim() && !campoSolucao.value.trim()) {
    mostrarAlerta(alerta, "Informe a observação do atendimento.");
    campoObservacao.focus();
    return;
  }
  executar(
    () =>
      api("/api/atendimento/chamados/" + selecionadoId + "/registros", {
        method: "POST",
        corpo: montarCorpoRegistro(false),
      }),
    atualizarTela
  );
});

document.getElementById("btnFinalizar").addEventListener("click", () => {
  if (!campoSolucao.value.trim()) {
    mostrarAlerta(alerta, "Informe a descrição da solução para finalizar o chamado.");
    campoSolucao.focus();
    return;
  }
  executar(
    () =>
      api("/api/atendimento/chamados/" + selecionadoId + "/registros", {
        method: "POST",
        corpo: montarCorpoRegistro(true),
      }),
    atualizarTela
  );
});

try {
  await carregarFila();
} catch (erro) {
  toast(erro.message, "erro");
}
