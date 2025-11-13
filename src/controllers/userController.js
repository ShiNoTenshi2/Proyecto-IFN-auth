import { supabase } from "../config/db.js";

// 🔑 Registrar usuario (usando Supabase Auth)
export const registerUser = async (req, res) => {
  try {
    const { cedula, correo, nombre, telefono, password } = req.body;

    // Validar campos
    if (!cedula || !correo || !nombre || !password)
      return res.status(400).json({ error: "Faltan campos obligatorios" });

    // Crear el usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
    });

    if (error) throw error;

    const userId = data.user?.id;

    // Registrar también en la tabla "usuarios"
    const { error: dbError } = await supabase.from("usuarios").insert([
      {
        id: userId,
        cedula,
        correo,
        nombre,
        telefono,
        estado: "activo",
      },
    ]);

    if (dbError) throw dbError;

    res.status(201).json({
      message: "✅ Usuario registrado correctamente con Supabase Auth",
      user: {
        id: userId,
        cedula,
        correo,
        nombre,
        telefono,
        estado: "activo",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔓 Iniciar sesión (usando Supabase Auth)
export const loginUser = async (req, res) => {
  try {
    const { correo, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (error || !data?.user)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const token = data.session?.access_token;

    // Consultar información adicional en tabla 'usuarios'
    const { data: userInfo } = await supabase
      .from("usuarios")
      .select("id, nombre, estado")
      .eq("correo", correo)
      .single();

    // Buscar rol (si tiene)
    const { data: rolData } = await supabase
      .from("usuario_roles")
      .select("roles(nombre)")
      .eq("usuario_id", userInfo.id)
      .single();

    const rol = rolData?.roles?.nombre || "sin rol asignado";

    res.json({
      message: "✅ Sesión iniciada correctamente con Supabase Auth",
      token, // token generado por Supabase Auth
      user: {
        id: userInfo.id,
        correo,
        nombre: userInfo.nombre,
        rol,
        estado: userInfo.estado,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ⚙️ Asignar rol a un usuario
export const assignRole = async (req, res) => {
  try {
    const { usuario_id, rol_id } = req.body;

    const { error } = await supabase
      .from("usuario_roles")
      .insert([{ usuario_id, rol_id }]);

    if (error) throw error;

    res.json({ message: "✅ Rol asignado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🚫 Desactivar usuario (borrado lógico)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("usuarios")
      .update({ estado: "inactivo" })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "🟡 Usuario desactivado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
