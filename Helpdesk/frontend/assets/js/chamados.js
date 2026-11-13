import {
  api,
  iniciarPagina,
  ligarDialogos,
  toast,
  esc,
  formatarData,
  seloStatus,
  seloPrioridade,
  mostrarAlerta,
  ocultarAlerta,
} from "./comum.js";

const usuario = await iniciarPagina();
const ehTecnico = usuario.perfil === "Tecnico";

const corpoTabela = document.getElementById("corpoTabela");
const vazio = document.getElementById("vazio");
const contagem = document.getElementById("contagem");
const campoBusca = document.getElementById("busca");
const dlgForm = document.getElementById("dlgForm");
const formChamado = document.getElementById("formChamado");
const formAlerta = document.getElementById("formAlerta");
const formTitulo = document.getElementById("formTitulo");
const formSalvar = document.getElementById("formSalvar");
const campoAssunto = document.getElementById("fAssunto");
const campoDescricao = document.getElementById("fDescricao");
const campoCategoria = document.getElementById("fCategoria");
const campoPrioridade = document.getElementById("fPrioridade");
const dlgDetalhes = document.getElementById("dlgDetalhes");
const dlgExcluir = document.getElementById("dlgExcluir");

let chamados = [];
let buscaAtual = "";
let chamadoEmEdicao = null;
let chamadoParaExcluir = null;

ligarDialogos();

document.getElementById("escopo").textContent = ehTecnico
  ? "Todos os chamados cadastrados no sistema."
  : "Chamados abertos por você.";
document.getElementById("thSolicitante").hidden = !ehTecnico;

const podeEditar = (c) => c.solicitante_id === usuario.id && c.status === "Aberto";
const podeExcluir = (c) => podeEditar(c) && c.total_historico === 0;

function desenharTabela() {
  vazio.hidden = chamados.length > 0;
  contagem.textContent =
    chamados.length === 1 ? "1 chamado" : chamados.length + " chamados";

  corpoTabela.innerHTML = chamados
    .map(
      (c) => `
      <tr>
        <td class="col-num">#${c.id}</td>
        <td class="col-assunto">${esc(c.assunto)}</td>
        ${ehTecnico ? `<td>${esc(c.solicitante)}</td>` : ""}
        <td>${esc(c.categoria)}</td>
        <td>${seloPrioridade(c.prioridade)}</td>
        <td class="col-data">${formatarData(c.data_abertura)}</td>
        <td>${seloStatus(c.status)}</td>
        <td class="col-acoes">
          <button class="btn btn-secundario btn-pequeno" data-acao="ver" data-id="${c.id}" type="button">Detalhes</button>
          ${podeEditar(c) ? `<button class="btn btn-secundario btn-pequeno" data-acao="editar" data-id="${c.id}" type="button">Editar</button>` : ""}
          ${podeExcluir(c) ? `<button class="btn btn-perigo btn-pequeno" data-acao="excluir" data-id="${c.id}" type="button">Excluir</button>` : ""}
        </td>
      </tr>`
    )
    .join("");
}

async function carregar() {
  try {
    const parametros = buscaAtual ? "?busca=" + encodeURIComponent(buscaAtual) : "";
    const dados = await api("/api/chamados" + parametros);
    chamados = dados.chamados;
    desenharTabela();
  } catch (erro) {
    toast(erro.message, "erro");
  }
}

async function carregarCategorias() {
  const { categorias } = await api("/api/categorias");
  campoCategoria.innerHTML =
    '<option value="">Selecione</option>' +
    categorias.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("");
}

function limparMarcacoes() {
  formChamado.querySelectorAll(".campo-invalido").forEach((el) => el.classList.remove("campo-invalido"));
  ocultarAlerta(formAlerta);
}

