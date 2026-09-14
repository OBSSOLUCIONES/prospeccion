// src/App.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, MapPin, Zap, CheckCircle2, AlertCircle, Info } from 'lucide-react';

import { 
  CLIENTES_INICIALES, 
  OBRAS_INICIALES, 
  VISITAS_INICIALES, 
  MOVIMIENTOS_INICIALES, 
  USUARIOS_INICIALES 
} from './data/constants';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PipelineTab from './components/PipelineTab';
import ClientesTab from './components/ClientesTab';
import MapaTab from './components/MapaTab';
import ResumenKpis from './components/ResumenKpis';

import ModalExpedienteObra from './components/ModalExpedienteObra';
import ModalObra from './components/ModalObra';
import ModalVisita from './components/ModalVisita';
import ModalComercial from './components/ModalComercial';
import ModalCliente from './components/ModalCliente';
import ModalMapaPicker from './components/ModalMapaPicker';
import ModalVisor from './components/ModalVisor';
import ModalNavegacion from './components/ModalNavegacion';
import PantallaPin from './components/PantallaPin';
import SplashScreen from './components/SplashScreen';

import { 
  isSupabaseConfigured,
  obtenerClientesDB,
  guardarClienteDB,
  eliminarClienteDB,
  obtenerObrasDB,
  guardarObraDB,
  eliminarObraDB,
  obtenerVisitasDB,
  guardarVisitaDB,
  eliminarVisitaDB,
  obtenerMovimientosDB,
  guardarMovimientoDB,
  transmitirPosicionDB,
  obtenerPosicionesEnVivoDB,
  suscribirPosicionesEnVivo,
  suscribirCambiosGlobales,
  sincronizarColaOffline,
  contarItemsColaOffline,
  notificarToast
} from './lib/supabase';

function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatearFechaParaPowerBI(fechaStr) {
  if (!fechaStr) return { fecha_corta: null, id_fecha: null, hora: null, iso: null };
  const limpia = fechaStr.replace('T', ' ');
  const partes = limpia.split(' ');
  const fechaCorta = partes[0] || null;
  const hora = partes[1] || '00:00';
  const idFecha = fechaCorta ? Number(fechaCorta.replace(/-/g, '')) : null;
  const iso = fechaCorta ? `${fechaCorta}T${hora}:00` : null;
  return { fecha_corta: fechaCorta, id_fecha: idFecha, hora, iso };
}

function sanitizarAMayusculas(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const camposExcluidos = [
    'url', 'fotos', 'documentoAdjunto', 'ubicacion', 
    'createdAt', 'created_at', 'fecha', 'id_fecha', 'iso', 
    'lat', 'lng', 'latGpsReal', 'lngGpsReal', 
    'distanciaMetros', 'distanciaAuditoriaMetros', 'accuracy', 'monto'
  ];

  const res = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const [clave, valor] of Object.entries(res)) {
    if (camposExcluidos.includes(clave)) continue;
    if (typeof valor === 'string') {
      if (valor.startsWith('data:image/') || valor.startsWith('http://') || valor.startsWith('https://')) {
        continue;
      }
      res[clave] = valor.trim().toUpperCase();
    }
  }
  return res;
}

