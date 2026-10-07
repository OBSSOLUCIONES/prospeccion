// src/App.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  AlertTriangle, MapPin, Zap, CheckCircle2, AlertCircle, Info, Compass, 
  Download, FileSpreadsheet, X, Globe 
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { 
  CLIENTES_INICIALES, 
  OBRAS_INICIALES, 
  VISITAS_INICIALES, 
  MOVIMIENTOS_INICIALES, 
  USUARIOS_INICIALES,
  SUCURSALES,
  CAT_TIPOS_OBRA
} from './data/constants';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PipelineTab from './components/PipelineTab';
import ClientesTab from './components/ClientesTab';
import MapaTab from './components/MapaTab';
import ResumenKpis from './components/ResumenKpis';

import ModalExpedienteObra from './components/ModalExpedienteObra';
import ModalExpedienteCliente from './components/ModalExpedienteCliente';
import ModalObra from './components/ModalObra';
import ModalVisita from './components/ModalVisita';
import ModalComercial from './components/ModalComercial';
import ModalCliente from './components/ModalCliente';
import ModalMapaPicker from './components/ModalMapaPicker';
import ModalVisor from './components/ModalVisor';
import ModalNavegacion from './components/ModalNavegacion';
import PantallaPin from './components/PantallaPin';
import SplashScreen from './components/SplashScreen';
import PullToRefreshIndicator from './components/PullToRefreshIndicator';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import RutaDelDia from './components/RutaDelDia';
import ModalBusquedaGlobal from './components/ModalBusquedaGlobal';
import ModalChat from './components/ModalChat';
import { suscribirMensajesEnVivo, obtenerTodosLosMensajesDB } from './lib/chat';
import { inicializarNotificaciones, programarRecordatorioObrasFrias, cancelarRecordatorios } from './lib/notificaciones';

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
  limpiarPosicionesFantasmaDB,
  eliminarMiPosicionDB,
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

