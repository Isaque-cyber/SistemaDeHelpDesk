import { api, iniciarPagina, toast } from "./comum.js";

const usuario = await iniciarPagina();

document.getElementById("saudacao").textContent = "Olá, " + usuario.nome.split(" ")[0] + "!";
document.getElementById("escopo").textContent =
  usuario.perfil === "Tecnico"
    ? "Resumo de todos os chamados do sistema."
    : "Resumo dos seus chamados.";

if (usuario.perfil === "Tecnico") {
  document.getElementById("atalhoAtendimento").hidden = false;
}

try {
  const { resumo } = await api("/api/chamados/resumo");
  document.getElementById("qtdAberto").textContent = resumo["Aberto"];
  document.getElementById("qtdAtendimento").textContent = resumo["Em atendimento"];
  document.getElementById("qtdFinalizado").textContent = resumo["Finalizado"];
} catch (erro) {
  toast(erro.message, "erro");
}
