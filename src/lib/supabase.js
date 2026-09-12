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
// MOTOR INDEXEDDB PARA MODO OFFLINE EN CAMPO
// ==========================================
const DB_NAME = 'prospeccion_obs_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'cola_sincronizacion';

function abrirDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function encolarAccionOffline(accion) {
  try {
    const db = await abrirDB();
    if (!db) {
      const colaLocal = JSON.parse(localStorage.getItem('obs_cola_offline') || '[]');
      colaLocal.push(accion);
      localStorage.setItem('obs_cola_offline', JSON.stringify(colaLocal));
      window.dispatchEvent(new Event('obs_cola_actualizada'));
      return;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(accion);
    tx.oncomplete = () => {
      window.dispatchEvent(new Event('obs_cola_actualizada'));
    };
  } catch (err) {
    console.warn('Error encolando acción offline:', err);
  }
}

export async function obtenerItemsColaOffline() {
  try {
    const db = await abrirDB();
    if (!db) {
      return JSON.parse(localStorage.getItem('obs_cola_offline') || '[]');
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function eliminarItemColaOffline(id) {
  try {
    const db = await abrirDB();
    if (!db) {
      const colaLocal = JSON.parse(localStorage.getItem('obs_cola_offline') || '[]');
      const filtrada = colaLocal.filter(item => item.id !== id);
      localStorage.setItem('obs_cola_offline', JSON.stringify(filtrada));
      window.dispatchEvent(new Event('obs_cola_actualizada'));
      return;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => {
      window.dispatchEvent(new Event('obs_cola_actualizada'));
    };
  } catch (err) {
    console.warn('Error eliminando item de cola offline:', err);
  }
}

export async function contarItemsColaOffline() {
  const items = await obtenerItemsColaOffline();
  return items.length;
}

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

function convertirArchivoABase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

async function base64AArchivo(base64Data, nombreArchivo) {
  const res = await fetch(base64Data);
  const blob = await res.blob();
  return new File([blob], nombreArchivo, { type: 'image/jpeg' });
}

// Subida a Storage con soporte Offline
export async function subirArchivoSupabase(file, folder = 'fotos') {
  const archivoAEnviar = await comprimirImagen(file);

  // Si estamos sin conexión o no hay supabase, generar Base64 para visualización offline
  if (!navigator.onLine || !supabase) {
    return await convertirArchivoABase64(archivoAEnviar);
  }

  const extension = archivoAEnviar.name.split('.').pop();
  const nombreLimpio = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('evidencias-obras')
      .upload(nombreLimpio, archivoAEnviar, {
        cacheControl: '31536000',
        upsert: false
      });

    if (uploadError) {
      console.warn('Fallo al subir a Storage, guardando en Base64 local:', uploadError);
      return await convertirArchivoABase64(archivoAEnviar);
    }

    const { data } = supabase.storage.from('evidencias-obras').getPublicUrl(nombreLimpio);
    return data.publicUrl;
  } catch {
    return await convertirArchivoABase64(archivoAEnviar);
  }
}

// ==========================================
// CRUD CLIENTES (CON SOPORTE OFFLINE)
// ==========================================
export async function obtenerClientesDB() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    if (error) return null;
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
  } catch {
    return null;
  }
}

export async function guardarClienteDB(cliente) {
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

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `cli_${cliente.id}_${Date.now()}`, tabla: 'clientes', datos: fila });
    return;
  }

  try {
    const { error } = await supabase.from('clientes').upsert(fila);
    if (error) {
      await encolarAccionOffline({ id: `cli_${cliente.id}_${Date.now()}`, tabla: 'clientes', datos: fila });
    }
  } catch {
    await encolarAccionOffline({ id: `cli_${cliente.id}_${Date.now()}`, tabla: 'clientes', datos: fila });
  }
}

export async function eliminarClienteDB(id) {
  if (!supabase || !navigator.onLine) {
    await encolarAccionOffline({ id: `del_cli_${id}_${Date.now()}`, tabla: 'clientes_delete', datos: { id } });
    return;
  }
  try {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) {
      await encolarAccionOffline({ id: `del_cli_${id}_${Date.now()}`, tabla: 'clientes_delete', datos: { id } });
    }
  } catch {
    await encolarAccionOffline({ id: `del_cli_${id}_${Date.now()}`, tabla: 'clientes_delete', datos: { id } });
  }
}

// ==========================================
// CRUD OBRAS (CON SOPORTE OFFLINE)
// ==========================================
export async function obtenerObrasDB() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
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
  } catch {
    return null;
  }
}

export async function guardarObraDB(obra) {
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

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `obr_${obra.id}_${Date.now()}`, tabla: 'obras', datos: fila });
    return;
  }

  try {
    const { error } = await supabase.from('obras').upsert(fila);
    if (error) {
      await encolarAccionOffline({ id: `obr_${obra.id}_${Date.now()}`, tabla: 'obras', datos: fila });
    }
  } catch {
    await encolarAccionOffline({ id: `obr_${obra.id}_${Date.now()}`, tabla: 'obras', datos: fila });
  }
}

