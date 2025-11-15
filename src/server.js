// IFN-AUTH/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from './routes/usuarios.Routes.js';

dotenv.config();

const app = express();

// ==================== MIDDLEWARES ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH CHECK ====================
app.get("/", (_req, res) => {
  res.json({ 
    message: "✅ Servidor IFN-auth funcionando 🚀",
    timestamp: new Date().toISOString(),
    service: 'ifn-auth'
  });
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'ifn-auth',
    timestamp: new Date().toISOString()
  });
});

// ==================== RUTAS ====================
app.use("/api/users", userRoutes);

// ==================== ERROR HANDLING ====================
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`

  🚀 IFN-AUTH SERVICE INICIADO       
  Puerto: ${PORT}                        
  Env: ${process.env.NODE_ENV || 'development'}              

  `);
});