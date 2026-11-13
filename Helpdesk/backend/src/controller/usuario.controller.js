export const perfilLogado = (req, res) => {
  const { id, nome, email, perfil } = req.usuario;
  return res.json({ status: true, usuario: { id, nome, email, perfil } });
};
