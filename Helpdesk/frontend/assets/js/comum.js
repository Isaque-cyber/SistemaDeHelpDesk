const ROTULOS_PERFIL = { Solicitante: "Solicitante", Tecnico: "Técnico" };
const ROTULOS_PRIORIDADE = { Baixa: "Baixa", Media: "Média", Alta: "Alta" };

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

export async function api(url, { method = "GET", corpo } = {}) {
  const opcoes = { method, headers: {}, credentials: "same-origin" };
  if (corpo !== undefined) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(corpo);
  }

  let resposta;
  try {
    resposta = await fetch(url, opcoes);
  } catch {
    throw new ErroApi("Não foi possível conectar ao servidor.", 0);
  }

  const dados = await resposta.json().catch(() => ({}));

  if (resposta.status === 401 && !url.startsWith("/api/auth/")) {
    window.location.replace("/login");
    throw new ErroApi(dados.mensagem || "Sessão expirada.", 401);
  }

  if (!resposta.ok) {
    throw new ErroApi(dados.mensagem || "Ocorreu um erro inesperado.", resposta.status);
  }

  return dados;
}

export const rotuloPerfil = (perfil) => ROTULOS_PERFIL[perfil] ?? perfil;
export const rotuloPrioridade = (prioridade) => ROTULOS_PRIORIDADE[prioridade] ?? prioridade;

export const esc = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

export const formatarData = (valor) =>
  new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const paraCampoDataHora = (data = new Date()) => {
  const deslocamento = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - deslocamento).toISOString().slice(0, 19);
};

export const seloStatus = (status) => {
  const classe =
    status === "Aberto" ? "selo-aberto" : status === "Finalizado" ? "selo-finalizado" : "selo-atendimento";
  return `<span class="selo ${classe}">${esc(status)}</span>`;
};

export const seloPrioridade = (prioridade) =>
  `<span class="selo selo-${esc(String(prioridade).toLowerCase())}">${esc(rotuloPrioridade(prioridade))}</span>`;

let areaToasts;

export function toast(mensagem, tipo = "sucesso") {
  if (!areaToasts) {
    areaToasts = document.createElement("div");
    areaToasts.className = "toasts";
    areaToasts.setAttribute("role", "status");
    document.body.appendChild(areaToasts);
  }
  const item = document.createElement("div");
  item.className = "toast toast-" + tipo;
  item.textContent = mensagem;
  areaToasts.appendChild(item);
  setTimeout(() => item.remove(), 4500);
}

export function mostrarAlerta(elemento, mensagem, tipo = "erro") {
  elemento.textContent = mensagem;
  elemento.className = "alerta alerta-" + tipo;
  elemento.hidden = false;
}

export function ocultarAlerta(elemento) {
  elemento.hidden = true;
  elemento.textContent = "";
}

export async function iniciarPagina() {
  window.addEventListener("pageshow", (evento) => {
    if (evento.persisted) window.location.reload();
  });

  const { usuario } = await api("/api/usuarios/me");

  document.getElementById("usuarioNome").textContent = usuario.nome;
  document.getElementById("usuarioPerfil").textContent = rotuloPerfil(usuario.perfil);

  document.getElementById("btnSair").addEventListener("click", async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  });

  return usuario;
}

export function ligarDialogos() {
  document.querySelectorAll("dialog").forEach((dialogo) => {
    dialogo.addEventListener("click", (evento) => {
      if (evento.target.closest("[data-fechar]")) dialogo.close();
    });
  });
}
