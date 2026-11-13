import { Router } from "express";
import { perfilLogado } from "../controller/usuario.controller.js";

const router = Router();

router.get("/me", perfilLogado);

export default router;
