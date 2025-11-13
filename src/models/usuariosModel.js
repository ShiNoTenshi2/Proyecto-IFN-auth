// usuarios-service/models/usuariosModel.js
import supabase from '../config/db.js';

class UsuariosModel {
  
  // Obtener todos los usuarios activos
  static async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Obtener todos incluyendo suspendidos
  static async getAllWithSuspended() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Obtener usuario por ID
  static async getById(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuario por correo
  static async getByEmail(correo) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuario por cédula
  static async getByCedula(cedula) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cedula', cedula)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuarios por rol
  static async getByRol(rol) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', rol)
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Crear usuario
  static async create(usuario) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        id: usuario.id,
        cedula: usuario.cedula,
        correo: usuario.correo,
        nombre: usuario.nombre,
        telefono: usuario.telefono || null,
        rol: usuario.rol,
        estado: 'activo'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Actualizar usuario
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Suspender usuario (soft delete)
  static async suspend(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        estado: 'suspendido',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Activar usuario
  static async activate(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        estado: 'activo',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Eliminar físicamente (solo casos extremos)
  static async delete(id) {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Contar usuarios por rol
  static async contarPorRol(rol) {
    const { count, error } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', rol)
      .eq('estado', 'activo');
    
    if (error) throw error;
    return count || 0;
  }

  // Estadísticas
  static async getEstadisticas() {
    const adminPro = await this.contarPorRol('AdminPro');
    const adminBrigadas = await this.contarPorRol('AdminBrigadas');

    return {
      adminPro,
      adminBrigadas,
      total: adminPro + adminBrigadas
    };
  }
}

export default UsuariosModel;