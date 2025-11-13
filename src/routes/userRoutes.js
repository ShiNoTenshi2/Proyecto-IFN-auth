// usuarios-service/routes/usuariosRoutes.js
import express from 'express';
import UsuariosController from '../controllers/usuariosController.js';
import { 
  requireAuth, 
  requireAdminPro, 
  requireAdmin 
} from '../middlewares/authMiddleware.js';
import {
  validateRequired,
  validateEmail,
  validateCedula,
  validateTelefono,
  validateUUID
} from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Estas rutas de aca son publicas, cualquier persona con un link puede entrar

// POST /api/usuarios/login - Login
router.post('/login', 
  validateRequired(['correo']),
  UsuariosController.login
);

// rutas solo accesibles mediante un token, un papu token

// GET /api/usuarios - Obtener todos (Admin)
router.get('/', 
  requireAuth,
  requireAdmin,
  UsuariosController.getAll
);

// GET /api/usuarios/estadisticas - Estadísticas (Admin)
router.get('/estadisticas',
  requireAuth,
  requireAdmin,
  UsuariosController.getEstadisticas
);

// GET /api/usuarios/rol/:rol - Obtener por rol (Admin)
router.get('/rol/:rol',
  requireAuth,
  requireAdmin,
  UsuariosController.getByRol
);

// GET /api/usuarios/:id - Obtener por ID (Admin)
router.get('/:id',
  requireAuth,
  requireAdmin,
  validateUUID('id'),
  UsuariosController.getById
);

// GET /api/usuarios/correo/:correo - Obtener por correo (Admin)
router.get('/correo/:correo',
  requireAuth,
  requireAdmin,
  UsuariosController.getByEmail
);

// POST /api/usuarios - Crear usuario (Solo AdminPro)
router.post('/',
  requireAuth,
  requireAdminPro,
  validateRequired(['correo', 'cedula', 'nombre', 'rol']),
  validateEmail,
  validateCedula,
  validateTelefono,
  UsuariosController.create
);

// PUT /api/usuarios/:id - Actualizar usuario (Solo AdminPro)
router.put('/:id',
  requireAuth,
  requireAdminPro,
  validateUUID('id'),
  validateEmail,
  validateCedula,
  validateTelefono,
  UsuariosController.update
);

// PUT /api/usuarios/:id/suspender - Suspender usuario (Solo AdminPro)
router.put('/:id/suspender',
  requireAuth,
  requireAdminPro,
  validateUUID('id'),
  UsuariosController.suspend
);

// PUT /api/usuarios/:id/activar - Activar usuario (Solo AdminPro)
router.put('/:id/activar',
  requireAuth,
  requireAdminPro,
  validateUUID('id'),
  UsuariosController.activate
);

// DELETE /api/usuarios/:id - Eliminar usuario (Solo AdminPro)
router.delete('/:id',
  requireAuth,
  requireAdminPro,
  validateUUID('id'),
  UsuariosController.delete
);

export default router;
