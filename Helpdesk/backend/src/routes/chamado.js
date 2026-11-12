import express from "express";
import { abrirChamado, listarChamado } from "../controller/chamado.controller";

const router = Router();

router.post("/", abrirChamado);
router.get("/", listarChamado);

export default router;
