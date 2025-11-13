import express from "express";
import {
  registerUser,
  loginUser,
  assignRole,
  deactivateUser,
} from "../controllers/userController.js";

const router = express.Router();

// Rutas principales
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/roles/asignar", assignRole);

// Nueva ruta para desactivar usuario (borrado lógico)
router.delete("/deactivate/:id", deactivateUser);

export default router;
