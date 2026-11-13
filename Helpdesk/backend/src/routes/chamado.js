import { Router } from "express";
import {
  abrirChamado,
  listarChamados,
  resumoChamados,
  detalharChamado,
  alterarChamado,
  excluirChamado,
} from "../controller/chamado.controller.js";

const router = Router();

router.get("/resumo", resumoChamados);
router.get("/", listarChamados);
router.post("/", abrirChamado);
router.get("/:id", detalharChamado);
router.put("/:id", alterarChamado);
router.delete("/:id", excluirChamado);

export default router;
