export const agoraSemMilissegundos = () => {
  const agora = new Date();
  agora.setMilliseconds(0);
  return agora;
};
