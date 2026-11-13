import db from "../config/db.js";

export const listarCategorias = async (req, res) => {
  const [linhas] = await db.query("SELECT id, nome FROM categorias ORDER BY nome");
  return res.json({ status: true, categorias: linhas });
};
