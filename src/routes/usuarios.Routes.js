import express from 'express';
import UsuariosController from '../controllers/usuariosController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Login público
router.post('/login', UsuariosController.login);

// Rutas protegidas con token
router.get('/', verificarToken, UsuariosController.getAll);

router.get('/estadisticas',
  verificarToken,
  UsuariosController.getEstadisticas
);

router.get('/rol/:rol',
  verificarToken,
  UsuariosController.getByRol
);

router.get('/:id',
  verificarToken,
  UsuariosController.getById
);

router.get('/correo/:correo',
  verificarToken,
  UsuariosController.getByEmail
);

router.post('/',
  verificarToken,
  UsuariosController.create
);

router.put('/:id',
  verificarToken,
  UsuariosController.update
);

router.put('/:id/suspender',
  verificarToken,
  UsuariosController.suspend
);

router.put('/:id/activar',
  verificarToken,
  UsuariosController.activate
);

router.delete('/:id',
  verificarToken,
  UsuariosController.delete
);

export default router;
