import { Router } from "express";
import { listarCategorias } from "../controller/categoria.controller.js";

const router = Router();

router.get("/", listarCategorias);

export default router;
