import express from "express";
import dotenv from "dotenv";
import { supabase } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Ruta base para probar el servidor
app.get("/", (req, res) => {
  res.json({ message: "Servidor IFN-auth funcionando 🚀" });
});

// ✅ Aquí se registran las rutas del microservicio
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
