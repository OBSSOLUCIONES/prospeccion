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

// DISPARADOR DE NOTIFICACIONES TOAST NATIVAS
export function notificarToast(mensaje, tipo = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('obs_toast', { detail: { mensaje, tipo } }));
  }
}

function extraerRutaStorage(url, bucket = 'evidencias-obras') {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:image/') || !url.includes('/storage/v1/object/public/')) {
    if (url.startsWith('fotos/') || url.startsWith('documentos/')) return url;
    return null;
  }

  const partes = url.split(`${bucket}/`);
  if (partes.length > 1) {
    return decodeURIComponent(partes[1]);
  }
  return null;
}

async function eliminarArchivosFisicosStorage(listaUrls = []) {
  if (!supabase || !listaUrls.length) return;
  const rutas = listaUrls
    .map(url => extraerRutaStorage(url))
    .filter(Boolean);

  if (!rutas.length) return;

  try {
    await supabase.storage
      .from('evidencias-obras')
      .remove(rutas);
    console.log(`✅ ${rutas.length} archivo(s) eliminados del Storage`);
  } catch (err) {
    console.warn('Aviso borrando archivos de Storage:', err);
  }
}

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
      notificarToast('📡 Sin señal: guardado localmente en la tablet', 'advertencia');
      return;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(accion);
    tx.oncomplete = () => {
      window.dispatchEvent(new Event('obs_cola_actualizada'));
      notificarToast('📡 Sin señal: guardado localmente en la tablet', 'advertencia');
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

export async function subirArchivoSupabase(file, folder = 'fotos') {
  const archivoAEnviar = await comprimirImagen(file);

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
      console.warn('Fallo subiendo foto a Storage, guardando local:', uploadError);
      return await convertirArchivoABase64(archivoAEnviar);
    }

    const { data } = supabase.storage.from('evidencias-obras').getPublicUrl(nombreLimpio);
    return data.publicUrl;
  } catch {
    return await convertirArchivoABase64(archivoAEnviar);
  }
}

// ==========================================
// AUTO-ADAPTADOR INTELIGENTE RESILIENTE
// ==========================================
async function ejecutarUpsertSeguro(tabla, filaOriginal) {
  if (!supabase) return { ok: false, error: 'No supabase' };
  let fila = { ...filaOriginal };
  let intentos = 0;

  while (intentos < 5) {
    intentos++;
    const { error } = await supabase.from(tabla).upsert(fila);
    if (!error) {
      return { ok: true };
    }

    const matchColumnaInexistente = error.message.match(/could not find the '([^']+)' column/i) 
      || error.message.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
    
    if (matchColumnaInexistente) {
      const colABorrar = matchColumnaInexistente[1];
      delete fila[colABorrar];
      continue;
    }

    const matchColumnaNotNull = error.message.match(/null value in column "([^"]+)"/i);
    if (matchColumnaNotNull) {
      const colFaltante = matchColumnaNotNull[1];
      fila[colFaltante] = colFaltante.includes('id') ? 'SIN_ID' : 'OBRA NUEVA';
      continue;
    }

    if (error.message.includes('cliente_id') || error.code === '23503') {
      fila.cliente_id = null;
      continue;
    }

    notificarToast(`⚠️ Error en ${tabla}: ${error.message}`, 'error');
    return { ok: false, error };
  }

  return { ok: false, error: 'Demasiados intentos' };
}

// ==========================================
// CRUD CLIENTES
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
    id: String(cliente.id).trim().toUpperCase(),
    sucursal: String(cliente.sucursal || 'ALTOZANO').trim().toUpperCase(),
    id_red_azul: cliente.idRedAzul ? String(cliente.idRedAzul).trim().toUpperCase() : null,
    nombre_cliente: String(cliente.nombreCliente || '').trim().toUpperCase(),
    tipo_cliente: String(cliente.tipoCliente || 'PROSPECTO').trim().toUpperCase(),
    tipo_mercado: cliente.tipoMercado ? String(cliente.tipoMercado).trim().toUpperCase() : null,
    responsable: String(cliente.responsable || '').trim().toUpperCase(),
    contacto: cliente.contacto ? String(cliente.contacto).trim() : null,
    correo: cliente.correo ? String(cliente.correo).trim().toLowerCase() : null,
    direccion: cliente.direccion ? String(cliente.direccion).trim().toUpperCase() : null,
    lat: (cliente.lat !== null && cliente.lat !== undefined && !isNaN(Number(cliente.lat))) ? Number(cliente.lat) : null,
    lng: (cliente.lng !== null && cliente.lng !== undefined && !isNaN(Number(cliente.lng))) ? Number(cliente.lng) : null,
    ubicacion: cliente.ubicacion || null
  };

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `cli_${fila.id}_${Date.now()}`, tabla: 'clientes', datos: fila });
    return;
  }

  const res = await ejecutarUpsertSeguro('clientes', fila);
  if (!res.ok) {
    await encolarAccionOffline({ id: `cli_${fila.id}_${Date.now()}`, tabla: 'clientes', datos: fila });
  } else {
    notificarToast('✅ Cliente guardado en la nube', 'exito');
  }
}

