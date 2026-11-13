import { Router } from "express";
import {
  listarFila,
  assumirChamado,
  registrarAtendimento,
} from "../controller/atendimento.controller.js";

const router = Router();

router.get("/chamados", listarFila);
router.post("/chamados/:id/assumir", assumirChamado);
router.post("/chamados/:id/registros", registrarAtendimento);

export default router;