function abrirFormulario(chamado) {
  chamadoEmEdicao = chamado;
  limparMarcacoes();
  formTitulo.textContent = chamado ? "Editar chamado #" + chamado.id : "Novo chamado";
  campoAssunto.value = chamado?.assunto ?? "";
  campoDescricao.value = chamado?.descricao ?? "";
  campoCategoria.value = chamado ? String(chamado.categoria_id) : "";
  campoPrioridade.value = chamado?.prioridade ?? "";
  dlgForm.showModal();
  campoAssunto.focus();
}

function validarFormulario() {
  limparMarcacoes();
  const campos = [
    [campoAssunto, "O campo assunto é obrigatório."],
    [campoDescricao, "O campo descrição é obrigatório."],
    [campoCategoria, "Selecione uma categoria."],
    [campoPrioridade, "Selecione a prioridade."],
  ];

  const mensagens = [];
  for (const [campo, mensagem] of campos) {
    if (!campo.value.trim()) {
      campo.parentElement.classList.add("campo-invalido");
      mensagens.push(mensagem);
    }
  }

  if (mensagens.length) {
    mostrarAlerta(formAlerta, mensagens.join(" "));
    formChamado.querySelector(".campo-invalido input, .campo-invalido textarea, .campo-invalido select").focus();
    return false;
  }
  return true;
}

formChamado.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!validarFormulario()) return;

  const corpo = {
    assunto: campoAssunto.value.trim(),
    descricao: campoDescricao.value.trim(),
    categoria_id: Number(campoCategoria.value),
    prioridade: campoPrioridade.value,
  };

  formSalvar.disabled = true;
  try {
    const resposta = chamadoEmEdicao
      ? await api("/api/chamados/" + chamadoEmEdicao.id, { method: "PUT", corpo })
      : await api("/api/chamados", { method: "POST", corpo });
    dlgForm.close();
    toast(resposta.mensagem, "sucesso");
    await carregar();
  } catch (erro) {
    mostrarAlerta(formAlerta, erro.message);
  } finally {
    formSalvar.disabled = false;
  }
});

async function abrirDetalhes(id) {
  try {
    const { chamado, historico } = await api("/api/chamados/" + id);
    document.getElementById("detTitulo").textContent = "Chamado #" + chamado.id;
    document.getElementById("detCorpo").innerHTML = `
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
    dlgDetalhes.showModal();
  } catch (erro) {
    toast(erro.message, "erro");
  }
}

function pedirExclusao(chamado) {
  chamadoParaExcluir = chamado;
  document.getElementById("excluirTexto").textContent =
    "Deseja realmente excluir o chamado #" + chamado.id + " (" + chamado.assunto + ")? Esta ação não pode ser desfeita.";
  dlgExcluir.showModal();
}

document.getElementById("btnConfirmarExcluir").addEventListener("click", async (evento) => {
  if (!chamadoParaExcluir) return;
  const botao = evento.currentTarget;
  botao.disabled = true;
  try {
    const resposta = await api("/api/chamados/" + chamadoParaExcluir.id, { method: "DELETE" });
    toast(resposta.mensagem, "sucesso");
    dlgExcluir.close();
    await carregar();
  } catch (erro) {
    dlgExcluir.close();
    toast(erro.message, "erro");
    await carregar();
  } finally {
    botao.disabled = false;
    chamadoParaExcluir = null;
  }
});

corpoTabela.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;
  const chamado = chamados.find((c) => c.id === Number(botao.dataset.id));
  if (!chamado) return;

  if (botao.dataset.acao === "ver") abrirDetalhes(chamado.id);
  if (botao.dataset.acao === "editar") abrirFormulario(chamado);
  if (botao.dataset.acao === "excluir") pedirExclusao(chamado);
});

document.getElementById("formBusca").addEventListener("submit", (evento) => {
  evento.preventDefault();
  buscaAtual = campoBusca.value.trim();
  carregar();
});

document.getElementById("btnLimpar").addEventListener("click", () => {
  campoBusca.value = "";
  buscaAtual = "";
  carregar();
});

document.getElementById("btnNovo").addEventListener("click", () => abrirFormulario(null));

await carregarCategorias();
await carregar();