export async function eliminarClienteDB(id) {
  const idLimpio = String(id).trim().toUpperCase();
  if (!supabase || !navigator.onLine) {
    await encolarAccionOffline({ id: `del_cli_${idLimpio}_${Date.now()}`, tabla: 'clientes_delete', datos: { id: idLimpio } });
    return;
  }
  try {
    const { error } = await supabase.from('clientes').delete().eq('id', idLimpio);
    if (error) {
      notificarToast(`⚠️ Error eliminando cliente: ${error.message}`, 'error');
      await encolarAccionOffline({ id: `del_cli_${idLimpio}_${Date.now()}`, tabla: 'clientes_delete', datos: { id: idLimpio } });
    } else {
      notificarToast('🗑️ Cliente eliminado de Supabase', 'info');
    }
  } catch {
    await encolarAccionOffline({ id: `del_cli_${idLimpio}_${Date.now()}`, tabla: 'clientes_delete', datos: { id: idLimpio } });
  }
}

// ==========================================
// CRUD OBRAS
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
      nombre: o.nombre || o.proyecto || '',
      sucursal: o.sucursal,
      clienteId: o.cliente_id || null,
      tipoDesarrollo: o.tipo_desarrollo || 'OBRA NUEVA',
      estatusFase: o.estatus_fase || 'CIMENTACIÓN',
      estadoObra: o.estado_obra || 'ACTIVA',
      direccion: o.direccion || o.direccion_obra || '',
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
    id: String(obra.id).trim().toUpperCase(),
    nombre: String(obra.nombre || '').trim().toUpperCase(),
    sucursal: String(obra.sucursal || 'ALTOZANO').trim().toUpperCase(),
    cliente_id: (obra.clienteId && String(obra.clienteId).trim() !== '' && obra.clienteId !== 'SIN_CLIENTE') 
      ? String(obra.clienteId).trim().toUpperCase() 
      : null,
    tipo_desarrollo: String(obra.tipoDesarrollo || 'OBRA NUEVA').trim().toUpperCase(),
    estatus_fase: String(obra.estatusFase || 'CIMENTACIÓN').trim().toUpperCase(),
    estado_obra: String(obra.estadoObra || 'ACTIVA').trim().toUpperCase(),
    direccion: obra.direccion ? String(obra.direccion).trim().toUpperCase() : null,
    lat: (obra.lat !== null && obra.lat !== undefined && !isNaN(Number(obra.lat))) ? Number(obra.lat) : null,
    lng: (obra.lng !== null && obra.lng !== undefined && !isNaN(Number(obra.lng))) ? Number(obra.lng) : null
  };

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `obr_${fila.id}_${Date.now()}`, tabla: 'obras', datos: fila });
    return;
  }

  const res = await ejecutarUpsertSeguro('obras', fila);
  if (!res.ok) {
    await encolarAccionOffline({ id: `obr_${fila.id}_${Date.now()}`, tabla: 'obras', datos: fila });
  } else {
    notificarToast('✅ Obra guardada en la nube', 'exito');
  }
}

export async function eliminarObraDB(id, contextoLocal = {}) {
  const idLimpio = String(id).trim().toUpperCase();

  if (!supabase || !navigator.onLine) {
    await encolarAccionOffline({ id: `del_obr_${idLimpio}_${Date.now()}`, tabla: 'obras_delete', datos: { id: idLimpio } });
    return;
  }

  try {
    let urlsAEliminar = [];

    if (Array.isArray(contextoLocal.visitas)) {
      contextoLocal.visitas.forEach(v => {
        if (Array.isArray(v.fotos)) urlsAEliminar.push(...v.fotos);
      });
    }
    if (Array.isArray(contextoLocal.movimientos)) {
      contextoLocal.movimientos.forEach(m => {
        if (m.documentoAdjunto?.url) urlsAEliminar.push(m.documentoAdjunto.url);
      });
    }

    const [{ data: visitasDB }, { data: movsDB }] = await Promise.all([
      supabase.from('visitas').select('fotos').eq('obra_id', idLimpio),
      supabase.from('movimientos_comerciales').select('documento_adjunto').eq('obra_id', idLimpio)
    ]);

    if (Array.isArray(visitasDB)) {
      visitasDB.forEach(v => {
        if (Array.isArray(v.fotos)) urlsAEliminar.push(...v.fotos);
      });
    }

    if (Array.isArray(movsDB)) {
      movsDB.forEach(m => {
        if (m.documento_adjunto?.url) urlsAEliminar.push(m.documento_adjunto.url);
      });
    }

    if (urlsAEliminar.length > 0) {
      await eliminarArchivosFisicosStorage(urlsAEliminar);
    }

    await supabase.from('movimientos_comerciales').delete().eq('obra_id', idLimpio);
    await supabase.from('visitas').delete().eq('obra_id', idLimpio);
    const { error } = await supabase.from('obras').delete().eq('id', idLimpio);

    if (error) {
      notificarToast(`⚠️ Error eliminando obra: ${error.message}`, 'error');
      await encolarAccionOffline({ id: `del_obr_${idLimpio}_${Date.now()}`, tabla: 'obras_delete', datos: { id: idLimpio } });
    } else {
      notificarToast('🗑️ Obra y archivos destruidos con éxito', 'info');
    }
  } catch (err) {
    await encolarAccionOffline({ id: `del_obr_${idLimpio}_${Date.now()}`, tabla: 'obras_delete', datos: { id: idLimpio } });
  }
}

