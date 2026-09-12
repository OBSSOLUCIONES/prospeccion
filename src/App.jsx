// src/App.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Plus, UserPlus, AlertTriangle, Building2, Zap, MapPin } from 'lucide-react';

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
  obtenerMovimientosDB,
  guardarMovimientoDB,
  transmitirPosicionDB,
  obtenerPosicionesEnVivoDB,
  suscribirPosicionesEnVivo,
  suscribirCambiosGlobales
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

export default function App() {
  const [tab, setTab] = useState('pipeline');
  const [mostrarSplash, setMostrarSplash] = useState(true);
  
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

  // Dynamic Island: Detección inteligente de proximidad (<180m)
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

  // Sincronización en la nube
  const recargarDatosNube = useCallback(async () => {
    if (!isSupabaseConfigured) return;
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

      if (esDirector) {
        const flota = await obtenerPosicionesEnVivoDB();
        setAsesoresEnVivo(flota);
      }
    } catch (err) {
      console.warn('Error sincronizando con nube:', err);
    } finally {
      setSincronizando(false);
    }
  }, [esDirector]);

  useEffect(() => {
    recargarDatosNube();

    if (isSupabaseConfigured) {
      const desuscribirCambios = suscribirCambiosGlobales(() => {
        recargarDatosNube();
      });

      let desuscribirFlota = () => {};
      if (esDirector) {
        desuscribirFlota = suscribirPosicionesEnVivo((flota) => setAsesoresEnVivo(flota));
      }

      return () => {
        desuscribirCambios();
        desuscribirFlota();
      };
    }
  }, [recargarDatosNube, esDirector]);

  // Persistencia local
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

  // GPS en segundo plano
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
        if (usuarioActivo && ahora - ultimaTransmisionRef.current > 25000) {
          ultimaTransmisionRef.current = ahora;
          transmitirPosicionDB({
            usuarioId: usuarioActivo.id,
            nombre: usuarioActivo.nombre,
            sucursal: usuarioActivo.sucursal,
            lat: nuevaPos.lat,
            lng: nuevaPos.lng,
            accuracy: precision
          });
        }
      },
      () => setGpsEstado('bloqueado'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [usuarioActivo]);

  const handleGuardarObra = async (nuevaObra) => {
    await guardarObraDB(nuevaObra);
    if (obraAEditar) {
      setObras(prev => prev.map(o => o.id === obraAEditar.id ? nuevaObra : o));
      if (obraSeleccionada && obraSeleccionada.id === nuevaObra.id) setObraSeleccionada(nuevaObra);
      setObraAEditar(null);
    } else {
      setObras(prev => [nuevaObra, ...prev]);
    }
  };

  const handleGuardarCliente = async (nuevoCliente) => {
    await guardarClienteDB(nuevoCliente);
    if (clienteAEditar) {
      setClientes(prev => prev.map(c => c.id === clienteAEditar.id ? nuevoCliente : c));
      setClienteAEditar(null);
    } else {
      setClientes(prev => [nuevoCliente, ...prev]);
    }
  };

  const ejecutarEliminacion = async () => {
    if (!itemAEliminar) return;

    if (itemAEliminar.tipo === 'obra') {
      const id = itemAEliminar.data.id;
      await eliminarObraDB(id);
      setObras(prev => prev.filter(o => o.id !== id));
      setVisitas(prev => prev.filter(v => v.obraId !== id));
      setMovimientos(prev => prev.filter(m => m.obraId !== id));
      if (obraSeleccionada && obraSeleccionada.id === id) setObraSeleccionada(null);
    } else if (itemAEliminar.tipo === 'cliente') {
      const id = itemAEliminar.data.id;
      await eliminarClienteDB(id);
      setClientes(prev => prev.filter(c => c.id !== id));
    }

    setItemAEliminar(null);
  };

  const handleGuardarVisita = async (nuevaVisita) => {
    await guardarVisitaDB(nuevaVisita);
    setVisitas(prev => [nuevaVisita, ...prev]);
    setObras(prev => prev.map(o => {
      if (o.id === nuevaVisita.obraId) {
        const obraActualizada = { ...o, estatusFase: nuevaVisita.estatus };
        guardarObraDB(obraActualizada);
        if (obraSeleccionada && obraSeleccionada.id === o.id) setObraSeleccionada(obraActualizada);
        return obraActualizada;
      }
      return o;
    }));
  };

  const handleGuardarMovimiento = async (nuevoMov) => {
    await guardarMovimientoDB(nuevoMov);
    setMovimientos(prev => {
      const existe = prev.some(m => m.id === nuevoMov.id);
      if (existe) return prev.map(m => m.id === nuevoMov.id ? nuevoMov : m);
      return [nuevoMov, ...prev];
    });
  };

  const handleVincularClienteAObra = async (obra) => {
    const nuevoClienteId = prompt('Ingresa el ID del cliente para vincular (ej. ALT01):', obra.clienteId || '');
    if (nuevoClienteId) {
      const existe = clientes.find(c => c.id === nuevoClienteId.trim().toUpperCase());
      if (existe) {
        const obraActualizada = { ...obra, clienteId: existe.id };
        await guardarObraDB(obraActualizada);
        setObras(prev => prev.map(o => o.id === obra.id ? obraActualizada : o));
        setObraSeleccionada(obraActualizada);
        alert(`¡Obra vinculada con éxito a ${existe.nombreCliente}!`);
      } else {
        alert('No encontramos ningún cliente con ese ID en el catálogo.');
      }
    }
  };

  // Exportador Power BI
  const exportarAExcel = () => {
    if (!esDirector) return;

    const obrasAExportar = filtroSucursal === 'TODAS'
      ? obras
      : obras.filter(o => o.sucursal === filtroSucursal);

    const clientesAExportar = filtroSucursal === 'TODAS'
      ? clientes
      : clientes.filter(c => c.sucursal === filtroSucursal);

    // 1. Dim_Clientes
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
        latitud: c.lat ? Number(parseFloat(c.lat).toFixed(6)) : null,
        longitud: c.lng ? Number(parseFloat(c.lng).toFixed(6)) : null,
        direccion_fiscal: c.direccion || ''
      };
    });

    // 2. Dim_Obras
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
        latitud: o.lat ? Number(parseFloat(o.lat).toFixed(6)) : null,
        longitud: o.lng ? Number(parseFloat(o.lng).toFixed(6)) : null,
        direccion: o.direccion || ''
      };
    });

    // 3. Fact_Visitas
    const hojaVisitas = visitas
      .filter(v => filtroSucursal === 'TODAS' || v.sucursal === filtroSucursal)
      .map(v => {
        const fInfo = formatearFechaParaPowerBI(v.fecha);
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
          latitud_real_gps: v.latGpsReal ? Number(parseFloat(v.latGpsReal).toFixed(6)) : null,
          longitud_real_gps: v.lngGpsReal ? Number(parseFloat(v.lngGpsReal).toFixed(6)) : null,
          cantidad_fotos: (v.fotos || []).length,
          observaciones: v.observaciones || ''
        };
      });

    // 4. Fact_Movimientos
    const obrasIdsValidas = obrasAExportar.map(o => o.id);
    const hojaMovimientos = movimientos
      .filter(m => obrasIdsValidas.includes(m.obraId))
      .map(m => {
        const fInfo = formatearFechaParaPowerBI(m.fecha);
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
          tiene_adjunto: m.documentoAdjunto?.url ? 'SI' : 'NO'
        };
      });

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaClientes), 'Dim_Clientes');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaObras), 'Dim_Obras');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaVisitas), 'Fact_Visitas');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaMovimientos), 'Fact_Movimientos');

    const fechaHoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `PowerBI_Control_Obras_${filtroSucursal}_${fechaHoy}.xlsx`);
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

  // 1. Splash Screen Cinemático Inicial
  if (mostrarSplash) {
    return <SplashScreen onFinish={() => setMostrarSplash(false)} />;
  }

  // 2. Pantalla de Acceso por PIN
  if (!usuarioActivo) {
    return <PantallaPin usuarios={usuarios} onLogin={(u) => setUsuarioActivo(u)} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-slate-900 pb-28 pt-[62px] sm:pt-[70px] font-sans">
      
      {/* HEADER 100% FIJO ARRIBA */}
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
      />

      {/* DYNAMIC ISLAND: ALERTA INTELIGENTE CUANDO LLEGAS A UNA OBRA */}
      {obraProxima && !algunModalAbierto && (
        <div className="mx-3.5 mb-2.5 p-3.5 bg-slate-950/95 text-white rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.2)] border border-slate-800 backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MapPin className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                📍 Estás en la obra ({obraProxima.distancia}m)
              </span>
              <h4 className="text-xs sm:text-sm font-black truncate text-white mt-0.5">{obraProxima.obra.nombre}</h4>
              <p className="text-[10px] text-slate-400 truncate">{obraProxima.obra.sucursal} • {obraProxima.obra.estatusFase}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setObraParaVisita(obraProxima.obra);
              setModalVisitaAbierto(true);
            }}
            className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-emerald-500/30 shrink-0 transition-all flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Check-in</span>
          </button>
        </div>
      )}

      {/* CONTENIDO SCROLLEABLE ENTRE HEADER FIJO Y BOTTOM NAV FIJO */}
      <main className="w-full px-3.5 py-1 space-y-3">
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
              setObraParaVisita(obra);
              setModalVisitaAbierto(true);
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
          />
        )}
      </main>

      {/* Botón Flotante Elevado (Oculto para el Director) */}
      {!algunModalAbierto && !esDirector && (
        <button
          type="button"
          onClick={() => {
            if (tab === 'clientes') {
              setClienteAEditar(null);
              setModalCliente(true);
            } else {
              setObraAEditar(null);
              setModalObraAbierto(true);
            }
          }}
          className="fixed bottom-22 right-4 z-30 bg-gradient-to-r from-[#001757] via-[#00227a] to-[#0091FB] hover:brightness-105 active:scale-95 text-white px-4 py-3.5 rounded-3xl shadow-[0_12px_32px_-4px_rgba(0,23,87,0.35)] flex items-center gap-2 font-black text-xs transition-all border border-white/20">
          {tab === 'clientes' ? <UserPlus className="w-4 h-4 stroke-[2.5]" /> : <Building2 className="w-4 h-4 stroke-[2.5]" />}
          <span>{tab === 'clientes' ? '+ Nuevo Cliente' : '+ Nueva Obra'}</span>
        </button>
      )}

      {/* BARRA DE NAVEGACIÓN 100% FIJA ABAJO */}
      <BottomNav tab={tab} setTab={setTab} usuarioActivo={usuarioActivo} />

      {/* Panel de Metas y Rendimiento */}
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

      {/* Expediente 360° */}
      <ModalExpedienteObra
        isOpen={Boolean(obraSeleccionada)}
        onClose={() => setObraSeleccionada(null)}
        obra={obraSeleccionada}
        visitas={visitas}
        movimientos={movimientos}
        clientes={clientes}
        onNuevaVisita={(obra) => {
          setObraParaVisita(obra);
          setModalVisitaAbierto(true);
        }}
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

      {/* Alta / Edición de Obra */}
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

      {/* Alta / Edición de Cliente */}
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

      {/* Check-in de Visita */}
      <ModalVisita
        isOpen={modalVisitaAbierto}
        onClose={() => { setModalVisitaAbierto(false); setObraParaVisita(null); }}
        obra={obraParaVisita}
        onSave={handleGuardarVisita}
        tabletPos={tabletPos}
        usuarioActivo={usuarioActivo}
      />

      {/* Cotización o Venta */}
      <ModalComercial
        isOpen={modalComercialAbierto}
        onClose={() => { setModalComercialAbierto(false); setConfigComercial(null); }}
        obra={configComercial?.obra}
        tipoDefault={configComercial?.tipo || 'COTIZACION'}
        onSave={handleGuardarMovimiento}
      />

      {/* Selector GPS */}
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

      {/* Navegación GPS */}
      <ModalNavegacion 
        isOpen={Boolean(destinoRuta)}
        onClose={() => setDestinoRuta(null)}
        destino={destinoRuta}
      />

      {/* Visor Multimedia */}
      <ModalVisor 
        visorModal={visorModal}
        onClose={() => setVisorModal(null)}
      />

      {/* Confirmación de Borrado */}
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
                    ⚠️ Se eliminarán también todas sus visitas y cotizaciones registradas.
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:scale-95 transition-all">
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacion}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/25 active:scale-95 transition-all">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}