const comparar = (a, b) => {
  const diferenca = new Date(a.data_abertura).getTime() - new Date(b.data_abertura).getTime();
  return diferenca !== 0 ? diferenca : a.id - b.id;
};

const mesclar = (esquerda, direita) => {
  const resultado = [];
  let i = 0;
  let j = 0;
  while (i < esquerda.length && j < direita.length) {
    if (comparar(esquerda[i], direita[j]) <= 0) {
      resultado.push(esquerda[i++]);
    } else {
      resultado.push(direita[j++]);
    }
  }
  while (i < esquerda.length) resultado.push(esquerda[i++]);
  while (j < direita.length) resultado.push(direita[j++]);
  return resultado;
};

export const ordenarPorAbertura = (lista) => {
  if (lista.length <= 1) return lista.slice();
  const meio = Math.floor(lista.length / 2);
  return mesclar(
    ordenarPorAbertura(lista.slice(0, meio)),
    ordenarPorAbertura(lista.slice(meio))
  );
};
