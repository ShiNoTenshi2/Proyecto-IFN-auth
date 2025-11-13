import { supabase } from "../config/db.js";

/**
 * Crea un nuevo usuario en la tabla 'usuarios'
 * @param {Object} userData - Datos del usuario
 */
export const createUser = async (userData) => {
  const { cedula, correo, nombre, telefono } = userData;

  // validación básica
  if (!correo || !cedula) {
    throw new Error("El correo y la cédula son obligatorios");
  }

  // inserción en la tabla usuarios
  const { data, error } = await supabase
    .from("usuarios")
    .insert([{ correo, cedula, nombre, telefono }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

/**
 * Busca un usuario en la base de datos por correo o cédula
 * @param {string} identificador - correo o cédula
 */
export const findUserByIdentificador = async (identificador) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .or(`correo.eq.${identificador},cedula.eq.${identificador}`)
    .limit(1);

  if (error) throw new Error(error.message);
  return data[0]; // devuelve un solo usuario o undefined
};

/**
 * Asigna un rol a un usuario
 * @param {string} usuarioId - ID del usuario
 * @param {string} rolNombre - Nombre del rol (ej: 'adminbrigadas', 'brigadista', 'adminpro')
 */
export const assignRoleToUser = async (usuarioId, rolNombre) => {
  // 1️⃣ Buscamos el rol por nombre en la tabla 'roles'
  const { data: rolData, error: rolError } = await supabase
    .from("roles")
    .select("id")
    .eq("nombre", rolNombre)
    .single();

  if (rolError || !rolData) throw new Error("Rol no encontrado");

  const rolId = rolData.id;

  // 2️⃣ Insertamos la relación en 'usuario_roles'
  const { error: insertError } = await supabase
    .from("usuario_roles")
    .insert([{ usuario_id: usuarioId, rol_id: rolId }]);

  if (insertError) throw new Error(insertError.message);

  return { message: "Rol asignado correctamente" };
};

