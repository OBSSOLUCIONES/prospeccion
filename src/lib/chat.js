// src/lib/chat.js
import { supabase } from './supabase';

export async function enviarMensajeDB({
  emisorId,
  emisorNombre,
  emisorSucursal,
  emisorRol,
  receptorId,
  receptorNombre,
  contenido
}) {
  if (!supabase || !navigator.onLine) {
    return { ok: false, error: 'sin_conexion' };
  }
  try {
    const fila = {
      emisor_id: String(emisorId).toUpperCase(),
      emisor_nombre: String(emisorNombre || '').toUpperCase(),
      emisor_sucursal: emisorSucursal ? String(emisorSucursal).toUpperCase() : null,
      emisor_rol: emisorRol || 'asesor',
      receptor_id: String(receptorId).toUpperCase(),
      receptor_nombre: receptorNombre ? String(receptorNombre).toUpperCase() : null,
      contenido: String(contenido).trim(),
      tipo: 'texto',
      leido: false
    };

    const { data, error } = await supabase
      .from('mensajes_chat')
      .insert(fila)
      .select()
      .single();

    if (error) {
      console.warn('Error enviando mensaje:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, mensaje: data };
  } catch (err) {
    console.warn('Excepción enviando mensaje:', err);
    return { ok: false, error: 'excepcion' };
  }
}

export async function obtenerConversacionDB(usuarioA, usuarioB, limite = 100) {
  if (!supabase || !navigator.onLine) return [];
  try {
    const { data, error } = await supabase
      .from('mensajes_chat')
      .select('*')
      .or(`and(emisor_id.eq.${usuarioA},receptor_id.eq.${usuarioB}),and(emisor_id.eq.${usuarioB},receptor_id.eq.${usuarioA})`)
      .order('created_at', { ascending: true })
      .limit(limite);

    if (error) {
      console.warn('Error obteniendo conversación:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Excepción obteniendo conversación:', err);
    return [];
  }
}

export async function obtenerTodosLosMensajesDB(usuarioId) {
  if (!supabase || !navigator.onLine) return [];
  try {
    const { data, error } = await supabase
      .from('mensajes_chat')
      .select('*')
      .or(`emisor_id.eq.${usuarioId},receptor_id.eq.${usuarioId}`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function marcarComoLeidosDB(emisorId, receptorId) {
  if (!supabase || !navigator.onLine) return false;
  try {
    const { error } = await supabase
      .from('mensajes_chat')
      .update({ leido: true })
      .eq('emisor_id', emisorId)
      .eq('receptor_id', receptorId)
      .eq('leido', false);
    return !error;
  } catch {
    return false;
  }
}

export function suscribirMensajesEnVivo(usuarioId, onMensajeNuevo) {
  if (!supabase || !usuarioId) return () => {};
  
    const canal = supabase
    .channel(`chat-realtime-${usuarioId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensajes_chat',
        filter: `receptor_id=eq.${usuarioId}`
      },
      (payload) => {
        if (payload.new && onMensajeNuevo) {
          onMensajeNuevo(payload.new);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(canal);
}

export async function obtenerUsuariosDB() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('sucursal', { ascending: true });
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
}