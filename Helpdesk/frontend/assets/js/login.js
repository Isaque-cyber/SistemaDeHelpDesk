import { api, mostrarAlerta, ocultarAlerta } from "./comum.js";

const formulario = document.getElementById("formLogin");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const alerta = document.getElementById("alerta");
const botao = document.getElementById("btnEntrar");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  ocultarAlerta(alerta);
  campoEmail.parentElement.classList.remove("campo-invalido");
  campoSenha.parentElement.classList.remove("campo-invalido");

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  if (!email || !senha) {
    if (!email) campoEmail.parentElement.classList.add("campo-invalido");
    if (!senha) campoSenha.parentElement.classList.add("campo-invalido");
    mostrarAlerta(alerta, "Preencha o e-mail e a senha.");
    (email ? campoSenha : campoEmail).focus();
    return;
  }

  if (!campoEmail.checkValidity()) {
    campoEmail.parentElement.classList.add("campo-invalido");
    mostrarAlerta(alerta, "Informe um e-mail válido.");
    campoEmail.focus();
    return;
  }

  botao.disabled = true;
  botao.textContent = "Entrando...";

  try {
    await api("/api/auth/login", { method: "POST", corpo: { email, senha } });
    window.location.replace("/");
  } catch (erro) {
    mostrarAlerta(alerta, erro.message);
    campoSenha.value = "";
    campoSenha.focus();
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});
