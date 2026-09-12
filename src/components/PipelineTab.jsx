// src/components/PipelineTab.jsx
import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, User, ChevronRight,
  Pencil, Trash2, Building2, Snowflake, Clock, X,
  Camera, MapPin, ArrowDownUp
} from 'lucide-react';
import { SUCURSALES, FASES_OBRA, FASE_COLORS } from '../data/constants';

function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
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

const formatearDistancia = (metros) => {
  if (metros === null || metros === undefined) return null;
  if (metros < 1000) return `${metros}m`;
  return `${(metros / 1000).toFixed(1)}km`;
};

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const calcularDiasDesdeFecha = (fechaStr) => {
  if (!fechaStr) return 999;
  try {
    const d = new Date(fechaStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return 999;
    const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  } catch {
    return 999;
  }
};

export default function PipelineTab({ 
  obras = [], 
  visitas = [], 
  movimientos = [], 
  clientes = [],
  search, 
  setSearch, 
  filtroFase, 
  setFiltroFase, 
  filtroSucursal, 
  setFiltroSucursal, 
  onSeleccionarObra,
  onNuevaObra,
  onEditarObra,
  onEliminarObra,
  usuarioActivo,
  tabletPos,
  onNuevaVisita
}) {
  const esAdmin = usuarioActivo?.sucursal === 'TODAS' || usuarioActivo?.rol === 'admin';
  const [filtroEspecial, setFiltroEspecial] = useState('TODAS');
  const [filtroEstadoObra, setFiltroEstadoObra] = useState('ACTIVA');
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);
  const [criterioOrden, setCriterioOrden] = useState('CERCANIA');

  const obrasPorSucursal = obras.filter(o => 
    filtroSucursal === 'TODAS' || o.sucursal === filtroSucursal
  );

  const obrasProcesadas = useMemo(() => {
    return obrasPorSucursal.map(obra => {
      const visitasDeObra = visitas.filter(v => v.obraId === obra.id)
        .sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')));
      
      const movimientosDeObra = movimientos.filter(m => m.obraId === obra.id);
      const ultimaVisita = visitasDeObra[0] || null;
      const totalVisitas = visitasDeObra.length;
      const cliente = clientes.find(c => c.id === obra.clienteId);

      const cotizado = movimientosDeObra
        .filter(m => m.tipo === 'COTIZACION')
        .reduce((acc, c) => acc + (Number(c.monto) || 0), 0);

      const vendido = movimientosDeObra
        .filter(m => m.tipo === 'VENTA')
        .reduce((acc, v) => acc + (Number(v.monto) || 0), 0);

      const diasSinVisita = ultimaVisita ? calcularDiasDesdeFecha(ultimaVisita.fecha) : 999;

      const distanciaMetros = (tabletPos?.lat && tabletPos?.lng && obra.lat && obra.lng)
        ? calcularDistanciaMetros(tabletPos.lat, tabletPos.lng, parseFloat(obra.lat), parseFloat(obra.lng))
        : null;

      return {
        ...obra,
        cliente,
        totalVisitas,
        cotizado,
        vendido,
        diasSinVisita,
        distanciaMetros
      };
    });
  }, [obrasPorSucursal, visitas, movimientos, clientes, tabletPos]);

  const obrasFiltradas = useMemo(() => {
    const list = obrasProcesadas
      .filter(o => filtroEstadoObra === 'TODAS' || (o.estadoObra || 'ACTIVA') === filtroEstadoObra)
      .filter(o => filtroFase === 'TODAS' || o.estatusFase === filtroFase)
      .filter(o => {
        if (filtroEspecial === 'HOY') return o.diasSinVisita === 0;
        if (filtroEspecial === 'FRIAS') return o.diasSinVisita > 12;
        if (filtroEspecial === 'SIN_CLIENTE') return !o.clienteId;
        return true;
      })
      .filter(o => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
          o.nombre.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.cliente?.nombreCliente && o.cliente.nombreCliente.toLowerCase().includes(q)) ||
          (o.direccion && o.direccion.toLowerCase().includes(q))
        );
      });

    return list.sort((a, b) => {
      if (criterioOrden === 'CERCANIA') {
        if (a.distanciaMetros === null) return 1;
        if (b.distanciaMetros === null) return -1;
        return a.distanciaMetros - b.distanciaMetros;
      }
      if (criterioOrden === 'DIAS_SIN_VISITA') {
        return b.diasSinVisita - a.diasSinVisita;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [obrasProcesadas, filtroEstadoObra, filtroFase, filtroEspecial, search, criterioOrden]);

  const filtrosActivosCount = (filtroSucursal !== 'TODAS' ? 1 : 0) + 
                             (filtroFase !== 'TODAS' ? 1 : 0) + 
                             (filtroEspecial !== 'TODAS' ? 1 : 0) +
                             (filtroEstadoObra !== 'ACTIVA' ? 1 : 0);

  return (
    <div className="space-y-3.5 pb-28">
      
      {/* Barra de Búsqueda y Filtros con Adaptabilidad Elástica */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por obra, folio o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-2xl border border-slate-300/80 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0091FB] focus:ring-2 focus:ring-[#0091FB]/15 shadow-sm transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => setModalFiltrosAbierto(true)}
          className={`h-11 px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 border transition-all active:scale-95 shrink-0 shadow-sm ${
            filtrosActivosCount > 0 
              ? 'bg-[#001757] text-white border-[#001757]' 
              : 'bg-white text-[#001757] border-slate-300/80 hover:bg-slate-50'
          }`}>
          <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
          <span>Filtros</span>
          {filtrosActivosCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0091FB] text-white text-[10px] font-black flex items-center justify-center">
              {filtrosActivosCount}
            </span>
          )}
        </button>
      </div>

      {/* Selectores de Ordenamiento Táctil */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setCriterioOrden('CERCANIA')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            criterioOrden === 'CERCANIA'
              ? 'bg-[#001757] text-white shadow-md shadow-[#001757]/20 scale-102'
              : 'bg-white text-slate-600 border border-slate-300/80 hover:bg-slate-50'
          }`}>
          <MapPin className="w-3.5 h-3.5 text-[#0091FB]" />
          <span>Más Cercanas</span>
        </button>

        <button
          type="button"
          onClick={() => setCriterioOrden('DIAS_SIN_VISITA')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            criterioOrden === 'DIAS_SIN_VISITA'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-102'
              : 'bg-white text-slate-600 border border-slate-300/80 hover:bg-slate-50'
          }`}>
          <Snowflake className="w-3.5 h-3.5 text-rose-300" />
          <span>Frías (&gt;12d)</span>
        </button>

        <button
          type="button"
          onClick={() => setCriterioOrden('RECIENTES')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            criterioOrden === 'RECIENTES'
              ? 'bg-[#001757] text-white shadow-md shadow-[#001757]/20 scale-102'
              : 'bg-white text-slate-600 border border-slate-300/80 hover:bg-slate-50'
          }`}>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Recientes</span>
        </button>
      </div>

      {/* Contador de Obras */}
      <div className="flex items-center justify-between px-1 text-[11px] sm:text-xs font-extrabold text-slate-500">
        <span>{obrasFiltradas.length} obras {filtroEstadoObra === 'ACTIVA' ? 'activas' : filtroEstadoObra === 'PAUSADA' ? 'pausadas' : filtroEstadoObra === 'TERMINADA' ? 'concluidas' : 'totales'}</span>
        {filtroSucursal !== 'TODAS' && (
          <span className="font-black text-[#001757] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            {filtroSucursal}
          </span>
        )}
      </div>

      {/* CUADRÍCULA INTELIGENTE:
          - Celulares: 1 columna
          - Tablets (ambas orientaciones): 2 columnas
          - Pantallas Grandes / Monitores: 3 columnas
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {obrasFiltradas.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-black text-slate-800">No encontramos obras con esos filtros</h4>
            <p className="text-xs text-slate-400">Prueba cambiando la búsqueda o los filtros seleccionados.</p>
          </div>
        ) : (
          obrasFiltradas.map(obra => {
            const esFria = obra.diasSinVisita > 12;
            const distanciaTexto = formatearDistancia(obra.distanciaMetros);

            return (
              <div
                key={obra.id}
                onClick={() => onSeleccionarObra(obra)}
                className="w-full bg-white hover:border-[#0091FB] active:scale-[0.99] cursor-pointer rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all duration-150 space-y-3 flex flex-col justify-between">
                
                {/* Parte Superior */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] shrink-0 border border-slate-200">
                        {obra.id}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-[#001757] tracking-tight truncate leading-snug">
                        {obra.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {distanciaTexto && (
                        <span className="text-[10px] font-black bg-blue-50 text-[#0091FB] border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {distanciaTexto}
                        </span>
                      )}

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${FASE_COLORS[obra.estatusFase]}`}>
                        {obra.estatusFase}
                      </span>

                      {obra.estadoObra === 'PAUSADA' ? (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Pausada</span>
                      ) : obra.estadoObra === 'TERMINADA' ? (
                        <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Concluida</span>
                      ) : obra.diasSinVisita === 0 ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" title="Visitada Hoy" />
                      ) : esFria ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" title={`Hace ${obra.diasSinVisita} días`} />
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <p className="truncate font-bold flex items-center gap-1.5 text-xs text-slate-700">
                      <User className="w-3.5 h-3.5 text-[#0091FB] shrink-0" />
                      <span className="truncate">{obra.cliente ? obra.cliente.nombreCliente : 'Sin cliente asignado'}</span>
                    </p>

                    <span className="text-[11px] text-slate-500 font-bold shrink-0">
                      {obra.diasSinVisita === 0 ? 'Visitada hoy' : `Hace ${obra.diasSinVisita}d`} • {obra.sucursal}
                    </span>
                  </div>
                </div>

                {/* Parte Inferior: Balance y Botones */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block leading-none">Cotizado</span>
                      <strong className="text-xs sm:text-sm font-black text-[#001757] leading-tight block mt-0.5">
                        {formatearMoneda(obra.cotizado)}
                      </strong>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] uppercase font-black text-slate-400 block leading-none">Vendido</span>
                      <strong className="text-xs sm:text-sm font-black text-emerald-600 leading-tight block mt-0.5">
                        {formatearMoneda(obra.vendido)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onNuevaVisita && obra.estadoObra !== 'TERMINADA' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNuevaVisita(obra);
                        }}
                        className="h-9 px-3 bg-gradient-to-r from-[#0091FB] to-[#007be0] hover:brightness-105 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0091FB]/30 transition-all"
                        title="Check-in Inmediato">
                        <Camera className="w-4 h-4 stroke-[2.4]" />
                        <span>Check-in</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditarObra(obra);
                      }}
                      className="w-9 h-9 rounded-xl text-slate-400 hover:text-[#0091FB] hover:bg-blue-50 flex items-center justify-center transition-colors active:scale-90"
                      title="Editar Obra">
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarObra(obra);
                      }}
                      className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors active:scale-90"
                      title="Borrar Obra">
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <span className="text-[#0091FB] pl-0.5 font-bold">
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal de Filtros con Estilo Bottom Sheet */}
      {modalFiltrosAbierto && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto border border-slate-200">
            
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#001757]">Filtros de Obras</h3>
                <p className="text-xs text-slate-400 font-medium">Personaliza tu terminal de campo</p>
              </div>
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Estado de la Obra</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'ACTIVA', label: 'Proceso' },
                  { id: 'PAUSADA', label: 'Pausadas' },
                  { id: 'TERMINADA', label: 'Concluidas' },
                  { id: 'TODAS', label: 'Todas' }
                ].map(est => (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => setFiltroEstadoObra(est.id)}
                    className={`min-h-[42px] py-2 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                      filtroEstadoObra === est.id ? 'bg-[#001757] text-white border-[#001757] shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                    {est.label}
                  </button>
                ))}
              </div>
            </div>

            {esAdmin && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Sucursal</label>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-xs text-[#001757] outline-none">
                  <option value="TODAS">Todas las Sucursales ({SUCURSALES.length})</option>
                  {SUCURSALES.map(s => <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Condición de Supervisión</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'TODAS', label: 'Todas las obras' },
                  { id: 'HOY', label: 'Visitadas Hoy' },
                  { id: 'FRIAS', label: 'Frías (>12 días)' },
                  { id: 'SIN_CLIENTE', label: 'Sin Cliente Asignado' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltroEspecial(item.id)}
                    className={`min-h-[44px] px-3 rounded-2xl font-black text-xs border transition-all active:scale-95 ${
                      filtroEspecial === item.id 
                        ? 'bg-[#001757] text-white border-[#001757] shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Fase Constructiva</label>
              <select
                value={filtroFase}
                onChange={(e) => setFiltroFase(e.target.value)}
                className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-xs text-[#001757] outline-none">
                <option value="TODAS">Todas las Fases</option>
                {FASES_OBRA.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="pt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFiltroSucursal('TODAS');
                  setFiltroFase('TODAS');
                  setFiltroEspecial('TODAS');
                  setFiltroEstadoObra('ACTIVA');
                  setCriterioOrden('CERCANIA');
                  setSearch('');
                  setModalFiltrosAbierto(false);
                }}
                className="flex-1 min-h-[46px] rounded-2xl border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:scale-95">
                Limpiar
              </button>

              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="flex-1 min-h-[46px] rounded-2xl bg-[#0091FB] hover:bg-[#007be0] text-white font-black text-xs shadow-md shadow-[#0091FB]/30 active:scale-95">
                Aplicar Filtros
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}