// IFN-AUTH/src/middleware/authMiddleware.js
import { supabase } from '../config/db.js';

/**
 * Middleware para verificar JWT de Supabase
 */
export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: "Acceso denegado", 
        message: "No se proporcionó token de autenticación" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: "Acceso denegado", 
        message: "Token faltante" 
      });
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ 
        error: "Token inválido o expirado",
        message: error?.message || "No se pudo verificar el token"
      });
    }

    // ⭐ NUEVO: Obtener el rol desde la base de datos
    const { data: usuarioData, error: dbError } = await supabase
      .from('usuarios')
      .select('id, rol, nombre, correo, estado')
      .eq('correo', user.email)
      .single();

    if (dbError || !usuarioData) {
      return res.status(403).json({ 
        error: 'Usuario no encontrado',
        message: 'No existe un usuario registrado con este correo'
      });
    }

    if (usuarioData.estado === 'suspendido') {
      return res.status(403).json({ 
        error: 'Usuario suspendido',
        message: 'Tu cuenta ha sido suspendida'
      });
    }

    // Agregar datos del usuario al request
    req.user = {
      id: usuarioData.id,
      email: usuarioData.correo,
      rol: usuarioData.rol,
      nombre: usuarioData.nombre
    };
    
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(403).json({ 
      error: "Error de autenticación", 
      message: error.message 
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "No autorizado",
        message: "Debe estar autenticado"
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: "Acceso denegado",
        message: `Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
        rol_actual: req.user.rol
      });
    }

    next();
  };
};