// ==========================================
// CRUD VISITAS
// ==========================================
export async function obtenerVisitasDB() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const { data, error } = await supabase.from('visitas').select('*').order('created_at', { ascending: false });
    if (error) return null;
    return data.map(v => ({
      id: v.id,
      obraId: v.obra_id || v.proyecto,
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
  const nombreProyecto = String(visita.obraNombre || visita.proyecto || visita.obraId || 'OBRA').trim().toUpperCase();

  const fila = {
    id: String(visita.id).trim().toUpperCase(),
    obra_id: String(visita.obraId).trim().toUpperCase(),
    proyecto: nombreProyecto,
    tipo_desarrollo: String(visita.tipoDesarrollo || 'OBRA NUEVA').trim().toUpperCase(),
    sucursal: String(visita.sucursal || 'ALTOZANO').trim().toUpperCase(),
    fecha: String(visita.fecha || '').trim(),
    asesor_nombre: String(visita.asesorNombre || 'ASESOR').trim().toUpperCase(),
    estatus: String(visita.estatus || 'CIMENTACIÓN').trim().toUpperCase(),
    actividad: String(visita.actividad || 'SUPERVISIÓN TÉCNICA').trim().toUpperCase(),
    observaciones: visita.observaciones ? String(visita.observaciones).trim().toUpperCase() : null,
    fotos: Array.isArray(visita.fotos) ? visita.fotos : [],
    lat_gps_real: (visita.latGpsReal !== null && visita.latGpsReal !== undefined && !isNaN(Number(visita.latGpsReal))) ? Number(visita.latGpsReal) : null,
    lng_gps_real: (visita.lngGpsReal !== null && visita.lngGpsReal !== undefined && !isNaN(Number(visita.lngGpsReal))) ? Number(visita.lngGpsReal) : null,
    distancia_auditoria_metros: Number(visita.distanciaAuditoriaMetros) || 0,
    auditoria_estado: String(visita.auditoriaEstado || 'remoto').toLowerCase()
  };

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `vis_${fila.id}_${Date.now()}`, tabla: 'visitas', datos: fila });
    return;
  }

  const res = await ejecutarUpsertSeguro('visitas', fila);
  if (!res.ok) {
    await encolarAccionOffline({ id: `vis_${fila.id}_${Date.now()}`, tabla: 'visitas', datos: fila });
  } else {
    notificarToast('✅ Check-in registrado en Supabase', 'exito');
  }
}

export async function eliminarVisitaDB(id, fotosLocales = []) {
  const idLimpio = String(id).trim().toUpperCase();
  if (!supabase || !navigator.onLine) {
    await encolarAccionOffline({ id: `del_vis_${idLimpio}_${Date.now()}`, tabla: 'visitas_delete', datos: { id: idLimpio } });
    return;
  }
  try {
    let fotosABorrar = Array.isArray(fotosLocales) ? [...fotosLocales] : [];
    const { data: visitaDB } = await supabase.from('visitas').select('fotos').eq('id', idLimpio).maybeSingle();
    if (visitaDB && Array.isArray(visitaDB.fotos)) {
      fotosABorrar.push(...visitaDB.fotos);
    }
    if (fotosABorrar.length > 0) {
      await eliminarArchivosFisicosStorage(fotosABorrar);
    }

    const { error } = await supabase.from('visitas').delete().eq('id', idLimpio);
    if (error) {
      notificarToast(`⚠️ Error eliminando visita: ${error.message}`, 'error');
      await encolarAccionOffline({ id: `del_vis_${idLimpio}_${Date.now()}`, tabla: 'visitas_delete', datos: { id: idLimpio } });
    } else {
      notificarToast('🗑️ Visita eliminada de Supabase', 'info');
    }
  } catch (err) {
    await encolarAccionOffline({ id: `del_vis_${idLimpio}_${Date.now()}`, tabla: 'visitas_delete', datos: { id: idLimpio } });
  }
}

