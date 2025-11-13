// usuarios-service/controllers/usuariosController.js
import UsuariosModel from '../models/usuariosModel.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class UsuariosController {

  // GET /api/usuarios - Obtener todos los usuarios
  static async getAll(req, res) {
    try {
      const usuarios = await UsuariosModel.getAll();
      res.json(usuarios);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/usuarios/:id - Obtener usuario por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuariosModel.getById(id);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(usuario);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/usuarios/correo/:correo - Obtener usuario por correo
  static async getByEmail(req, res) {
    try {
      const { correo } = req.params;
      const usuario = await UsuariosModel.getByEmail(correo);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(usuario);
    } catch (error) {
      console.error('Error en getByEmail:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/usuarios/rol/:rol - Obtener usuarios por rol
  static async getByRol(req, res) {
    try {
      const { rol } = req.params;
      
      if (!['AdminPro', 'AdminBrigadas'].includes(rol)) {
        return res.status(400).json({ 
          error: 'Rol inválido. Valores permitidos: AdminPro, AdminBrigadas' 
        });
      }

      const usuarios = await UsuariosModel.getByRol(rol);
      res.json(usuarios);
    } catch (error) {
      console.error('Error en getByRol:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/usuarios - Crear usuario (AdminPro o AdminBrigadas)
  static async create(req, res) {
    try {
      const { correo, cedula, nombre, telefono, rol } = req.body;

      // Validar campos requeridos
      if (!correo || !cedula || !nombre || !rol) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: correo, cedula, nombre, rol' 
        });
      }

      // Validar rol
      if (!['AdminPro', 'AdminBrigadas'].includes(rol)) {
        return res.status(400).json({ 
          error: 'Rol inválido. Valores permitidos: AdminPro, AdminBrigadas' 
        });
      }

      // Verificar que el correo no exista
      const correoExiste = await UsuariosModel.getByEmail(correo);
      if (correoExiste) {
        return res.status(409).json({ error: 'El correo ya está registrado' });
      }

      // Verificar que la cédula no exista
      const cedulaExiste = await UsuariosModel.getByCedula(cedula);
      if (cedulaExiste) {
        return res.status(409).json({ error: 'La cédula ya está registrada' });
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: correo,
        email_confirm: true,
        user_metadata: {
          nombre_completo: nombre,
          rol: rol
        }
      });

      if (authError) {
        throw new Error('Error creando usuario en Auth: ' + authError.message);
      }

      // Crear usuario en la base de datos
      const usuario = await UsuariosModel.create({
        id: authData.user.id,
        correo,
        cedula,
        nombre,
        telefono: telefono || null,
        rol
      });

      // Enviar email de invitación
      const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(correo);
      
      if (emailError) {
        console.warn('⚠️ Error enviando invitación:', emailError.message);
      }

      res.status(201).json({ 
        message: 'Usuario creado exitosamente. Se envió invitación por correo.',
        usuario
      });

    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/usuarios/:id - Actualizar usuario
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // No permitir actualizar ciertos campos
      delete updates.id;
      delete updates.correo;
      delete updates.created_at;

      // Validar rol si viene en updates
      if (updates.rol && !['AdminPro', 'AdminBrigadas'].includes(updates.rol)) {
        return res.status(400).json({ 
          error: 'Rol inválido. Valores permitidos: AdminPro, AdminBrigadas' 
        });
      }

      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuarioActualizado = await UsuariosModel.update(id, updates);

      // Actualizar metadata en Supabase Auth si cambió nombre
      if (updates.nombre) {
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            nombre_completo: updates.nombre,
            rol: usuarioActualizado.rol
          }
        }).catch(err => console.warn('⚠️ Error actualizando Auth:', err.message));
      }
      
      res.json({ 
        message: 'Usuario actualizado exitosamente',
        usuario: usuarioActualizado
      });

    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/usuarios/:id/suspender - Suspender usuario
  static async suspend(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.estado === 'suspendido') {
        return res.status(400).json({ error: 'El usuario ya está suspendido' });
      }

      const usuarioSuspendido = await UsuariosModel.suspend(id);

      // Deshabilitar en Auth
      await supabase.auth.admin.updateUserById(id, {
        ban_duration: '876000h' // 100 años (prácticamente permanente)
      }).catch(err => console.warn('⚠️ Error suspendiendo en Auth:', err.message));

      res.json({
        message: 'Usuario suspendido exitosamente',
        usuario: usuarioSuspendido
      });

    } catch (error) {
      console.error('Error en suspend:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/usuarios/:id/activar - Activar usuario
  static async activate(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.estado === 'activo') {
        return res.status(400).json({ error: 'El usuario ya está activo' });
      }

      const usuarioActivado = await UsuariosModel.activate(id);

      // Rehabilitar en Auth
      await supabase.auth.admin.updateUserById(id, {
        ban_duration: 'none'
      }).catch(err => console.warn('⚠️ Error activando en Auth:', err.message));

      res.json({
        message: 'Usuario activado exitosamente',
        usuario: usuarioActivado
      });

    } catch (error) {
      console.error('Error en activate:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // DELETE /api/usuarios/:id - Eliminar usuario permanentemente
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Solo eliminar si ya está suspendido
      if (usuario.estado !== 'suspendido') {
        return res.status(400).json({ 
          error: 'Solo se pueden eliminar usuarios suspendidos',
          sugerencia: 'Primero suspende el usuario con PUT /:id/suspender'
        });
      }

      // Eliminar de Auth
      await supabase.auth.admin.deleteUser(id)
        .catch(err => console.warn('⚠️ Error eliminando de Auth:', err.message));

      // Eliminar de la base de datos
      await UsuariosModel.delete(id);

      res.json({ message: 'Usuario eliminado permanentemente' });

    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/usuarios/login - Login (verificación)
  static async login(req, res) {
    try {
      const { correo } = req.body;
      
      if (!correo) {
        return res.status(400).json({ error: 'Correo requerido' });
      }

      const usuario = await UsuariosModel.getByEmail(correo);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.estado === 'suspendido') {
        return res.status(403).json({ error: 'Usuario suspendido. Contacta al administrador.' });
      }

      res.json({ 
        user: {
          id: usuario.id,
          correo: usuario.correo,
          cedula: usuario.cedula,
          nombre: usuario.nombre,
          telefono: usuario.telefono,
          rol: usuario.rol,
          estado: usuario.estado,
          created_at: usuario.created_at
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/usuarios/estadisticas - Estadísticas de usuarios
  static async getEstadisticas(req, res) {
    try {
      const estadisticas = await UsuariosModel.getEstadisticas();
      res.json(estadisticas);
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default UsuariosController;