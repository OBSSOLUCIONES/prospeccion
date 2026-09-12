// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

function sanitizarUrlSupabase(url) {
  if (!url) return '';
  let limpia = url.trim();
  limpia = limpia.replace(/^(https?:\/\/)+/gi, '');
  limpia = limpia.replace(/^https?\/\//gi, '');
  return `https://${limpia}`;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = sanitizarUrlSupabase(rawUrl);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('tu-id-de-proyecto') &&
  supabaseUrl.includes('.supabase.co')
);

const obtenerClienteSupabaseUnico = () => {
  if (!isSupabaseConfigured) return null;

  if (globalThis.__supabaseClientInstance) {
    return globalThis.__supabaseClientInstance;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  globalThis.__supabaseClientInstance = client;
  return client;
};

export const supabase = obtenerClienteSupabaseUnico();

// ==========================================
// COMPRESIÓN DE IMÁGENES
// ==========================================
export async function comprimirImagen(file, maxDimension = 1280, calidad = 0.75) {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const nombreLimpio = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
            resolve(new File([blob], nombreLimpio, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          calidad
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// Subida a Storage
export async function subirArchivoSupabase(file, folder = 'fotos') {
  if (!supabase) return URL.createObjectURL(file);

  const archivoAEnviar = await comprimirImagen(file);
  const extension = archivoAEnviar.name.split('.').pop();
  const nombreLimpio = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('evidencias-obras')
    .upload(nombreLimpio, archivoAEnviar, {
      cacheControl: '31536000',
      upsert: false
    });

  if (uploadError) {
    console.error('Error subiendo a Supabase Storage:', uploadError);
    return URL.createObjectURL(file);
  }

  const { data } = supabase.storage.from('evidencias-obras').getPublicUrl(nombreLimpio);
  return data.publicUrl;
}

// ==========================================
// CRUD CLIENTES
// ==========================================
export async function obtenerClientesDB() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error obteniendo clientes:', error); return null; }
  return data.map(c => ({
    id: c.id,
    sucursal: c.sucursal,
    idRedAzul: c.id_red_azul || '',
    nombreCliente: c.nombre_cliente,
    tipoCliente: c.tipo_cliente,
    tipoMercado: c.tipo_mercado || '',
    responsable: c.responsable,
    contacto: c.contacto || '',
    correo: c.correo || '',
    direccion: c.direccion || '',
    lat: c.lat,
    lng: c.lng,
    ubicacion: c.ubicacion || ''
  }));
}

export async function guardarClienteDB(cliente) {
  if (!supabase) return;
  const fila = {
    id: cliente.id,
    sucursal: cliente.sucursal,
    id_red_azul: cliente.idRedAzul || null,
    nombre_cliente: cliente.nombreCliente,
    tipo_cliente: cliente.tipoCliente,
    tipo_mercado: cliente.tipoMercado || null,
    responsable: cliente.responsable,
    contacto: cliente.contacto || null,
    correo: cliente.correo || null,
    direccion: cliente.direccion || null,
    lat: cliente.lat || null,
    lng: cliente.lng || null,
    ubicacion: cliente.ubicacion || null
  };
  const { error } = await supabase.from('clientes').upsert(fila);
  if (error) console.error('Error guardando cliente:', error);
}

export async function eliminarClienteDB(id) {
  if (!supabase) return;
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) console.error('Error eliminando cliente en Supabase:', error);
}

// ==========================================
// CRUD OBRAS
// ==========================================
export async function obtenerObrasDB() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('Error obteniendo obras:', error); return null; }
  return data.map(o => ({
    id: o.id,
    nombre: o.nombre,
    sucursal: o.sucursal,
    clienteId: o.cliente_id || null,
    tipoDesarrollo: o.tipo_desarrollo || 'OBRA NUEVA',
    estatusFase: o.estatus_fase || 'CIMENTACIÓN',
    estadoObra: o.estado_obra || 'ACTIVA',
    direccion: o.direccion || '',
    lat: o.lat ? parseFloat(o.lat) : null,
    lng: o.lng ? parseFloat(o.lng) : null,
    createdAt: o.created_at
  }));
}

export async function guardarObraDB(obra) {
  if (!supabase) return;
  const fila = {
    id: obra.id,
    nombre: obra.nombre,
    sucursal: obra.sucursal,
    cliente_id: obra.clienteId || null,
    tipo_desarrollo: obra.tipoDesarrollo || 'OBRA NUEVA',
    estatus_fase: obra.estatusFase || 'CIMENTACIÓN',
    estado_obra: obra.estadoObra || 'ACTIVA',
    direccion: obra.direccion || null,
    lat: obra.lat || null,
    lng: obra.lng || null
  };
  const { error } = await supabase.from('obras').upsert(fila);
  if (error) console.error('Error guardando obra en Supabase:', error);
}

export async function eliminarObraDB(id) {
  if (!supabase) return;
  const { error } = await supabase.from('obras').delete().eq('id', id);
  if (error) console.error('Error eliminando obra de Supabase:', error);
}

// ==========================================
// CRUD VISITAS
// ==========================================
export async function obtenerVisitasDB() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('visitas').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error obteniendo visitas:', error); return null; }
  return data.map(v => ({
    id: v.id,
    obraId: v.obra_id,
    sucursal: v.sucursal,
    fecha: v.fecha,
    asesorNombre: v.asesor_nombre,
    estatus: v.estatus,
    actividad: v.actividad,
    observaciones: v.observaciones || '',
    fotos: v.fotos || [],
    latGpsReal: v.lat_gps_real,
    lngGpsReal: v.lng_gps_real,
    distanciaAuditoriaMetros: v.distancia_auditoria_metros,
    auditoriaEstado: v.auditoria_estado
  }));
}