// ==========================================
// CRUD MOVIMIENTOS COMERCIALES
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
    id: String(mov.id).trim().toUpperCase(),
    obra_id: String(mov.obraId).trim().toUpperCase(),
    tipo: String(mov.tipo || 'COTIZACION').trim().toUpperCase(),
    comprobante: String(mov.comprobante || (mov.tipo === 'VENTA' ? 'REMISIÓN' : 'COTIZACIÓN')).trim().toUpperCase(),
    folio: String(mov.folio || '').trim().toUpperCase(),
    monto: Number(mov.monto) || 0,
    estatus: String(mov.estatus || 'PENDIENTE').trim().toUpperCase(),
    forma_pago: String(mov.formaPago || 'N/A').trim().toUpperCase(),
    tipo_entrega: String(mov.tipoEntrega || 'DOMICILIO').trim().toUpperCase(),
    fecha: String(mov.fecha || '').trim(),
    documento_adjunto: mov.documentoAdjunto || null,
    observaciones: mov.observaciones ? String(mov.observaciones).trim().toUpperCase() : null,
    cotizacion_origen_id: mov.cotizacionOrigenId ? String(mov.cotizacionOrigenId).trim().toUpperCase() : null
  };

  if (!navigator.onLine || !supabase) {
    await encolarAccionOffline({ id: `mov_${fila.id}_${Date.now()}`, tabla: 'movimientos', datos: fila });
    return;
  }

  const res = await ejecutarUpsertSeguro('movimientos_comerciales', fila);
  if (!res.ok) {
    await encolarAccionOffline({ id: `mov_${fila.id}_${Date.now()}`, tabla: 'movimientos', datos: fila });
  } else {
    notificarToast(`✅ ${fila.comprobante} guardada en Supabase`, 'exito');
  }
}

// ==========================================
// RASTREO SATELITAL CON HUELLA DE DISPOSITIVO
// ==========================================
export async function transmitirPosicionDB({ usuarioId, nombre, sucursal, lat, lng, accuracy, deviceId }) {
  if (!supabase || !usuarioId || !navigator.onLine) return;
  try {
    const fila = {
      usuario_id: usuarioId,
      nombre,
      sucursal,
      lat: Number(lat),
      lng: Number(lng),
      accuracy: Number(accuracy) || 10,
      device_id: deviceId || null,
      updated_at: new Date().toISOString()
    };
    await ejecutarUpsertSeguro('posiciones_en_vivo', fila);
  } catch (err) {
    console.warn('Fallo transmitiendo ubicación:', err);
  }
}

export async function obtenerPosicionesEnVivoDB() {
  if (!supabase || !navigator.onLine) return [];
  try {
    const { data, error } = await supabase.from('posiciones_en_vivo').select('*');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export function suscribirPosicionesEnVivo(onUpdate) {
  if (!supabase) return () => {};
  const canal = supabase
    .channel('rastreo-flota-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posiciones_en_vivo' }, async () => {
      const flotaActualizada = await obtenerPosicionesEnVivoDB();
      onUpdate(flotaActualizada);
    })
    .subscribe();

  return () => supabase.removeChannel(canal);
}

// ==========================================
// SINCRONIZADOR DE COLA OFFLINE
// ==========================================
export async function sincronizarColaOffline() {
  if (!navigator.onLine || !supabase) return 0;
  const pendientes = await obtenerItemsColaOffline();
  if (!pendientes.length) return 0;

  let sincronizados = 0;

  for (const item of pendientes) {
    try {
      if (item.tabla === 'obras') {
        const res = await ejecutarUpsertSeguro('obras', item.datos);
        if (res.ok) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'obras_delete') {
        await eliminarObraDB(item.datos.id);
        await eliminarItemColaOffline(item.id);
        sincronizados++;
      } else if (item.tabla === 'clientes') {
        const res = await ejecutarUpsertSeguro('clientes', item.datos);
        if (res.ok) {
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
        const res = await ejecutarUpsertSeguro('visitas', filaVisita);
        if (res.ok) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      } else if (item.tabla === 'visitas_delete') {
        await eliminarVisitaDB(item.datos.id);
        await eliminarItemColaOffline(item.id);
        sincronizados++;
      } else if (item.tabla === 'movimientos') {
        const res = await ejecutarUpsertSeguro('movimientos_comerciales', item.datos);
        if (res.ok) {
          await eliminarItemColaOffline(item.id);
          sincronizados++;
        }
      }
    } catch (e) {
      console.warn('Error sincronizando item:', item.id, e);
    }
  }

  if (sincronizados > 0) {
    notificarToast(`🚀 ${sincronizados} registro(s) sincronizados con la nube`, 'exito');
  }

  return sincronizados;
}

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