export default function App() {
  const [tab, setTab] = useState('pipeline');
  const [mostrarSplash, setMostrarSplash] = useState(true);
  
  // SISTEMA DE TOASTS NATIVOS
  const [toasts, setToasts] = useState([]);

  const agregarToast = useCallback((mensaje, tipo = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev.slice(-2), { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    const escucharToast = (e) => {
      if (e.detail && e.detail.mensaje) {
        agregarToast(e.detail.mensaje, e.detail.tipo || 'info');
      }
    };
    window.addEventListener('obs_toast', escucharToast);
    return () => window.removeEventListener('obs_toast', escucharToast);
  }, [agregarToast]);

  const [estaOnline, setEstaOnline] = useState(navigator.onLine);
  const [pendientesOffline, setPendientesOffline] = useState(0);

  const deviceIdRef = useRef((() => {
    let id = localStorage.getItem('obs_dispositivo_id');
    if (!id) {
      id = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem('obs_dispositivo_id', id);
    }
    return id;
  })());

  const [usuarioActivo, setUsuarioActivo] = useState(() => {
    const local = localStorage.getItem('app_obras_usuario_activo');
    return local ? JSON.parse(local) : null;
  });

  const [usuarios] = useState(USUARIOS_INICIALES);

  const [clientes, setClientes] = useState(() => {
    const local = localStorage.getItem('app_obras_clientes');
    return local ? JSON.parse(local) : CLIENTES_INICIALES;
  });

  const [obras, setObras] = useState(() => {
    const local = localStorage.getItem('app_obras_maestras');
    return local ? JSON.parse(local) : OBRAS_INICIALES;
  });

  const [visitas, setVisitas] = useState(() => {
    const local = localStorage.getItem('app_obras_bitacora_visitas');
    return local ? JSON.parse(local) : VISITAS_INICIALES;
  });

  const [movimientos, setMovimientos] = useState(() => {
    const local = localStorage.getItem('app_obras_movimientos_comerciales');
    return local ? JSON.parse(local) : MOVIMIENTOS_INICIALES;
  });

  const [asesoresEnVivo, setAsesoresEnVivo] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroFase, setFiltroFase] = useState('TODAS');
  const [filtroSucursal, setFiltroSucursal] = useState('TODAS');
  
  const [tabletPos, setTabletPos] = useState({ lat: 19.6642, lng: -101.1718, accuracy: 10 });
  const [gpsEstado, setGpsEstado] = useState('buscando');
  const ultimaTransmisionRef = useRef(0);

  // Modales
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [modalObraAbierto, setModalObraAbierto] = useState(false);
  const [obraAEditar, setObraAEditar] = useState(null);
  const [itemAEliminar, setItemAEliminar] = useState(null);

  const [modalVisitaAbierto, setModalVisitaAbierto] = useState(false);
  const [obraParaVisita, setObraParaVisita] = useState(null);
  const [visitaAEditar, setVisitaAEditar] = useState(null);

  const [modalComercialAbierto, setModalComercialAbierto] = useState(false);
  const [configComercial, setConfigComercial] = useState(null);

  const [modalCliente, setModalCliente] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);

  const [modalKpisAbierto, setModalKpisAbierto] = useState(false);
  const [visorModal, setVisorModal] = useState(null);
  const [mapaPickerConfig, setMapaPickerConfig] = useState(null);
  const [destinoRuta, setDestinoRuta] = useState(null);

  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  const algunModalAbierto = Boolean(
    obraSeleccionada || 
    modalObraAbierto || 
    modalVisitaAbierto || 
    modalComercialAbierto || 
    modalCliente || 
    modalKpisAbierto || 
    mapaPickerConfig || 
    visorModal || 
    destinoRuta ||
    itemAEliminar
  );

  // SCREEN WAKELOCK NATIVO: Evita que la pantalla se apague sola en campo o vehículo [1]
  useEffect(() => {
    let wakeLockInstance = null;
    const solicitarWakeLock = async () => {
      if ('wakeLock' in navigator && usuarioActivo) {
        try {
          wakeLockInstance = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.warn('WakeLock denegado o no soportado:', err);
        }
      }
    };

    solicitarWakeLock();

    const manejarVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        solicitarWakeLock();
      }
    };

    document.addEventListener('visibilitychange', manejarVisibilidad);

    return () => {
      document.removeEventListener('visibilitychange', manejarVisibilidad);
      if (wakeLockInstance) {
        wakeLockInstance.release().catch(() => {});
      }
    };
  }, [usuarioActivo]);

  const obraProxima = useMemo(() => {
    if (esDirector || !tabletPos?.lat || !tabletPos?.lng) return null;
    for (const o of obras) {
      if (!o.lat || !o.lng || o.estadoObra === 'TERMINADA') continue;
      const dist = calcularDistanciaMetros(tabletPos.lat, tabletPos.lng, o.lat, o.lng);
      if (dist <= 180) {
        return { obra: o, distancia: dist };
      }
    }
    return null;
  }, [tabletPos, obras, esDirector]);

  const refrescarConteoOffline = useCallback(async () => {
    const cant = await contarItemsColaOffline();
    setPendientesOffline(cant);
  }, []);

  const ejecutarSincronizacionOffline = useCallback(async () => {
    if (!navigator.onLine) return;
    setSincronizando(true);
    try {
      await sincronizarColaOffline();
      await refrescarConteoOffline();
    } catch (err) {
      console.warn('Error sincronizando cola offline:', err);
    } finally {
      setSincronizando(false);
    }
  }, [refrescarConteoOffline]);

  useEffect(() => {
    const manejarOnline = () => {
      setEstaOnline(true);
      notificarToast('🟢 Conexión a internet restablecida', 'exito');
      ejecutarSincronizacionOffline();
    };
    const manejarOffline = () => {
      setEstaOnline(false);
      notificarToast('🟡 Sin conexión: operando en modo local seguro', 'advertencia');
    };
    const manejarColaActualizada = () => refrescarConteoOffline();

    window.addEventListener('online', manejarOnline);
    window.addEventListener('offline', manejarOffline);
    window.addEventListener('obs_cola_actualizada', manejarColaActualizada);

    refrescarConteoOffline();

    return () => {
      window.removeEventListener('online', manejarOnline);
      window.removeEventListener('offline', manejarOffline);
      window.removeEventListener('obs_cola_actualizada', manejarColaActualizada);
    };
  }, [ejecutarSincronizacionOffline, refrescarConteoOffline]);

  const recargarDatosNube = useCallback(async () => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
      setSincronizando(true);
      const [clientesDB, obrasDB, visitasDB, movimientosDB] = await Promise.all([
        obtenerClientesDB(),
        obtenerObrasDB(),
        obtenerVisitasDB(),
        obtenerMovimientosDB()
      ]);

      if (Array.isArray(clientesDB)) setClientes(clientesDB);
      if (Array.isArray(obrasDB)) setObras(obrasDB);
      if (Array.isArray(visitasDB)) setVisitas(visitasDB);
      if (Array.isArray(movimientosDB)) setMovimientos(movimientosDB);

      const flota = await obtenerPosicionesEnVivoDB();
      setAsesoresEnVivo(flota);
    } catch (err) {
      console.warn('Error sincronizando con nube:', err);
    } finally {
      setSincronizando(false);
    }
  }, []);

  useEffect(() => {
    recargarDatosNube();

    if (isSupabaseConfigured) {
      const desuscribirCambios = suscribirCambiosGlobales(() => {
        recargarDatosNube();
      });

      const desuscribirFlota = suscribirPosicionesEnVivo((flota) => {
        setAsesoresEnVivo(flota);
      });

      return () => {
        desuscribirCambios();
        desuscribirFlota();
      };
    }
  }, [recargarDatosNube]);

  useEffect(() => { localStorage.setItem('app_obras_maestras', JSON.stringify(obras)); }, [obras]);
  useEffect(() => { localStorage.setItem('app_obras_bitacora_visitas', JSON.stringify(visitas)); }, [visitas]);
  useEffect(() => { localStorage.setItem('app_obras_movimientos_comerciales', JSON.stringify(movimientos)); }, [movimientos]);
  useEffect(() => { localStorage.setItem('app_obras_clientes', JSON.stringify(clientes)); }, [clientes]);

  useEffect(() => {
    if (usuarioActivo) {
      localStorage.setItem('app_obras_usuario_activo', JSON.stringify(usuarioActivo));
      setFiltroSucursal(usuarioActivo.sucursal === 'TODAS' ? 'TODAS' : usuarioActivo.sucursal);
    } else {
      localStorage.removeItem('app_obras_usuario_activo');
    }
  }, [usuarioActivo]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsEstado('bloqueado');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const precision = Math.round(pos.coords.accuracy);
        const nuevaPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: precision
        };
        setTabletPos(nuevaPos);
        setGpsEstado(precision <= 25 ? 'activo' : 'calibrando');

        const ahora = Date.now();
        if (usuarioActivo && ahora - ultimaTransmisionRef.current > 15000) {
          ultimaTransmisionRef.current = ahora;
          transmitirPosicionDB({
            usuarioId: usuarioActivo.id,
            nombre: usuarioActivo.nombre,
            sucursal: usuarioActivo.sucursal,
            lat: nuevaPos.lat,
            lng: nuevaPos.lng,
            accuracy: precision,
            deviceId: deviceIdRef.current
          });
        }
      },
      () => setGpsEstado('bloqueado'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [usuarioActivo]);

  const handleGuardarObra = async (nuevaObra) => {
    const obraLimpia = sanitizarAMayusculas(nuevaObra);
    if (obraAEditar) {
      setObras(prev => prev.map(o => o.id === obraAEditar.id ? obraLimpia : o));
      if (obraSeleccionada && obraSeleccionada.id === obraLimpia.id) setObraSeleccionada(obraLimpia);
      setObraAEditar(null);
    } else {
      setObras(prev => [obraLimpia, ...prev]);
    }
    await guardarObraDB(obraLimpia);
    refrescarConteoOffline();
  };

  const handleGuardarCliente = async (nuevoCliente) => {
    const clienteLimpio = sanitizarAMayusculas(nuevoCliente);
    if (clienteAEditar) {
      setClientes(prev => prev.map(c => c.id === clienteAEditar.id ? clienteLimpio : c));
      setClienteAEditar(null);
    } else {
      setClientes(prev => [clienteLimpio, ...prev]);
    }
    await guardarClienteDB(clienteLimpio);
    refrescarConteoOffline();
  };

  const ejecutarEliminacion = async () => {
    if (!itemAEliminar) return;

    if (itemAEliminar.tipo === 'obra') {
      const id = itemAEliminar.data.id;
      const visitasObra = visitas.filter(v => v.obraId === id);
      const movsObra = movimientos.filter(m => m.obraId === id);

      setObras(prev => prev.filter(o => o.id !== id));
      setVisitas(prev => prev.filter(v => v.obraId !== id));
      setMovimientos(prev => prev.filter(m => m.obraId !== id));
      if (obraSeleccionada && obraSeleccionada.id === id) setObraSeleccionada(null);

      await eliminarObraDB(id, { visitas: visitasObra, movimientos: movsObra });
    } else if (itemAEliminar.tipo === 'cliente') {
      const id = itemAEliminar.data.id;
      setClientes(prev => prev.filter(c => c.id !== id));
      await eliminarClienteDB(id);
    }

    setItemAEliminar(null);
    refrescarConteoOffline();
  };

  const handleGuardarVisita = async (nuevaVisita) => {
    const visitaLimpia = sanitizarAMayusculas(nuevaVisita);
    setVisitas(prev => {
      const existe = prev.some(v => v.id === visitaLimpia.id);
      if (existe) {
        return prev.map(v => v.id === visitaLimpia.id ? visitaLimpia : v);
      }
      return [visitaLimpia, ...prev];
    });

    setObras(prev => prev.map(o => {
      if (o.id === visitaLimpia.obraId) {
        const obraActualizada = { ...o, estatusFase: visitaLimpia.estatus };
        guardarObraDB(obraActualizada);
        if (obraSeleccionada && obraSeleccionada.id === o.id) setObraSeleccionada(obraActualizada);
        return obraActualizada;
      }
      return o;
    }));

    await guardarVisitaDB(visitaLimpia);
    setVisitaAEditar(null);
    refrescarConteoOffline();
  };

  const handleEliminarVisita = async (visitaId) => {
    const idLimpio = String(visitaId).trim().toUpperCase();
    const visitaABorrar = visitas.find(v => v.id === idLimpio);
    setVisitas(prev => prev.filter(v => v.id !== idLimpio));
    await eliminarVisitaDB(idLimpio, visitaABorrar?.fotos || []);
    refrescarConteoOffline();
  };

  const handleGuardarMovimiento = async (nuevoMov) => {
    const movLimpio = sanitizarAMayusculas(nuevoMov);

    setMovimientos(prev => {
      let listaActualizada = prev.map(m => m.id === movLimpio.id ? movLimpio : m);
      if (!prev.some(m => m.id === movLimpio.id)) {
        listaActualizada = [movLimpio, ...listaActualizada];
      }

      if (movLimpio.tipo === 'VENTA' && movLimpio.cotizacionOrigenId) {
        listaActualizada = listaActualizada.map(m => {
          if (m.id === movLimpio.cotizacionOrigenId) {
            const cotGanada = { ...m, estatus: 'GANADA' };
            guardarMovimientoDB(cotGanada);
            return cotGanada;
          }
          return m;
        });
      }

      return listaActualizada;
    });

    await guardarMovimientoDB(movLimpio);
    refrescarConteoOffline();
  };

  const handleVincularClienteAObra = async (obra) => {
    const nuevoClienteId = prompt('Ingresa el ID del cliente para vincular (ej. ALT01):', obra.clienteId || '');
    if (nuevoClienteId) {
      const existe = clientes.find(c => c.id === nuevoClienteId.trim().toUpperCase());
      if (existe) {
        const obraActualizada = { ...obra, clienteId: existe.id };
        setObras(prev => prev.map(o => o.id === obra.id ? obraActualizada : o));
        setObraSeleccionada(obraActualizada);
        await guardarObraDB(obraActualizada);
        refrescarConteoOffline();
        notificarToast(`✅ Obra vinculada con éxito a ${existe.nombreCliente}`, 'exito');
      } else {
        notificarToast('⚠️ No encontramos ningún cliente con ese ID', 'advertencia');
      }
    }
  };

  const exportarAExcel = () => {
    if (!esDirector) return;

    const obrasAExportar = filtroSucursal === 'TODAS'
      ? obras
      : obras.filter(o => o.sucursal === filtroSucursal);

    const clientesAExportar = filtroSucursal === 'TODAS'
      ? clientes
      : clientes.filter(c => c.sucursal === filtroSucursal);

    const hojaClientes = clientesAExportar.map(c => {
      const obrasCliente = obras.filter(o => o.clienteId === c.id);
      const obrasIds = obrasCliente.map(o => o.id);
      const movsCliente = movimientos.filter(m => obrasIds.includes(m.obraId));
      
      const totalCotizado = movsCliente
        .filter(m => m.tipo === 'COTIZACION')
        .reduce((sum, item) => sum + (Number(item.monto) || 0), 0);

      const totalVendido = movsCliente
        .filter(m => m.tipo === 'VENTA')
        .reduce((sum, item) => sum + (Number(item.monto) || 0), 0);

      const linkGoogleMaps = (c.lat && c.lng) 
        ? `https://www.google.com/maps?q=${c.lat},${c.lng}` 
        : (c.ubicacion || 'SIN UBICACIÓN');

      return {
        cliente_id: c.id,
        id_red_azul: c.idRedAzul || 'SIN_ID',
        nombre_cliente: c.nombreCliente,
        sucursal: c.sucursal,
        clasificacion_cliente: c.tipoCliente || 'PROSPECTO',
        tipo_mercado: c.tipoMercado || 'GENERAL',
        responsable_contacto: c.responsable || 'SIN ENCARGADO',
        telefono_contacto: c.contacto || 'SIN TELEFONO',
        correo_contacto: c.correo || 'SIN CORREO',
        total_obras_asociadas: obrasCliente.length,
        total_cotizado_mxn: totalCotizado,
        total_vendido_mxn: totalVendido,
        link_ubicacion_maps: linkGoogleMaps,
        direccion_fiscal: c.direccion || ''
      };
    });

    const hojaObras = obrasAExportar.map(o => {
      const cli = clientes.find(c => c.id === o.clienteId);
      const visObra = visitas.filter(v => v.obraId === o.id);
      const movsObra = movimientos.filter(m => m.obraId === o.id);
      
      const ultima = visObra.sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')))[0];
      const diasSinVisita = ultima 
        ? Math.max(0, Math.floor((Date.now() - new Date(ultima.fecha.replace(' ', 'T')).getTime()) / (1000 * 3600 * 24)))
        : 999;

      const totalCotizado = movsObra.filter(m => m.tipo === 'COTIZACION').reduce((s, c) => s + (Number(c.monto) || 0), 0);
      const totalVendido = movsObra.filter(m => m.tipo === 'VENTA').reduce((s, v) => s + (Number(v.monto) || 0), 0);

      const fInfo = formatearFechaParaPowerBI(ultima ? ultima.fecha : null);
      const linkGoogleMapsObra = (o.lat && o.lng) 
        ? `https://www.google.com/maps?q=${o.lat},${o.lng}` 
        : 'SIN UBICACIÓN';

      return {
        obra_id: o.id,
        cliente_id: o.clienteId || 'SIN_CLIENTE',
        nombre_obra: o.nombre,
        sucursal: o.sucursal,
        tipo_desarrollo: o.tipoDesarrollo || 'OBRA NUEVA',
        fase_constructiva: o.estatusFase,
        estado_comercial: o.estadoObra || 'ACTIVA',
        nombre_cliente: cli ? cli.nombreCliente : 'SIN ASIGNAR',
        responsable_cliente: cli?.responsable || 'SIN DATO',
        telefono_cliente: cli?.contacto || 'SIN DATO',
        total_visitas: visObra.length,
        dias_sin_visita: diasSinVisita,
        alerta_obra_fria: diasSinVisita > 12 ? 'SI' : 'NO',
        fecha_ultima_visita_iso: fInfo.iso,
        fecha_corta_ultima_visita: fInfo.fecha_corta,
        id_fecha_ultima_visita: fInfo.id_fecha,
        total_cotizado_mxn: totalCotizado,
        total_vendido_mxn: totalVendido,
        link_ubicacion_maps: linkGoogleMapsObra,
        direccion: o.direccion || ''
      };
    });

    const hojaVisitas = visitas
      .filter(v => filtroSucursal === 'TODAS' || v.sucursal === filtroSucursal)
      .map(v => {
        const fInfo = formatearFechaParaPowerBI(v.fecha);
        const linkGpsVisita = (v.latGpsReal && v.lngGpsReal)
          ? `https://www.google.com/maps?q=${v.latGpsReal},${v.lngGpsReal}`
          : 'SIN COORDENADAS';

        const fotosLista = Array.isArray(v.fotos) ? v.fotos : [];

        return {
          visita_id: v.id,
          obra_id: v.obraId,
          sucursal: v.sucursal,
          asesor_nombre: v.asesorNombre || 'Asesor',
          fecha_hora_iso: fInfo.iso,
          fecha_corta: fInfo.fecha_corta,
          id_fecha: fInfo.id_fecha,
          hora_registro: fInfo.hora,
          fase_detectada: v.estatus,
          actividad: v.actividad,
          distancia_auditoria_metros: Number(v.distanciaAuditoriaMetros) || 0,
          estado_auditoria_gps: v.auditoriaEstado || 'remoto',
          link_gps_auditoria: linkGpsVisita,
          link_foto_1: fotosLista[0] || 'SIN FOTO',
          link_foto_2: fotosLista[1] || '',
          link_foto_3: fotosLista[2] || '',
          todos_los_links_fotos: fotosLista.join(' | '),
          observaciones: v.observaciones || ''
        };
      });

    const obrasIdsValidas = obrasAExportar.map(o => o.id);
    const hojaMovimientos = movimientos
      .filter(m => obrasIdsValidas.includes(m.obraId))
      .map(m => {
        const fInfo = formatearFechaParaPowerBI(m.fecha);
        const linkDoc = m.documentoAdjunto?.url || m.documento_adjunto?.url || 'SIN DOCUMENTO';

        return {
          movimiento_id: m.id,
          obra_id: m.obraId,
          tipo_movimiento: m.tipo,
          tipo_comprobante: m.comprobante || (m.tipo === 'VENTA' ? 'REMISION' : 'COTIZACION'),
          folio_documento: m.folio,
          monto_mxn: Number(m.monto) || 0,
          estatus: m.estatus || 'PENDIENTE',
          forma_pago: m.formaPago || 'N/A',
          tipo_entrega: m.tipoEntrega || 'DOMICILIO',
          fecha_hora_iso: fInfo.iso,
          fecha_corta: fInfo.fecha_corta,
          id_fecha: fInfo.id_fecha,
          hora_registro: fInfo.hora,
          cotizacion_origen_id: m.cotizacionOrigenId || 'DIRECTA',
          link_documento_adjunto: linkDoc
        };
      });

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaClientes), 'Dim_Clientes');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaObras), 'Dim_Obras');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaVisitas), 'Fact_Visitas');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaMovimientos), 'Fact_Movimientos');

    const fechaHoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `PowerBI_Prospeccion_OBS_${filtroSucursal}_${fechaHoy}.xlsx`);
    notificarToast('📊 Reporte Excel Power BI generado', 'exito');
  };

  const hoyStr = new Date().toISOString().slice(0, 10);
  const visitasHoy = visitas.filter(v => v.fecha && v.fecha.startsWith(hoyStr)).length;
  const metaDiaria = 5;
  const porcentajeMeta = Math.min(100, Math.round((visitasHoy / metaDiaria) * 100));
  const totalMontoCotizaciones = movimientos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  const ventasCerradasTotal = movimientos.filter(m => m.tipo === 'VENTA').length;
  const totalObrasFrias = obras.filter(o => {
    const vList = visitas.filter(v => v.obraId === o.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (!vList.length) return true;
    const diff = Math.floor((Date.now() - new Date(vList[0].fecha.replace(' ', 'T')).getTime()) / (1000 * 3600 * 24));
    return diff > 12;
  }).length;

  if (mostrarSplash) {
    return <SplashScreen onFinish={() => setMostrarSplash(false)} />;
  }

  if (!usuarioActivo) {
    return <PantallaPin usuarios={usuarios} onLogin={(u) => setUsuarioActivo(u)} />;
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-slate-900 pb-28 pt-[58px] sm:pt-[70px] font-sans">
      
      {/* CONTENEDOR DE NOTIFICACIONES TOAST NATIVAS */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-black animate-in fade-in slide-in-from-top duration-200 backdrop-blur-xl ${
              t.tipo === 'exito'
                ? 'bg-[#000b26]/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40'
                : t.tipo === 'error'
                ? 'bg-[#000b26]/95 text-rose-300 border-rose-500/50 shadow-rose-950/40'
                : t.tipo === 'advertencia'
                ? 'bg-[#000b26]/95 text-amber-300 border-amber-500/50 shadow-amber-950/40'
                : 'bg-[#000b26]/95 text-blue-300 border-[#0091FB]/50 shadow-blue-950/40'
            }`}
          >
            {t.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.tipo === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {t.tipo === 'advertencia' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {t.tipo === 'info' && <Info className="w-4 h-4 text-[#0091FB] shrink-0" />}
            <span className="truncate">{t.mensaje}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <Header 
        gpsEstado={gpsEstado} 
        tabletPos={tabletPos} 
        onExportarExcel={exportarAExcel}
        sincronizando={sincronizando}
        usuarioActivo={usuarioActivo}
        onLogout={() => setUsuarioActivo(null)}
        onAbrirKpis={() => setModalKpisAbierto(true)}
        filtroSucursal={filtroSucursal}
        setFiltroSucursal={setFiltroSucursal}
        estaOnline={estaOnline}
        pendientesOffline={pendientesOffline}
        onForzarSincronizacion={ejecutarSincronizacionOffline}
      />

      {/* DYNAMIC ISLAND */}
      {obraProxima && !algunModalAbierto && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-2.5">
          <div className="p-3.5 bg-[#000b26]/95 text-white rounded-3xl shadow-lg border border-slate-700/60 backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <MapPin className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  📍 Estás en la obra ({obraProxima.distancia}m)
                </span>
                <h4 className="text-xs sm:text-sm font-black truncate text-white mt-0.5">{obraProxima.obra.nombre}</h4>
                <p className="text-[10px] text-slate-400 truncate">{obraProxima.obra.sucursal} • {obraProxima.obra.estatusFase}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVisitaAEditar(null);
                setObraParaVisita(obraProxima.obra);
                setModalVisitaAbierto(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md shrink-0 transition-all flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Check-in</span>
            </button>
          </div>
        </div>
      )}

      {/* CONTENEDOR MAESTRO */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1 space-y-3">
        {tab === 'pipeline' && (
          <PipelineTab 
            obras={obras}
            visitas={visitas}
            movimientos={movimientos}
            clientes={clientes}
            search={search}
            setSearch={setSearch}
            filtroFase={filtroFase}
            setFiltroFase={setFiltroFase}
            filtroSucursal={filtroSucursal}
            setFiltroSucursal={setFiltroSucursal}
            onSeleccionarObra={(o) => setObraSeleccionada(o)}
            onNuevaObra={() => { setObraAEditar(null); setModalObraAbierto(true); }}
            onEditarObra={(o) => { setObraAEditar(o); setModalObraAbierto(true); }}
            onEliminarObra={(o) => setItemAEliminar({ tipo: 'obra', data: o })}
            usuarioActivo={usuarioActivo}
            tabletPos={tabletPos}
            onNuevaVisita={(obra) => {
              setVisitaAEditar(null);
              setObraParaVisita(obra);
              setModalVisitaAbierto(true);
            }}
            onNuevoMovimiento={({ obra, tipo }) => {
              setConfigComercial({ obra, tipo });
              setModalComercialAbierto(true);
            }}
            onNuevoCliente={() => {
              setClienteAEditar(null);
              setModalCliente(true);
            }}
          />
        )}

        {tab === 'clientes' && (
          <ClientesTab 
            clientes={clientes}
            onNuevoCliente={() => {
              setClienteAEditar(null);
              setModalCliente(true);
            }}
            onEditarCliente={(c) => { 
              setClienteAEditar(c); 
              setModalCliente(true); 
            }}
            onEliminarCliente={(c) => setItemAEliminar({ tipo: 'cliente', data: c })}
            onAbrirRuta={setDestinoRuta}
            esDirector={esDirector}
            filtroSucursal={filtroSucursal}
          />
        )}

        {tab === 'mapa' && esDirector && (
          <MapaTab 
            tabletPos={tabletPos}
            obras={obras}
            visitas={visitas}
            clientes={clientes}
            onAbrirRuta={setDestinoRuta}
            filtroSucursal={filtroSucursal}
            setFiltroSucursal={setFiltroSucursal}
            asesoresEnVivo={asesoresEnVivo}
            usuarioActivo={usuarioActivo}
            deviceId={deviceIdRef.current}
          />
        )}
      </main>

      {/* BARRA INFERIOR */}
      <BottomNav tab={tab} setTab={setTab} usuarioActivo={usuarioActivo} />

      {/* MODALES */}
      <ResumenKpis
        isOpen={modalKpisAbierto}
        onClose={() => setModalKpisAbierto(false)}
        sucursal={filtroSucursal}
        visitasHoy={visitasHoy}
        metaDiaria={metaDiaria}
        porcentajeMeta={porcentajeMeta}
        totalMonto={totalMontoCotizaciones}
        totalObras={obras.length}
        ventasCerradas={ventasCerradasTotal}
        totalObrasFrias={totalObrasFrias}
        esDirector={esDirector}
        visitas={visitas}
        obras={obras}
        movimientos={movimientos}
        onSeleccionarSucursal={(suc) => setFiltroSucursal(suc)}
      />

      <ModalExpedienteObra
        isOpen={Boolean(obraSeleccionada)}
        onClose={() => setObraSeleccionada(null)}
        obra={obraSeleccionada}
        visitas={visitas}
        movimientos={movimientos}
        clientes={clientes}
        onNuevaVisita={(obra) => {
          setVisitaAEditar(null);
          setObraParaVisita(obra);
          setModalVisitaAbierto(true);
        }}
        onEditarVisita={(visita) => {
          setVisitaAEditar(visita);
          setObraParaVisita(obras.find(o => o.id === visita.obraId) || obraSeleccionada);
          setModalVisitaAbierto(true);
        }}
        onEliminarVisita={handleEliminarVisita}
        onNuevoMovimiento={({ obra, tipo }) => {
          setConfigComercial({ obra, tipo });
          setModalComercialAbierto(true);
        }}
        onEditarObra={(obra) => {
          setObraAEditar(obra);
          setModalObraAbierto(true);
        }}
        onEliminarObra={(obra) => {
          setItemAEliminar({ tipo: 'obra', data: obra });
        }}
        onVerVisor={setVisorModal}
        onAbrirRuta={setDestinoRuta}
        onVincularCliente={handleVincularClienteAObra}
        onGuardarMovimientoDirecto={handleGuardarMovimiento}
      />

      <ModalObra
        isOpen={modalObraAbierto}
        onClose={() => { setModalObraAbierto(false); setObraAEditar(null); }}
        onSave={handleGuardarObra}
        obraAEditar={obraAEditar}
        clientes={clientes}
        obras={obras}
        tabletPos={tabletPos}
        onAbrirMapaPicker={(config) => setMapaPickerConfig(config)}
        usuarioActivo={usuarioActivo}
      />

      <ModalCliente
        isOpen={modalCliente}
        onClose={() => { setModalCliente(false); setClienteAEditar(null); }}
        onSave={handleGuardarCliente}
        clientes={clientes}
        clienteAEditar={clienteAEditar}
        tabletPos={tabletPos}
        onAbrirMapaPicker={(config) => setMapaPickerConfig(config)}
        usuarioActivo={usuarioActivo}
      />

      <ModalVisita
        isOpen={modalVisitaAbierto}
        onClose={() => { setModalVisitaAbierto(false); setObraParaVisita(null); setVisitaAEditar(null); }}
        obra={obraParaVisita}
        onSave={handleGuardarVisita}
        tabletPos={tabletPos}
        usuarioActivo={usuarioActivo}
        visitaAEditar={visitaAEditar}
      />

      <ModalComercial
        isOpen={modalComercialAbierto}
        onClose={() => { setModalComercialAbierto(false); setConfigComercial(null); }}
        obra={configComercial?.obra}
        tipoDefault={configComercial?.tipo || 'COTIZACION'}
        movimientos={movimientos}
        onSave={handleGuardarMovimiento}
      />

      {mapaPickerConfig && (
        <ModalMapaPicker 
          isOpen={true}
          onClose={() => setMapaPickerConfig(null)}
          initialPos={mapaPickerConfig.initialPos}
          tabletPos={tabletPos}
          onConfirm={(pos) => {
            mapaPickerConfig.onConfirm(pos);
            setMapaPickerConfig(null);
          }}
        />
      )}

      <ModalNavegacion 
        isOpen={Boolean(destinoRuta)}
        onClose={() => setDestinoRuta(null)}
        destino={destinoRuta}
      />

      <ModalVisor 
        visorModal={visorModal}
        onClose={() => setVisorModal(null)}
      />

      {itemAEliminar && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                ¿Eliminar {itemAEliminar.tipo === 'obra' ? 'esta Obra' : 'este Cliente'}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estás a punto de borrar a: <br />
                <strong className="text-slate-900 font-black">
                  {itemAEliminar.data.nombre || itemAEliminar.data.nombreCliente}
                </strong>
                {itemAEliminar.tipo === 'obra' && (
                  <span className="block text-[11px] text-rose-600 font-bold mt-1">
                    ⚠️ Se eliminarán de Supabase sus visitas, ventas, fotos y documentos físicos automáticamente.
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:scale-95 transition-all">
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacion}
                className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/25 active:scale-95 transition-all">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}