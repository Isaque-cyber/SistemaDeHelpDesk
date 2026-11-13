import { Router } from "express";
import { autenticacao, logout } from "../controller/login.controller.js";

const router = Router();

router.post("/login", autenticacao);
router.post("/logout", logout);

export default router;
