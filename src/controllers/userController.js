import jwt from "jsonwebtoken";
import { supabase } from "../config/db.js";

// 🔑 Registrar usuario con auto-confirmación en Supabase Auth
export const registerUser = async (req, res) => {
  try {
    const { cedula, correo, nombre, telefono, password } = req.body;

    if (!cedula || !correo || !nombre || !password)
      return res.status(400).json({ error: "Faltan campos obligatorios" });

    // 🔹 Crear usuario en Supabase Auth con confirmación automática
    const { data: authData, error: authError } = await supabase.auth.signUp(
      {
        email: correo,
        password,
      },
      {
        // Esto evita que Supabase pida confirmar por correo
        emailRedirectTo: undefined,
        options: {
          data: { autoConfirm: true },
        },
      }
    );

    if (authError) {
      console.error("Error Supabase Auth:", authError.message);
      return res.status(400).json({ error: authError.message });
    }

    const userAuth = authData.user;

    // 🔹 Guardar datos adicionales en la tabla `usuarios`
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          id: userAuth.id, // mismo id de Auth
          cedula,
          correo,
          nombre,
          telefono,
          estado: "activo",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "✅ Usuario registrado correctamente con Supabase Auth (auto confirmado)",
      user: {
        id: data.id,
        cedula: data.cedula,
        correo: data.correo,
        nombre: data.nombre,
        telefono: data.telefono,
        estado: data.estado,
      },
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: error.message });
  }
};


// 🔓 Iniciar sesión con Supabase Auth
export const loginUser = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password)
      return res.status(400).json({ error: "Faltan credenciales" });

    // Autenticación real con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (authError || !authData?.user)
      return res.status(401).json({ error: "Credenciales inválidas" });

    // Buscar datos adicionales en tu tabla `usuarios`
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("correo", correo)
      .single();

    if (userError || !userData)
      return res.status(404).json({ error: "Usuario no encontrado en tabla interna" });

    // Buscar su rol
    const { data: rolData } = await supabase
      .from("usuario_roles")
      .select("roles(nombre)")
      .eq("usuario_id", userData.id)
      .single();

    const rol = rolData?.roles?.nombre || "sin rol asignado";

    // Respuesta
    res.json({
      message: "✅ Sesión iniciada correctamente con Supabase Auth",
      user: {
        id: userData.id,
        correo: userData.correo,
        nombre: userData.nombre,
        rol,
        estado: userData.estado,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: error.message });
  }
};


// ⚙️ Asignar rol
export const assignRole = async (req, res) => {
  try {
    const { usuario_id, rol_id } = req.body;

    if (!usuario_id || !rol_id)
      return res.status(400).json({ error: "Faltan datos para asignar rol" });

    const { error } = await supabase
      .from("usuario_roles")
      .insert([{ usuario_id, rol_id }]);

    if (error) throw error;

    res.json({ message: "Rol asignado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