export async function guardarVisitaDB(visita) {
  if (!supabase) return;
  const fila = {
    id: visita.id,
    obra_id: visita.obraId,
    sucursal: visita.sucursal,
    fecha: visita.fecha,
    asesor_nombre: visita.asesorNombre,
    estatus: visita.estatus,
    actividad: visita.actividad,
    observaciones: visita.observaciones || null,
    fotos: visita.fotos || [],
    lat_gps_real: visita.latGpsReal || null,
    lng_gps_real: visita.lngGpsReal || null,
    distancia_auditoria_metros: visita.distanciaAuditoriaMetros || 0,
    auditoria_estado: visita.auditoriaEstado || 'remoto'
  };
  const { error } = await supabase.from('visitas').upsert(fila);
  if (error) console.error('Error guardando visita en Supabase:', error);
}

// ==========================================
// CRUD MOVIMIENTOS COMERCIALES
// ==========================================
export async function obtenerMovimientosDB() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('movimientos_comerciales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('Error obteniendo movimientos:', error); return null; }
  return data.map(m => ({
    id: m.id,
    obraId: m.obra_id,
    tipo: m.tipo,
    comprobante: m.comprobante || 'COTIZACIÓN',
    folio: m.folio,
    monto: Number(m.monto) || 0,
    estatus: m.estatus || 'PENDIENTE',
    formaPago: m.forma_pago || 'N/A',
    tipoEntrega: m.tipo_entrega || 'DOMICILIO',
    fecha: m.fecha,
    documentoAdjunto: m.documento_adjunto || null,
    observaciones: m.observaciones || '',
    cotizacionOrigenId: m.cotizacion_origen_id || null
  }));
}

export async function guardarMovimientoDB(mov) {
  if (!supabase) return;
  const fila = {
    id: mov.id,
    obra_id: mov.obraId,
    tipo: mov.tipo,
    comprobante: mov.comprobante || (mov.tipo === 'VENTA' ? 'REMISIÓN' : 'COTIZACIÓN'),
    folio: mov.folio,
    monto: Number(mov.monto) || 0,
    estatus: mov.estatus || 'PENDIENTE',
    forma_pago: mov.formaPago || 'N/A',
    tipo_entrega: mov.tipoEntrega || 'DOMICILIO',
    fecha: mov.fecha,
    documento_adjunto: mov.documentoAdjunto || null,
    observaciones: mov.observaciones || null,
    cotizacion_origen_id: mov.cotizacionOrigenId || null
  };
  const { error } = await supabase.from('movimientos_comerciales').upsert(fila);
  if (error) console.error('Error guardando movimiento en Supabase:', error);
}

// ==========================================
// SUSCRIPCIÓN EN VIVO (SIN F5)
// ==========================================
export function suscribirCambiosGlobales(callback) {
  if (!supabase) return () => {};
  const canal = supabase
    .channel('cambios-en-vivo-app')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'obras' }, () => callback('obras'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => callback('clientes'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visitas' }, () => callback('visitas'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'movimientos_comerciales' }, () => callback('movimientos'))
    .subscribe();

  return () => supabase.removeChannel(canal);
}

export async function transmitirPosicionDB({ usuarioId, nombre, sucursal, lat, lng, accuracy }) {
  if (!supabase || !usuarioId) return;
  await supabase.from('posiciones_en_vivo').upsert({
    usuario_id: usuarioId,
    nombre,
    sucursal,
    lat,
    lng,
    accuracy,
    updated_at: new Date().toISOString()
  });
}

export async function obtenerPosicionesEnVivoDB() {
  if (!supabase) return [];
  const { data } = await supabase.from('posiciones_en_vivo').select('*');
  return data || [];
}

export function suscribirPosicionesEnVivo(onUpdate) {
  if (!supabase) return () => {};
  const canal = supabase
    .channel('rastreo-flota-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posiciones_en_vivo' }, () => {
      obtenerPosicionesEnVivoDB().then(onUpdate);
    })
    .subscribe();

  return () => supabase.removeChannel(canal);
}