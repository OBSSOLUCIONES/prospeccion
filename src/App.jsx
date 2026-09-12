// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Plus, UserPlus, AlertTriangle, Building2 } from 'lucide-react';

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

import { 
  isSupabaseConfigured,
  obtenerClientesDB,
  guardarClienteDB,
  eliminarClienteDB,
  obtenerObrasDB,
  guardarObraDB,
  eliminarObraDB,
  obtenerMovimientosDB,
  guardarMovimientoDB,
  obtenerUsuariosDB,
  transmitirPosicionDB,
  obtenerPosicionesEnVivoDB,
  suscribirPosicionesEnVivo
} from './lib/supabase';

export default function App() {
  const [tab, setTab] = useState('pipeline');
  
  const [usuarioActivo, setUsuarioActivo] = useState(() => {
    const local = localStorage.getItem('app_obras_usuario_activo');
    return local ? JSON.parse(local) : null;
  });

  const [usuarios, setUsuarios] = useState(() => {
    const local = localStorage.getItem('app_obras_usuarios');
    return local ? JSON.parse(local) : USUARIOS_INICIALES;
  });

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
  const [sincronizando, setSincronizando] = useState(isSupabaseConfigured);
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

  // Sincronización nube
  useEffect(() => {
    async function sincronizarConNube() {
      if (!isSupabaseConfigured) return;
      try {
        setSincronizando(true);
        const [clientesDB, obrasDB, movimientosDB, usuariosDB] = await Promise.all([
          obtenerClientesDB(),
          obtenerObrasDB(),
          obtenerMovimientosDB(),
          obtenerUsuariosDB()
        ]);

        if (clientesDB && clientesDB.length > 0) setClientes(clientesDB);
        if (obrasDB && obrasDB.length > 0) setObras(obrasDB);
        if (movimientosDB && movimientosDB.length > 0) setMovimientos(movimientosDB);
        if (usuariosDB && usuariosDB.length > 0) setUsuarios(usuariosDB);

        if (esDirector) {
          const flota = await obtenerPosicionesEnVivoDB();
          setAsesoresEnVivo(flota);
        }
      } catch (err) {
        console.warn('Operando en modo local:', err);
      } finally {
        setSincronizando(false);
      }
    }

    sincronizarConNube();

    if (esDirector) {
      const desuscribir = suscribirPosicionesEnVivo((flota) => setAsesoresEnVivo(flota));
      return () => desuscribir();
    }
  }, [esDirector]);

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

  // Handlers Obras
  const handleGuardarObra = async (nuevaObra) => {
    try { await guardarObraDB(nuevaObra); } catch {}

    if (obraAEditar) {
      setObras(prev => prev.map(o => o.id === obraAEditar.id ? nuevaObra : o));
      if (obraSeleccionada && obraSeleccionada.id === nuevaObra.id) setObraSeleccionada(nuevaObra);
      setObraAEditar(null);
    } else {
      setObras(prev => [nuevaObra, ...prev]);
    }
  };

  // Handlers Clientes
  const handleGuardarCliente = async (nuevoCliente) => {
    try { await guardarClienteDB(nuevoCliente); } catch {}

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
      try { await eliminarObraDB(id); } catch {}
      setObras(prev => prev.filter(o => o.id !== id));
      setVisitas(prev => prev.filter(v => v.obraId !== id));
      setMovimientos(prev => prev.filter(m => m.obraId !== id));
      if (obraSeleccionada && obraSeleccionada.id === id) setObraSeleccionada(null);
    } else if (itemAEliminar.tipo === 'cliente') {
      try { await eliminarClienteDB(itemAEliminar.data.id); } catch {}
      setClientes(prev => prev.filter(c => c.id !== itemAEliminar.data.id));
    }

    setItemAEliminar(null);
  };

  const handleGuardarVisita = (nuevaVisita) => {
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
    try { await guardarMovimientoDB(nuevoMov); } catch {}
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

  // EXPORTADOR CON ESQUEMA ESTRELLA 100% COMPATIBLE CON POWER BI Y EXCEL
  const exportarAExcel = () => {
    if (!esDirector) return;

    const obrasAExportar = filtroSucursal === 'TODAS'
      ? obras
      : obras.filter(o => o.sucursal === filtroSucursal);

    // 1. Tabla Dim_Obras
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
        fecha_ultima_visita: ultima ? ultima.fecha.replace(' ', 'T') : null,
        total_cotizado_mxn: totalCotizado,
        total_vendido_mxn: totalVendido,
        latitud: o.lat ? Number(parseFloat(o.lat).toFixed(6)) : null,
        longitud: o.lng ? Number(parseFloat(o.lng).toFixed(6)) : null,
        direccion: o.direccion || ''
      };
    });

    // 2. Tabla Fact_Visitas
    const hojaVisitas = visitas.map(v => ({
      visita_id: v.id,
      obra_id: v.obraId,
      sucursal: v.sucursal,
      asesor_nombre: v.asesorNombre || 'Asesor',
      fecha_hora: v.fecha ? v.fecha.replace(' ', 'T') : null,
      fase_detectada: v.estatus,
      actividad: v.actividad,
      distancia_auditoria_metros: Number(v.distanciaAuditoriaMetros) || 0,
      estado_auditoria_gps: v.auditoriaEstado || 'remoto',
      latitud_real_gps: v.latGpsReal ? Number(parseFloat(v.latGpsReal).toFixed(6)) : null,
      longitud_real_gps: v.lngGpsReal ? Number(parseFloat(v.lngGpsReal).toFixed(6)) : null,
      cantidad_fotos: (v.fotos || []).length,
      observaciones: v.observaciones || ''
    }));

    // 3. Tabla Fact_Movimientos
    const hojaMovimientos = movimientos.map(m => ({
      movimiento_id: m.id,
      obra_id: m.obraId,
      tipo_movimiento: m.tipo,
      tipo_comprobante: m.comprobante || (m.tipo === 'VENTA' ? 'REMISION' : 'COTIZACION'),
      folio_documento: m.folio,
      monto_mxn: Number(m.monto) || 0,
      estatus: m.estatus || 'PENDIENTE',
      forma_pago: m.formaPago || 'N/A',
      tipo_entrega: m.tipoEntrega || 'DOMICILIO',
      fecha_hora: m.fecha ? m.fecha.replace(' ', 'T') : null,
      cotizacion_origen_id: m.cotizacionOrigenId || 'DIRECTA',
      tiene_adjunto: m.documentoAdjunto?.url ? 'SI' : 'NO'
    }));

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaObras), 'Dim_Obras');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaVisitas), 'Fact_Visitas');
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(hojaMovimientos), 'Fact_Movimientos');

    const fechaHoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `PowerBI_Control_Obras_${filtroSucursal}_${fechaHoy}.xlsx`);
  };

  // Cálculos dinámicos para el Panel de Metas
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

  if (!usuarioActivo) {
    return <PantallaPin usuarios={usuarios} onLogin={(u) => setUsuarioActivo(u)} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 pb-24 font-sans">
      
      <Header 
        gpsEstado={gpsEstado} 
        tabletPos={tabletPos} 
        onExportarExcel={exportarAExcel}
        sincronizando={sincronizando}
        usuarioActivo={usuarioActivo}
        onLogout={() => setUsuarioActivo(null)}
        onAbrirKpis={() => setModalKpisAbierto(true)}
      />

      <main className="w-full px-3 py-3 space-y-3">
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

      {!algunModalAbierto && (
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
          className="fixed bottom-20 right-4 z-30 bg-[#0091FB] hover:bg-[#007be0] active:scale-95 text-white p-4 rounded-2xl shadow-xl shadow-[#0091FB]/30 flex items-center gap-2 font-black text-sm transition-all">
          {tab === 'clientes' ? <UserPlus className="w-5 h-5 stroke-[2.5]" /> : <Building2 className="w-5 h-5 stroke-[2.5]" />}
          <span>{tab === 'clientes' ? '+ Nuevo Cliente' : '+ Nueva Obra'}</span>
        </button>
      )}

      <BottomNav tab={tab} setTab={setTab} usuarioActivo={usuarioActivo} />

      {/* PANEL DE METAS Y KPIS (AHORA TOTALMENTE CONECTADO) */}
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
      />

      {/* EXPEDIENTE 360° */}
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

      {/* CREAR / EDITAR OBRA */}
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

      {/* ALTA / EDICIÓN DE CLIENTE */}
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

      {/* CHECK-IN VISITA */}
      <ModalVisita
        isOpen={modalVisitaAbierto}
        onClose={() => { setModalVisitaAbierto(false); setObraParaVisita(null); }}
        obra={obraParaVisita}
        onSave={handleGuardarVisita}
        tabletPos={tabletPos}
        usuarioActivo={usuarioActivo}
      />

      {/* COTIZACIÓN O VENTA */}
      <ModalComercial
        isOpen={modalComercialAbierto}
        onClose={() => { setModalComercialAbierto(false); setConfigComercial(null); }}
        obra={configComercial?.obra}
        tipoDefault={configComercial?.tipo || 'COTIZACION'}
        onSave={handleGuardarMovimiento}
      />

      {/* SELECTOR GPS */}
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

      {/* NAVEGACIÓN GPS */}
      <ModalNavegacion 
        isOpen={Boolean(destinoRuta)}
        onClose={() => setDestinoRuta(null)}
        destino={destinoRuta}
      />

      {/* VISOR FOTOS/PDF */}
      <ModalVisor 
        visorModal={visorModal}
        onClose={() => setVisorModal(null)}
      />

      {/* CONFIRMACIÓN DE BORRADO SEGURO */}
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