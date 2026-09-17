// src/components/PipelineTab.jsx
import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, User, ChevronRight,
  Pencil, Trash2, Building2, Snowflake, Clock, X,
  Camera, MapPin, DollarSign, Plus
} from 'lucide-react';
import { SUCURSALES, FASES_OBRA, FASE_COLORS, ETAPAS_COMERCIALES, CAT_TIPOS_OBRA } from '../data/constants';

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
  onNuevaVisita,
  onNuevoMovimiento
}) {
  const esAdmin = usuarioActivo?.sucursal === 'TODAS' || usuarioActivo?.rol === 'admin';
  const [filtroEstadoObra, setFiltroEstadoObra] = useState('ACTIVA');
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);
  const [vistaRapida, setVistaRapida] = useState('CERCANIA');

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
    let list = obrasProcesadas
      .filter(o => filtroEstadoObra === 'TODAS' || (o.estadoObra || 'ACTIVA') === filtroEstadoObra)
      .filter(o => filtroFase === 'TODAS' || o.estatusFase === filtroFase)
      .filter(o => {
        if (vistaRapida === 'HOY') return o.diasSinVisita === 0;
        if (vistaRapida === 'FRIAS') return o.diasSinVisita > 12;
        if (vistaRapida === 'SIN_CLIENTE') return !o.clienteId;
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
      if (vistaRapida === 'CERCANIA') {
        if (a.distanciaMetros === null) return 1;
        if (b.distanciaMetros === null) return -1;
        return a.distanciaMetros - b.distanciaMetros;
      }
      if (vistaRapida === 'FRIAS') {
        return b.diasSinVisita - a.diasSinVisita;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [obrasProcesadas, filtroEstadoObra, filtroFase, vistaRapida, search]);

  const filtrosActivosCount = (filtroSucursal !== 'TODAS' ? 1 : 0) + 
                             (filtroFase !== 'TODAS' ? 1 : 0) + 
                             (filtroEstadoObra !== 'ACTIVA' ? 1 : 0);

  return (
    <div className="space-y-3 pb-28">
      
      {/* 1. ÚNICO BOTÓN: DAR DE ALTA OBRA (LIMPIO Y COMPLETO) */}
      <button
        type="button"
        onClick={onNuevaObra}
        className="w-full h-12 bg-gradient-to-r from-[#001757] via-[#00227a] to-[#0091FB] active:scale-98 text-white rounded-2xl px-4 flex items-center justify-between shadow-sm transition-all text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-white stroke-[3]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black leading-tight">Dar de Alta Nueva Obra</p>
            <p className="text-[10px] text-blue-200 font-medium">Registrar proyecto territorial en campo</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/70" />
      </button>

      {/* 2. BARRA DE BÚSQUEDA COMPACTA */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>

          <input 
            type="text"
            placeholder="Buscar obra, folio o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-9 rounded-2xl border border-slate-300/80 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0091FB] focus:ring-2 focus:ring-[#0091FB]/15 shadow-2xs transition-all"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalFiltrosAbierto(true)}
          className={`h-11 px-3.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition-all active:scale-95 shrink-0 shadow-2xs ${
            filtrosActivosCount > 0 
              ? 'bg-[#001757] text-white border-[#001757]' 
              : 'bg-white text-[#001757] border-slate-300/80 hover:bg-slate-50'
          }`}>
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {filtrosActivosCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0091FB] text-white text-[10px] font-black flex items-center justify-center">
              {filtrosActivosCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. CÁPSULAS INTELIGENTES */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
        {[
          { id: 'CERCANIA', label: '📍 Más Cercanas' },
          { id: 'FRIAS', label: '❄️ Frías (>12d)' },
          { id: 'HOY', label: '✓ Visitadas Hoy' },
          { id: 'SIN_CLIENTE', label: '👤 Sin Cliente' },
          { id: 'RECIENTES', label: '🕒 Recientes' }
        ].map(item => {
          const activo = vistaRapida === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setVistaRapida(item.id)}
              className={`min-h-[34px] px-3 rounded-xl font-black text-[11px] whitespace-nowrap transition-all active:scale-95 border flex items-center gap-1 ${
                activo
                  ? item.id === 'FRIAS'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-[#001757] text-white border-[#001757] shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
              }`}>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between px-1 text-[11px] font-extrabold text-slate-400">
        <span>{obrasFiltradas.length} obra{obrasFiltradas.length === 1 ? '' : 's'} mostrada{obrasFiltradas.length === 1 ? '' : 's'}</span>
        {filtroSucursal !== 'TODAS' && (
          <span className="font-black text-[#001757] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[10px]">
            {filtroSucursal}
          </span>
        )}
      </div>

      {/* Cuadrícula de Obras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {obrasFiltradas.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-black text-slate-800">No hay obras bajo este filtro</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Prueba seleccionando otra cápsula o da de alta una nueva obra.
            </p>
          </div>
        ) : (
          obrasFiltradas.map(obra => {
            const distanciaTexto = formatearDistancia(obra.distanciaMetros);
            const tipoInfo = CAT_TIPOS_OBRA.find(t => t.id === obra.tipoObra) || CAT_TIPOS_OBRA[0];

            return (
              <div
                key={obra.id}
                className="w-full bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                
                <div 
                  onClick={() => onSeleccionarObra(obra)}
                  className="cursor-pointer space-y-2">
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] shrink-0 border border-slate-200">
                        {obra.id}
                      </span>
                      <span className="text-[10px] font-black bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                        {tipoInfo.icono} {tipoInfo.label.split('/')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {distanciaTexto && (
                        <span className="text-[10px] font-black bg-blue-50 text-[#0091FB] border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {distanciaTexto}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${FASE_COLORS[obra.estatusFase]}`}>
                        {obra.estatusFase}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-[#001757] tracking-tight truncate leading-snug">
                    {obra.nombre}
                  </h3>

                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <p className="truncate font-bold flex items-center gap-1 text-xs text-slate-700">
                      <User className="w-3.5 h-3.5 text-[#0091FB] shrink-0" />
                      <span className="truncate">{obra.cliente ? obra.cliente.nombreCliente : 'Sin cliente asignado'}</span>
                    </p>

                    <span className="text-[10px] text-slate-500 font-bold shrink-0">
                      {obra.diasSinVisita === 0 ? 'Visitada hoy' : `Hace ${obra.diasSinVisita}d`}
                    </span>
                  </div>

                  {/* Resumen Financiero */}
                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase font-black text-slate-400 block leading-none">Cotizado</span>
                      <strong className="text-xs font-black text-[#001757] block mt-0.5">
                        {formatearMoneda(obra.cotizado)}
                      </strong>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[8px] uppercase font-black text-slate-400 block leading-none">Vendido</span>
                      <strong className="text-xs font-black text-emerald-600 block mt-0.5">
                        {formatearMoneda(obra.vendido)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditarObra(obra); }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#0091FB] hover:bg-white flex items-center justify-center transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEliminarObra(obra); }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNuevaVisita && onNuevaVisita(obra)}
                    className="min-h-[38px] px-2 bg-gradient-to-r from-[#0091FB] to-[#007be0] active:scale-95 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>+ Visita</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNuevoMovimiento && onNuevoMovimiento({ obra, tipo: 'VENTA' })}
                    className="min-h-[38px] px-2 bg-emerald-600 active:scale-95 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-all">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>+ Venta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSeleccionarObra(obra)}
                    className="min-h-[38px] px-2 bg-slate-100 active:scale-95 text-slate-800 font-black text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all">
                    <span>Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal Avanzado de Filtros */}
      {modalFiltrosAbierto && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto border border-slate-200 my-auto pb-8">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#001757]">Filtros Específicos</h3>
                <p className="text-[11px] text-slate-400 font-medium">Ajusta tu búsqueda en campo</p>
              </div>
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {esAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Sucursal</label>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-xs text-[#001757] outline-none focus:border-[#0091FB]">
                  <option value="TODAS">Todas las Sucursales ({SUCURSALES.length})</option>
                  {SUCURSALES.map(s => <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Estado de la Obra</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ACTIVA', label: 'En Proceso' },
                  { id: 'PAUSADA', label: 'Pausadas' },
                  { id: 'TODAS', label: 'Todas' }
                ].map(est => (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => setFiltroEstadoObra(est.id)}
                    className={`min-h-[40px] py-1.5 rounded-xl text-xs font-black border transition-all ${
                      filtroEstadoObra === est.id ? 'bg-[#001757] text-white border-[#001757]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                    {est.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Fase Constructiva Física</label>
              <select
                value={filtroFase}
                onChange={(e) => setFiltroFase(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-xs text-[#001757] outline-none focus:border-[#0091FB]">
                <option value="TODAS">Todas las Fases</option>
                {FASES_OBRA.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFiltroSucursal('TODAS');
                  setFiltroFase('TODAS');
                  setFiltroEstadoObra('ACTIVA');
                  setVistaRapida('CERCANIA');
                  setSearch('');
                  setModalFiltrosAbierto(false);
                }}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 text-slate-700 font-black text-xs">
                Restablecer
              </button>
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-[#0091FB] text-white font-black text-xs shadow-md">
                Aplicar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}