// DESCARGADOR UNIVERSAL PARA PC Y APK
async function descargarArchivoUniversal({ nombre, contenidoBase64, mimeType, blobTexto }) {
  const esNativo = Capacitor.isNativePlatform();

  if (esNativo) {
    try {
      const archivo = await Filesystem.writeFile({
        path: nombre,
        data: contenidoBase64,
        directory: Directory.Cache
      });

      await Share.share({
        title: 'Descargar Reporte OBS',
        text: `Reporte generado: ${nombre}`,
        url: archivo.uri,
        dialogTitle: 'Guardar o Abrir Archivo'
      });
      return true;
    } catch (err) {
      console.warn('Error en guardado nativo:', err);
      notificarToast('Error al procesar descarga en dispositivo', 'error');
      return false;
    }
  } else {
    try {
      let blob;
      if (blobTexto) {
        blob = new Blob([blobTexto], { type: mimeType });
      } else {
        const byteCharacters = atob(contenidoBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notificarToast(`📥 Descarga iniciada: ${nombre}`, 'exito');
      return true;
    } catch (err) {
      console.warn('Error en descarga web:', err);
      notificarToast('Error al descargar en PC', 'error');
      return false;
    }
  }
}

export default function App() {
  const [tab, setTab] = useState('pipeline');
  const [mostrarSplash, setMostrarSplash] = useState(true);
  
  const [modalConfirmarSalida, setModalConfirmarSalida] = useState(false);
  const [modalOpcionesExportacion, setModalOpcionesExportacion] = useState(false);
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
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
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
  const [modalRutaDia, setModalRutaDia] = useState(false);
  const [modalBusquedaGlobal, setModalBusquedaGlobal] = useState(false);
  const [modalChat, setModalChat] = useState(false);
  const [mensajesSinLeer, setMensajesSinLeer] = useState(0);

  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest('button, [role="button"]');
      if (!target || target.disabled) return;
      if (navigator.vibrate) navigator.vibrate(8);
    };
    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const algunModalAbierto = Boolean(
    obraSeleccionada || 
    clienteSeleccionado ||
    modalObraAbierto || 
    modalVisitaAbierto || 
    modalComercialAbierto || 
    modalCliente || 
    modalKpisAbierto || 
    mapaPickerConfig || 
    visorModal || 
    destinoRuta ||
    itemAEliminar ||
    modalRutaDia ||
    modalBusquedaGlobal ||
    modalChat ||
    modalOpcionesExportacion
  );

  useEffect(() => {
    let listener = null;

    const inicializarBotonAtras = async () => {
      try {
        listener = await CapApp.addListener('backButton', () => {
          if (modalConfirmarSalida) { setModalConfirmarSalida(false); return; }
          if (modalOpcionesExportacion) { setModalOpcionesExportacion(false); return; }
          if (visorModal) { setVisorModal(null); return; }
          if (modalBusquedaGlobal) { setModalBusquedaGlobal(false); return; }
          if (modalChat) { setModalChat(false); return; }
          if (modalRutaDia) { setModalRutaDia(false); return; }
          if (destinoRuta) { setDestinoRuta(null); return; }
          if (mapaPickerConfig) { setMapaPickerConfig(null); return; }
          if (itemAEliminar) { setItemAEliminar(null); return; }
          if (modalVisitaAbierto) { setModalVisitaAbierto(false); setVisitaAEditar(null); return; }
          if (modalComercialAbierto) { setModalComercialAbierto(false); return; }
          if (modalObraAbierto) { setModalObraAbierto(false); return; }
          if (modalCliente) { setModalCliente(false); return; }
          if (modalKpisAbierto) { setModalKpisAbierto(false); return; }
          if (clienteSeleccionado) { setClienteSeleccionado(null); return; }
          if (obraSeleccionada) { setObraSeleccionada(null); return; }

          setModalConfirmarSalida(true);
        });
      } catch (err) {
        console.warn('Capacitor App plugin no disponible:', err);
      }
    };

    inicializarBotonAtras();

    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [
    modalConfirmarSalida, modalOpcionesExportacion, visorModal, destinoRuta, mapaPickerConfig,
    itemAEliminar, modalVisitaAbierto, modalComercialAbierto,
    modalObraAbierto, modalCliente, modalKpisAbierto, obraSeleccionada, clienteSeleccionado,
    modalRutaDia, modalBusquedaGlobal, modalChat
  ]);

  const handleCerrarAppDefinitivo = () => {
    try {
      CapApp.exitApp();
    } catch {
      window.close();
    }
  };

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
      notificarToast('Conexión restablecida', 'exito');
      ejecutarSincronizacionOffline();
    };
    const manejarOffline = () => {
      setEstaOnline(false);
      notificarToast('Sin conexión · Modo campo activo', 'advertencia');
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

  const { pulling, distance } = usePullToRefresh(recargarDatosNube, { threshold: 80 });

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
      limpiarPosicionesFantasmaDB(deviceIdRef.current, usuarioActivo.id);
      inicializarNotificaciones();
    } else {
      localStorage.removeItem('app_obras_usuario_activo');
      cancelarRecordatorios();
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
      (error) => {
        if (error.code === 1) setGpsEstado('bloqueado');
        else if (error.code === 2) setGpsEstado('buscando');
        else setGpsEstado('calibrando');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
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
      if (clienteSeleccionado && clienteSeleccionado.id === clienteLimpio.id) setClienteSeleccionado(clienteLimpio);
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
      if (clienteSeleccionado && clienteSeleccionado.id === id) setClienteSeleccionado(null);
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
        const obraActualizada = { 
          ...o, 
          estatusFase: visitaLimpia.estatus,
          etapaComercial: visitaLimpia.etapaComercial || o.etapaComercial
        };
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

  // ✅ AHORA (abre el formulario visual con el buscador y el filtro de sucursal):
  const handleVincularClienteAObra = (obra) => {
    setObraAEditar(obra);
    setModalObraAbierto(true);
  };
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

  // =========================================================================
  // CÁLCULO EXACTO DE KPIS POR SUCURSAL (Resuelve datos erróneos en modal)
  // =========================================================================
  const kpisSucursal = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    // Toma la sucursal del asesor activo (ej. ALTOZANO) o el filtro seleccionado
    const suc = (usuarioActivo && usuarioActivo.sucursal !== 'TODAS') 
      ? usuarioActivo.sucursal 
      : filtroSucursal;
    const esTodas = suc === 'TODAS';

    // 1. Obras pertenecientes a la sucursal
    const obrasSuc = obras.filter(o => 
      esTodas || (o.sucursal && o.sucursal.trim().toUpperCase() === suc.trim().toUpperCase())
    );
    const idsObrasSuc = new Set(obrasSuc.map(o => o.id));

    // 2. Visitas de hoy hechas EXCLUSIVAMENTE en esta sucursal
    const visitasHoySuc = visitas.filter(v => {
      const fechaLimpia = v.fecha ? v.fecha.replace(' ', 'T') : '';
      if (!fechaLimpia.startsWith(hoyStr)) return false;
      if (esTodas) return true;
      const coincidePorSucursal = v.sucursal && v.sucursal.trim().toUpperCase() === suc.trim().toUpperCase();
      const coincidePorObra = v.obraId && idsObrasSuc.has(v.obraId);
      return coincidePorSucursal || coincidePorObra;
    }).length;

    const metaDiaria = 5;
    const porcentaje = Math.min(100, Math.round((visitasHoySuc / metaDiaria) * 100));

    // 3. Movimientos (cotizaciones y ventas) de obras de esa sucursal
    const movsSuc = movimientos.filter(m => {
      if (esTodas) return true;
      return m.obraId && idsObrasSuc.has(m.obraId);
    });

    const totalMonto = movsSuc.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    const ventasCerradas = movsSuc.filter(m => m.tipo === 'VENTA').length;

    // 4. Obras frías de esa sucursal (>12 días sin visita)
    const totalObrasFrias = obrasSuc.filter(o => {
      const vList = visitas
        .filter(v => v.obraId === o.id)
        .sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')));
      if (!vList.length) return true;
      const diffDias = Math.floor((Date.now() - new Date(vList[0].fecha.replace(' ', 'T')).getTime()) / (1000 * 3600 * 24));
      return diffDias > 12;
    }).length;

    return {
      visitasHoy: visitasHoySuc,
      metaDiaria,
      porcentajeMeta: porcentaje,
      totalMonto,
      totalObras: obrasSuc.length,
      ventasCerradas,
      totalObrasFrias,
      sucursalNombre: suc
    };
  }, [obras, visitas, movimientos, filtroSucursal, usuarioActivo]);

  // =========================================================================
  // MOTOR 1: EXCEL POWER BI CON HIPERVÍNCULOS REALES CLIQUEABLES
  // =========================================================================
  const construirLibroExcelPowerBI = () => {
    const obrasAExportar = filtroSucursal === 'TODAS'
      ? obras
      : obras.filter(o => o.sucursal === filtroSucursal);

    const clientesAExportar = filtroSucursal === 'TODAS'
      ? clientes
      : clientes.filter(c => c.sucursal === filtroSucursal);

    const visitasAExportar = filtroSucursal === 'TODAS'
      ? visitas
      : visitas.filter(v => v.sucursal === filtroSucursal);

    const obrasIdsValidas = obrasAExportar.map(o => o.id);
    const movsAExportar = movimientos.filter(m => obrasIdsValidas.includes(m.obraId));

    const eventosUnificados = [];

    visitasAExportar.forEach(v => {
      const obra = obras.find(o => o.id === v.obraId);
      const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;
      const tipoObj = obra ? CAT_TIPOS_OBRA.find(t => t.id === obra.tipoObra) : null;
      const latGps = v.latGpsReal || obra?.lat;
      const lngGps = v.lngGpsReal || obra?.lng;

      const linkGps = (latGps && lngGps)
        ? `https://maps.google.com/?q=${latGps},${lngGps}`
        : '';

      let linkFotos = '';
      if (Array.isArray(v.fotos) && v.fotos.length > 0) {
        linkFotos = v.fotos[0];
      }

      eventosUnificados.push({
        ID: String(v.id || ''),
        FECHA: String(v.fecha || ''),
        SUCURSAL: String(v.sucursal || ''),
        ASESOR: String(v.asesorNombre || 'ASESOR'),
        TIPO_EVENTO: 'VISITA DE SUPERVISIÓN',
        PROYECTO: String(obra ? obra.nombre : (v.proyecto || 'OBRA')),
        TIPOLOGIA_OBRA: tipoObj ? `${tipoObj.icono} ${tipoObj.label}` : 'CASA HABITACIÓN',
        CLIENTE: String(cliente ? cliente.nombreCliente : 'PROSPECCIÓN DIRECTA'),
        PERFIL_CLIENTE: String(cliente ? (cliente.tipoMercado || 'NO DEFINIDO') : 'SIN ASIGNAR'),
        TIPO_DESARROLLO: String(obra ? (obra.tipoDesarrollo || 'OBRA NUEVA') : 'OBRA NUEVA'),
        ETAPA_COMERCIAL_OBS: String(v.etapaComercial || obra?.etapaComercial || 'PROSPECTO'),
        FASE_CONSTRUCTIVA_FISICA: String(v.estatus || 'CIMENTACIÓN'),
        ACTIVIDAD: String(v.actividad || 'SUPERVISIÓN TÉCNICA'),
        MONTO: 0,
        TIPO_DE_ENTREGA: 'N/A',
        FORMA_DE_PAGO: 'N/A',
        FOLIO_DOCUMENTO: 'N/A',
        LINK_DOCUMENTO: '',
        ANTECEDE_O_COTIZACION: 'N/A',
        FOTOS: linkFotos,
        UBICACIÓN_GPS: linkGps,
        AUDITORÍA_TERRITORIAL: `${v.auditoriaEstado === 'en_sitio' ? 'EN SITIO' : 'REMOTO'} (${v.distanciaAuditoriaMetros || 0}m)`,
        OBSERVACIONES: String(v.observaciones || '')
      });
    });

    movsAExportar.forEach(m => {
      const obra = obras.find(o => o.id === m.obraId);
      const cliente = obra ? clientes.find(c => c.id === obra.clienteId) : null;
      const tipoObj = obra ? CAT_TIPOS_OBRA.find(t => t.id === obra.tipoObra) : null;
      const esVenta = m.tipo === 'VENTA';
      const linkDoc = m.documentoAdjunto?.url || '';
      const linkGps = (obra?.lat && obra?.lng) ? `https://maps.google.com/?q=${obra.lat},${obra.lng}` : '';

      eventosUnificados.push({
        ID: String(m.id || ''),
        FECHA: String(m.fecha || ''),
        SUCURSAL: String(obra ? obra.sucursal : 'GENERAL'),
        ASESOR: 'ASESOR A CARGO',
        TIPO_EVENTO: esVenta ? `VENTA (${m.comprobante})` : 'COTIZACIÓN',
        PROYECTO: String(obra ? obra.nombre : 'OBRA'),
        TIPOLOGIA_OBRA: tipoObj ? `${tipoObj.icono} ${tipoObj.label}` : 'CASA HABITACIÓN',
        CLIENTE: String(cliente ? cliente.nombreCliente : 'VENTA DIRECTA'),
        PERFIL_CLIENTE: String(cliente ? (cliente.tipoMercado || 'NO DEFINIDO') : 'SIN ASIGNAR'),
        TIPO_DESARROLLO: String(obra ? (obra.tipoDesarrollo || 'OBRA NUEVA') : 'OBRA NUEVA'),
        ETAPA_COMERCIAL_OBS: esVenta ? 'EJECUCIÓN' : (m.estatus === 'GANADA' ? 'GANADA' : 'COTIZACIÓN'),
        FASE_CONSTRUCTIVA_FISICA: String(obra ? obra.estatusFase : 'OBRA GRIS'),
        ACTIVIDAD: esVenta ? 'SUMINISTRO DE MATERIAL' : 'OFERTA ECONÓMICA',
        MONTO: Number(m.monto) || 0,
        TIPO_DE_ENTREGA: String(m.tipoEntrega || 'DOMICILIO'),
        FORMA_DE_PAGO: String(m.formaPago || 'N/A'),
        FOLIO_DOCUMENTO: String(m.folio || ''),
        LINK_DOCUMENTO: linkDoc,
        ANTECEDE_O_COTIZACION: String(m.cotizacionOrigenId || 'DIRECTA'),
        FOTOS: '',
        UBICACIÓN_GPS: linkGps,
        AUDITORÍA_TERRITORIAL: 'REGISTRO COMERCIAL',
        OBSERVACIONES: String(m.observaciones || '')
      });
    });

    eventosUnificados.sort((a, b) => new Date(b.FECHA.replace(' ', 'T')) - new Date(a.FECHA.replace(' ', 'T')));

    const wsSabana = XLSX.utils.json_to_sheet(eventosUnificados);
    
    // Post-procesador para hacer celdas cliqueables
    const hacerColumnaCliqueable = (ws, nombreColumna, etiquetaBoton) => {
      if (!ws['!ref']) return;
      const range = XLSX.utils.decode_range(ws['!ref']);
      let targetColIndex = -1;

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (headerCell && headerCell.v === nombreColumna) {
          targetColIndex = C;
          break;
        }
      }

      if (targetColIndex === -1) return;

      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: targetColIndex });
        const cell = ws[cellAddress];
        if (cell && typeof cell.v === 'string' && cell.v.startsWith('http')) {
          const url = cell.v;
          cell.l = { Target: url, Tooltip: 'Clic para abrir enlace' };
          cell.v = etiquetaBoton;
          cell.f = `HYPERLINK("${url}", "${etiquetaBoton}")`;
          cell.t = 's';
        }
      }
    };

    hacerColumnaCliqueable(wsSabana, 'UBICACIÓN_GPS', '📍 Ver Google Maps');
    hacerColumnaCliqueable(wsSabana, 'LINK_DOCUMENTO', '📄 Ver Documento');
    hacerColumnaCliqueable(wsSabana, 'FOTOS', '📸 Ver Foto');

    const dimClientes = clientesAExportar.map(c => ({
      cliente_id: String(c.id || ''),
      id_red_azul: String(c.idRedAzul || 'SIN_ID'),
      nombre_cliente: String(c.nombreCliente || ''),
      sucursal: String(c.sucursal || ''),
      perfil_especialidad: String(c.tipoMercado || 'CLIENTE FINAL'),
      clasificacion_cliente: String(c.tipoCliente || 'PROSPECTO'),
      responsable_contacto: String(c.responsable || 'SIN ASIGNAR'),
      telefono_contacto: String(c.contacto || 'SIN TELEFONO'),
      correo_contacto: String(c.correo || 'SIN CORREO'),
      ubicacion_maps: (c.lat && c.lng) ? `https://maps.google.com/?q=${c.lat},${c.lng}` : '',
      direccion_fiscal: String(c.direccion || '')
    }));

    const wsClientes = XLSX.utils.json_to_sheet(dimClientes);
    hacerColumnaCliqueable(wsClientes, 'ubicacion_maps', '📍 Abrir Mapa');

    const dimObras = obrasAExportar.map(o => {
      const cli = clientes.find(c => c.id === o.clienteId);
      const visO = visitas.filter(v => v.obraId === o.id);
      const tipoObj = CAT_TIPOS_OBRA.find(t => t.id === o.tipoObra);
      const ultima = visO.sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')))[0];
      const diasSinVisita = ultima ? Math.max(0, Math.floor((Date.now() - new Date(ultima.fecha.replace(' ', 'T')).getTime()) / (1000 * 3600 * 24))) : 999;
      const fInfo = formatearFechaParaPowerBI(ultima ? ultima.fecha : null);

      return {
        obra_id: String(o.id || ''),
        cliente_id: String(o.clienteId || 'SIN_CLIENTE'),
        nombre_obra: String(o.nombre || ''),
        sucursal: String(o.sucursal || ''),
        tipologia_obra: tipoObj ? `${tipoObj.icono} ${tipoObj.label}` : 'CASA HABITACIÓN',
        etapa_comercial_obs: String(o.etapaComercial || 'PROSPECTO'),
        fase_constructiva_fisica: String(o.estatusFase || ''),
        tipo_desarrollo: String(o.tipoDesarrollo || 'OBRA NUEVA'),
        nombre_cliente: String(cli ? cli.nombreCliente : 'SIN ASIGNAR'),
        perfil_cliente: String(cli ? (cli.tipoMercado || 'NO DEFINIDO') : 'SIN ASIGNAR'),
        total_visitas: visO.length,
        dias_sin_visita: diasSinVisita,
        alerta_obra_fria: diasSinVisita > 12 ? 'SI' : 'NO',
        fecha_ultima_visita_iso: fInfo.iso,
        fecha_corta_ultima_visita: fInfo.fecha_corta,
        ubicacion_maps: (o.lat && o.lng) ? `https://maps.google.com/?q=${o.lat},${o.lng}` : '',
        direccion: String(o.direccion || '')
      };
    });

    const wsObras = XLSX.utils.json_to_sheet(dimObras);
    hacerColumnaCliqueable(wsObras, 'ubicacion_maps', '📍 Abrir Mapa');

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, wsSabana, 'Sabana_Ejecutiva_360');
    XLSX.utils.book_append_sheet(libro, wsObras, 'Dim_Obras');
    XLSX.utils.book_append_sheet(libro, wsClientes, 'Dim_Clientes');

    return libro;
  };

  // =========================================================================
  // MOTOR 2: KML PARA GOOGLE MY MAPS
  // =========================================================================
  const generarKmlParaGoogleMyMaps = () => {
    const obrasAExportar = filtroSucursal === 'TODAS'
      ? obras.filter(o => o.lat && o.lng)
      : obras.filter(o => o.sucursal === filtroSucursal && o.lat && o.lng);

    const clientesAExportar = filtroSucursal === 'TODAS'
      ? clientes.filter(c => c.lat && c.lng)
      : clientes.filter(c => c.sucursal === filtroSucursal && c.lat && c.lng);

    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>PROSPECCIÓN OBS - ${filtroSucursal}</name>
    <description>Obras y Clientes georreferenciados para Google My Maps</description>
`;

    obrasAExportar.forEach(o => {
      const cli = clientes.find(c => c.id === o.clienteId);
      const tipoObj = CAT_TIPOS_OBRA.find(t => t.id === o.tipoObra) || CAT_TIPOS_OBRA[0];
      const descHtml = `<![CDATA[
        <div style="font-family: Arial, sans-serif; font-size: 13px;">
          <h3 style="color: #001757; margin-bottom: 4px;">${tipoObj.icono} ${o.nombre}</h3>
          <p><strong>ID:</strong> ${o.id} | <strong>Sucursal:</strong> ${o.sucursal}</p>
          <p><strong>Uso de la Obra:</strong> ${tipoObj.label}</p>
          <p><strong>Etapa OBS:</strong> ${o.etapaComercial || 'PROSPECTO'}</p>
          <p><strong>Fase Constructiva:</strong> ${o.estatusFase}</p>
          <p><strong>Cliente:</strong> ${cli ? cli.nombreCliente : 'Prospección directa'}</p>
          <p><strong>Contacto / Tel:</strong> ${cli ? cli.contacto || 'Sin teléfono' : 'Sin contacto'}</p>
          <p><strong>Dirección:</strong> ${o.direccion || 'Ubicación satelital'}</p>
          <hr/>
          <p><a href="https://maps.google.com/?q=${o.lat},${o.lng}" target="_blank">📍 Abrir Ruta en Google Maps</a></p>
        </div>
      ]]>`;

      kml += `
    <Placemark>
      <name>${tipoObj.icono} ${o.nombre}</name>
      <description>${descHtml}</description>
      <ExtendedData>
        <Data name="Tipo_Obra"><value>${tipoObj.label}</value></Data>
        <Data name="Etapa_Comercial"><value>${o.etapaComercial || 'PROSPECTO'}</value></Data>
        <Data name="Sucursal"><value>${o.sucursal}</value></Data>
        <Data name="Cliente"><value>${cli ? cli.nombreCliente : 'Sin cliente'}</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>${o.lng},${o.lat},0</coordinates>
      </Point>
    </Placemark>`;
    });

    clientesAExportar.forEach(c => {
      const descHtml = `<![CDATA[
        <div style="font-family: Arial, sans-serif; font-size: 13px;">
          <h3 style="color: #0091FB; margin-bottom: 4px;">👤 ${c.nombreCliente}</h3>
          <p><strong>ID:</strong> ${c.id} | <strong>Sucursal:</strong> ${c.sucursal}</p>
          <p><strong>Especialidad / Oficio:</strong> ${c.tipoMercado || 'CLIENTE FINAL'}</p>
          <p><strong>Encargado:</strong> ${c.responsable || 'Sin asignar'}</p>
          <p><strong>Teléfono:</strong> ${c.contacto || 'Sin dato'}</p>
          <p><strong>Dirección Fiscal:</strong> ${c.direccion || 'Domicilio fiscal'}</p>
        </div>
      ]]>`;

      kml += `
    <Placemark>
      <name>👤 ${c.nombreCliente}</name>
      <description>${descHtml}</description>
      <ExtendedData>
        <Data name="Tipo"><value>CLIENTE</value></Data>
        <Data name="Especialidad"><value>${c.tipoMercado || 'CLIENTE FINAL'}</value></Data>
        <Data name="Sucursal"><value>${c.sucursal}</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>${c.lng},${c.lat},0</coordinates>
      </Point>
    </Placemark>`;
    });

    kml += `
  </Document>
</kml>`;

    return kml;
  };

  const ejecutarDescargaExcel = async () => {
    setModalOpcionesExportacion(false);
    try {
      const libro = construirLibroExcelPowerBI();
      const fechaHoy = new Date().toISOString().slice(0, 10);
      const nombreArchivo = `PowerBI_Prospeccion_OBS_${filtroSucursal}_${fechaHoy}.xlsx`;
      const base64Data = XLSX.write(libro, { bookType: 'xlsx', type: 'base64' });

      await descargarArchivoUniversal({
        nombre: nombreArchivo,
        contenidoBase64: base64Data,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } catch (err) {
      console.warn('Error generando Excel:', err);
      notificarToast('Error al procesar el archivo Excel', 'error');
    }
  };

  const ejecutarDescargaKmlMyMaps = async () => {
    setModalOpcionesExportacion(false);
    try {
      const kmlString = generarKmlParaGoogleMyMaps();
      const fechaHoy = new Date().toISOString().slice(0, 10);
      const nombreArchivo = `GoogleMyMaps_OBS_${filtroSucursal}_${fechaHoy}.kml`;
      const base64Data = btoa(unescape(encodeURIComponent(kmlString)));

      await descargarArchivoUniversal({
        nombre: nombreArchivo,
        contenidoBase64: base64Data,
        blobTexto: kmlString,
        mimeType: 'application/vnd.google-earth.kml+xml'
      });
    } catch (err) {
      console.warn('Error generando KML:', err);
      notificarToast('Error al generar archivo para Google Maps', 'error');
    }
  };

  if (mostrarSplash) {
    return <SplashScreen onFinish={() => setMostrarSplash(false)} />;
  }

  if (!usuarioActivo) {
    return <PantallaPin usuarios={usuarios} onLogin={(u) => setUsuarioActivo(u)} />;
  }

  return (
    <div className={`min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-slate-900 ${tab === 'mapa' ? 'pb-0' : 'pb-28'} pt-[58px] sm:pt-[70px] font-sans`}>
      
      {/* Toasts */}
      <div className="fixed top-[68px] sm:top-[76px] left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto w-full rounded-2xl bg-slate-950/75 backdrop-blur-2xl border border-white/[0.08] shadow-2xl overflow-hidden animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                t.tipo === 'exito' ? 'bg-emerald-400' : t.tipo === 'error' ? 'bg-rose-400' : 'bg-sky-400'
              }`} />
              <span className="text-[13px] font-medium text-white/90 truncate">{t.mensaje}</span>
            </div>
          </div>
        ))}
      </div>

      <PullToRefreshIndicator pulling={pulling} distance={distance} threshold={80} />

      {/* Header */}
      <Header 
        gpsEstado={gpsEstado} 
        tabletPos={tabletPos} 
        onExportarExcel={() => setModalOpcionesExportacion(true)}
        sincronizando={sincronizando}
        usuarioActivo={usuarioActivo}
        onLogout={async () => {
          if (usuarioActivo) await eliminarMiPosicionDB(usuarioActivo.id);
          await cancelarRecordatorios();
          setUsuarioActivo(null);
        }}
        onAbrirKpis={() => setModalKpisAbierto(true)}
        onAbrirBusqueda={() => setModalBusquedaGlobal(true)}
        onAbrirRutaDia={() => setModalRutaDia(true)}
        onAbrirChat={() => { setModalChat(true); }}
        mensajesSinLeer={mensajesSinLeer}
        filtroSucursal={filtroSucursal}
        setFiltroSucursal={setFiltroSucursal}
        estaOnline={estaOnline}
        pendientesOffline={pendientesOffline}
        onForzarSincronizacion={ejecutarSincronizacionOffline}
      />

      {/* Main Tabs */}
      <main className={`w-full max-w-7xl mx-auto ${tab === 'mapa' ? 'px-2 sm:px-6 lg:px-8 py-0' : 'px-3 sm:px-6 lg:px-8 py-1 space-y-3'}`}>
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
          />
        )}

        {tab === 'clientes' && (
          <ClientesTab 
            clientes={clientes}
            onNuevoCliente={() => { setClienteAEditar(null); setModalCliente(true); }}
            onSeleccionarCliente={(c) => setClienteSeleccionado(c)}
            onEditarCliente={(c) => { setClienteAEditar(c); setModalCliente(true); }}
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
            onSeleccionarObra={(o) => setObraSeleccionada(o)}
            onSeleccionarCliente={(c) => setClienteSeleccionado(c)}
            filtroSucursal={filtroSucursal}
            setFiltroSucursal={setFiltroSucursal}
            asesoresEnVivo={asesoresEnVivo}
            usuarioActivo={usuarioActivo}
            deviceId={deviceIdRef.current}
          />
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} usuarioActivo={usuarioActivo} />

      {/* DIÁLOGO: DESCARGAR EXCEL O DESCARGAR GOOGLE MAPS */}
      {modalOpcionesExportacion && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-[#001757]">
                Descargar Reporte ({filtroSucursal})
              </h3>
              <button 
                type="button" 
                onClick={() => setModalOpcionesExportacion(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Elige el formato que deseas descargar a tu dispositivo:
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={ejecutarDescargaExcel}
                className="w-full min-h-[50px] rounded-2xl bg-[#001757] hover:bg-[#00227a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all">
                <FileSpreadsheet className="w-4 h-4 text-[#0091FB]" />
                <span>Descargar Excel Power BI (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={ejecutarDescargaKmlMyMaps}
                className="w-full min-h-[50px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all">
                <Globe className="w-4 h-4 text-white" />
                <span>Descargar Capa Google My Maps (.kml)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPEDIENTE EJECUTIVO DE OBRA */}
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

      {/* EXPEDIENTE EJECUTIVO DE CLIENTE (FICHA DE CONSULTA) */}
      <ModalExpedienteCliente
        isOpen={Boolean(clienteSeleccionado)}
        onClose={() => setClienteSeleccionado(null)}
        cliente={clienteSeleccionado}
        obras={obras}
        movimientos={movimientos}
        onEditarCliente={(c) => {
          setClienteAEditar(c);
          setModalCliente(true);
        }}
        onEliminarCliente={(c) => {
          setItemAEliminar({ tipo: 'cliente', data: c });
          setClienteSeleccionado(null);
        }}
        onAbrirRuta={setDestinoRuta}
        onSeleccionarObra={(o) => {
          setClienteSeleccionado(null);
          setObraSeleccionada(o);
        }}
        onNuevaObraParaCliente={(c) => {
          setClienteSeleccionado(null);
          setObraAEditar({ clienteId: c.id, sucursal: c.sucursal });
          setModalObraAbierto(true);
        }}
      />

      {/* FORMULARIOS DE ALTA Y EDICIÓN */}
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

      <RutaDelDia
        isOpen={modalRutaDia}
        onClose={() => setModalRutaDia(false)}
        obras={obras}
        visitas={visitas}
        clientes={clientes}
        tabletPos={tabletPos}
        usuarioActivo={usuarioActivo}
        filtroSucursal={filtroSucursal}
        onSeleccionarObra={(o) => setObraSeleccionada(o)}
        onNuevaVisita={(obra) => {
          setVisitaAEditar(null);
          setObraParaVisita(obra);
          setModalVisitaAbierto(true);
        }}
        onAbrirRuta={setDestinoRuta}
      />

      <ModalChat
        isOpen={modalChat}
        onClose={() => setModalChat(false)}
        usuarioActivo={usuarioActivo}
        usuarios={usuarios}
      />

      <ModalBusquedaGlobal
        isOpen={modalBusquedaGlobal}
        onClose={() => setModalBusquedaGlobal(false)}
        obras={obras}
        clientes={clientes}
        movimientos={movimientos}
        onSeleccionarObra={(o) => setObraSeleccionada(o)}
        onSeleccionarCliente={(c) => setClienteSeleccionado(c)}
      />

      {/* MODAL DE RENDIMIENTO Y METAS FILTRADO EXACTAMENTE POR SUCURSAL */}
      <ResumenKpis
        isOpen={modalKpisAbierto}
        onClose={() => setModalKpisAbierto(false)}
        sucursal={kpisSucursal.sucursalNombre}
        visitasHoy={kpisSucursal.visitasHoy}
        metaDiaria={kpisSucursal.metaDiaria}
        porcentajeMeta={kpisSucursal.porcentajeMeta}
        totalMonto={kpisSucursal.totalMonto}
        totalObras={kpisSucursal.totalObras}
        ventasCerradas={kpisSucursal.ventasCerradas}
        totalObrasFrias={kpisSucursal.totalObrasFrias}
        esDirector={esDirector}
        visitas={visitas}
        obras={obras}
        movimientos={movimientos}
        onSeleccionarSucursal={(suc) => setFiltroSucursal(suc)}
      />

      {itemAEliminar && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
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

      {/* Confirmación de Salida */}
      {modalConfirmarSalida && (
        <div className="fixed inset-0 z-[350] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto shadow-sm">
              <Compass className="w-7 h-7 text-[#0091FB] stroke-[2.4]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[#001757]">
                ¿Deseas salir de PROSPECCIÓN OBS?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tus datos y registros están respaldados de forma segura en la tablet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarSalida(false)}
                className="min-h-[46px] rounded-xl border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:scale-95 transition-all">
                Continuar en App
              </button>
              <button
                type="button"
                onClick={handleCerrarAppDefinitivo}
                className="min-h-[46px] rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:brightness-105 text-white font-black text-xs shadow-md shadow-rose-600/30 active:scale-95 transition-all">
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}