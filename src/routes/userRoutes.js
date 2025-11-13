import express from "express";
import { registerUser, loginUser, assignRole } from "../controllers/userController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔹 Registro
router.post("/register", registerUser);

// 🔹 Login
router.post("/login", loginUser);

// 🔹 Asignar rol
router.post("/roles/asignar", assignRole);

// 🔹 Ruta protegida de prueba
router.get("/perfil", verificarToken, (req, res) => {
  res.json({ message: "Acceso autorizado ✅", user: req.user });
});

export default router;