export async function eliminarObraDB(id) {
  if (!supabase || !navigator.onLine) {
    await encolarAccionOffline({ id: `del_obr_${id}_${Date.now()}`, tabla: 'obras_delete', datos: { id } });
    return;
  }
  try {
    const { error } = await supabase.from('obras').delete().eq('id', id);
    if (error) {
      await encolarAccionOffline({ id: `del_obr_${id}_${Date.now()}`, tabla: 'obras_delete', datos: { id } });
    }
  } catch {
    await encolarAccionOffline({ id: `del_obr_${id}_${Date.now()}`, tabla: 'obras_delete', datos: { id } });
  }
}

// ==========================================
// CRUD VISITAS (CON SOPORTE OFFLINE)
// ==========================================
export async function obtenerVisitasDB() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const { data, error } = await supabase.from('visitas').select('*').order('created_at', { ascending: false });
    if (error) return null;
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
  } catch {
    return null;
  }
}

export async function guardarVisitaDB(visita) {
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

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `vis_${visita.id}_${Date.now()}`, tabla: 'visitas', datos: fila });
    return;
  }

  try {
    const { error } = await supabase.from('visitas').upsert(fila);
    if (error) {
      await encolarAccionOffline({ id: `vis_${visita.id}_${Date.now()}`, tabla: 'visitas', datos: fila });
    }
  } catch {
    await encolarAccionOffline({ id: `vis_${visita.id}_${Date.now()}`, tabla: 'visitas', datos: fila });
  }
}

// ==========================================
// CRUD MOVIMIENTOS COMERCIALES (CON SOPORTE OFFLINE)
// ==========================================
export async function obtenerMovimientosDB() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const { data, error } = await supabase
      .from('movimientos_comerciales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
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
  } catch {
    return null;
  }
}

export async function guardarMovimientoDB(mov) {
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

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `mov_${mov.id}_${Date.now()}`, tabla: 'movimientos', datos: fila });
    return;
  }

  try {
    const { error } = await supabase.from('movimientos_comerciales').upsert(fila);
    if (error) {
      await encolarAccionOffline({ id: `mov_${mov.id}_${Date.now()}`, tabla: 'movimientos', datos: fila });
    }
  } catch {
    await encolarAccionOffline({ id: `mov_${mov.id}_${Date.now()}`, tabla: 'movimientos', datos: fila });
  }
}

// ==========================================
// SINCRONIZADOR DE LA COLA OFFLINE AL VOLVER A TENER SEÑAL
// ==========================================
export async function sincronizarColaOffline() {
  if (!navigator.onLine || !supabase) return 0;
  
  const pendientes = await obtenerItemsColaOffline();
  if (!pendientes.length) return 0;

  let sincronizados = 0;

  for (const item of pendientes) {
    try {
      if (item.tabla === 'obras') {
        const { error } = await supabase.from('obras').upsert(item.datos);
        if (!error) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'obras_delete') {
        const { error } = await supabase.from('obras').delete().eq('id', item.datos.id);
        if (!error) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'clientes') {
        const { error } = await supabase.from('clientes').upsert(item.datos);
        if (!error) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'clientes_delete') {
        const { error } = await supabase.from('clientes').delete().eq('id', item.datos.id);
        if (!error) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'visitas') {
        let fotosFinales = [];
        if (Array.isArray(item.datos.fotos)) {
          for (let fIdx = 0; fIdx < item.datos.fotos.length; fIdx++) {
            const foto = item.datos.fotos[fIdx];
            if (foto.startsWith('data:image/')) {
              try {
                const archivo = await base64AArchivo(foto, `foto_${Date.now()}_${fIdx}.jpg`);
                const urlNube = await subirArchivoSupabase(archivo, 'fotos');
                fotosFinales.push(urlNube);
              } catch {
                fotosFinales.push(foto);
              }
            } else {
              fotosFinales.push(foto);
            }
          }
        }
        const filaVisita = { ...item.datos, fotos: fotosFinales };
        const { error } = await supabase.from('visitas').upsert(filaVisita);
        if (!error) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'movimientos') {
        const { error } = await supabase.from('movimientos_comerciales').upsert(item.datos);
        if (!error) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      }
    } catch (e) {
      console.warn('Error sincronizando item:', item.id, e);
    }
  }

  return sincronizados;
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
  if (!supabase || !usuarioId || !navigator.onLine) return;
  try {
    await supabase.from('posiciones_en_vivo').upsert({
      usuario_id: usuarioId,
      nombre,
      sucursal,
      lat,
      lng,
      accuracy,
      updated_at: new Date().toISOString()
    });
  } catch {}
}

export async function obtenerPosicionesEnVivoDB() {
  if (!supabase || !navigator.onLine) return [];
  try {
    const { data } = await supabase.from('posiciones_en_vivo').select('*');
    return data || [];
  } catch {
    return [];
  }
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