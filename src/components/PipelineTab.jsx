// src/components/PipelineTab.jsx
import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, User, ChevronRight,
  Pencil, Trash2, Building2, Flame, Snowflake, Clock, X
} from 'lucide-react';
import { SUCURSALES, FASES_OBRA, FASE_COLORS } from '../data/constants';

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
  onEditarObra,
  onEliminarObra,
  usuarioActivo 
}) {
  const esAdmin = usuarioActivo?.sucursal === 'TODAS';
  const [filtroEspecial, setFiltroEspecial] = useState('TODAS');
  const [filtroEstadoObra, setFiltroEstadoObra] = useState('ACTIVA'); // 'ACTIVA' por defecto para pantalla limpia
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);

  const obrasPorSucursal = obras.filter(o => 
    filtroSucursal === 'TODAS' || o.sucursal === filtroSucursal
  );

  const obrasProcesadas = obrasPorSucursal.map(obra => {
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

    return {
      ...obra,
      cliente,
      totalVisitas,
      cotizado,
      vendido,
      diasSinVisita
    };
  });

  const obrasFiltradas = obrasProcesadas
    .filter(o => filtroEstadoObra === 'TODAS' || (o.estadoObra || 'ACTIVA') === filtroEstadoObra)
    .filter(o => filtroFase === 'TODAS' || o.estatusFase === filtroFase)
    .filter(o => {
      if (filtroEspecial === 'HOY') return o.diasSinVisita === 0;
      if (filtroEspecial === 'FRIAS') return o.diasSinVisita > 12;
      if (filtroEspecial === 'SIN_CLIENTE') return !o.clienteId;
      return true;
    })
    .filter(o => {
      const q = search.toLowerCase();
      return (
        o.nombre.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.cliente?.nombreCliente && o.cliente.nombreCliente.toLowerCase().includes(q))
      );
    });

  const filtrosActivosCount = (filtroSucursal !== 'TODAS' ? 1 : 0) + 
                             (filtroFase !== 'TODAS' ? 1 : 0) + 
                             (filtroEspecial !== 'TODAS' ? 1 : 0) +
                             (filtroEstadoObra !== 'ACTIVA' ? 1 : 0);

  return (
    <div className="space-y-2.5 pb-24">
      
      {/* BUSCADOR COMPACTO + BOTÓN FILTROS */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por obra, folio o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0091FB] shadow-2xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setModalFiltrosAbierto(true)}
          className={`h-10 px-3.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition-all active:scale-95 shrink-0 shadow-2xs ${
            filtrosActivosCount > 0 
              ? 'bg-[#001757] text-white border-[#001757]' 
              : 'bg-white text-[#001757] border-slate-200 hover:bg-slate-50'
          }`}>
          <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Filtros</span>
          {filtrosActivosCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0091FB] text-white text-[9px] font-black flex items-center justify-center">
              {filtrosActivosCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400">
        <span>{obrasFiltradas.length} obras {filtroEstadoObra === 'ACTIVA' ? 'en proceso' : filtroEstadoObra === 'PAUSADA' ? 'pausadas' : filtroEstadoObra === 'TERMINADA' ? 'concluidas' : 'totales'}</span>
        {filtroSucursal !== 'TODAS' && (
          <span className="font-extrabold text-[#001757] bg-blue-50 px-2 py-0.5 rounded-md">
            {filtroSucursal}
          </span>
        )}
      </div>

      {/* LISTADO DE TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {obrasFiltradas.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-200/90 space-y-1.5">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-black text-slate-800">No encontramos ninguna obra</h4>
            <p className="text-[11px] text-slate-400">Prueba cambiando tus filtros de estado o fase.</p>
          </div>
        ) : (
          obrasFiltradas.map(obra => {
            const esFria = obra.diasSinVisita > 12;

            return (
              <div
                key={obra.id}
                onClick={() => onSeleccionarObra(obra)}
                className="w-full bg-white hover:border-[#0091FB] active:scale-[0.99] cursor-pointer rounded-2xl border border-slate-200/90 px-3.5 py-3 shadow-2xs hover:shadow-sm transition-all space-y-2">
                
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                      {obra.id}
                    </span>
                    <h3 className="text-sm font-black text-[#001757] tracking-tight truncate leading-tight">
                      {obra.nombre}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${FASE_COLORS[obra.estatusFase]}`}>
                      {obra.estatusFase}
                    </span>

                    {obra.estadoObra === 'PAUSADA' ? (
                      <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Pausada</span>
                    ) : obra.estadoObra === 'TERMINADA' ? (
                      <span className="text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Concluida</span>
                    ) : obra.diasSinVisita === 0 ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Visitada Hoy" />
                    ) : esFria ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title={`Hace ${obra.diasSinVisita} días`} />
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <p className="truncate font-semibold flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-[#0091FB] shrink-0" />
                    <span className="truncate">{obra.cliente ? obra.cliente.nombreCliente : 'Sin cliente asignado'}</span>
                  </p>

                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {obra.diasSinVisita === 0 ? 'Hoy' : `Hace ${obra.diasSinVisita}d`} • {obra.sucursal}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Cotizado</span>
                      <strong className="text-xs font-black text-[#001757] leading-tight block mt-0.5">
                        {formatearMoneda(obra.cotizado)}
                      </strong>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Vendido</span>
                      <strong className="text-xs font-black text-emerald-600 leading-tight block mt-0.5">
                        {formatearMoneda(obra.vendido)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditarObra(obra);
                      }}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#0091FB] hover:bg-blue-50 flex items-center justify-center transition-colors"
                      title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarObra(obra);
                      }}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                      title="Borrar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[#0091FB] pl-1 font-bold">
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE FILTROS */}
      {modalFiltrosAbierto && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#001757]">Filtros de Obras</h3>
                <p className="text-xs text-slate-400 font-medium">Personaliza tu vista en campo</p>
              </div>
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ciclo de Vida: En Proceso / Pausadas / Concluidas */}
            <div className="space-y-1.5">
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
                    className={`py-2 rounded-xl text-xs font-black border transition-all ${
                      filtroEstadoObra === est.id ? 'bg-[#001757] text-white border-[#001757]' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                    {est.label}
                  </button>
                ))}
              </div>
            </div>

            {esAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Sucursal</label>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl border border-slate-200 bg-white font-bold text-xs text-[#001757] outline-none">
                  <option value="TODAS">Todas las Sucursales ({SUCURSALES.length})</option>
                  {SUCURSALES.map(s => <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Actividad</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'TODAS', label: 'Todas' },
                  { id: 'HOY', label: 'Visitadas Hoy' },
                  { id: 'FRIAS', label: 'Frías (>12d)' },
                  { id: 'SIN_CLIENTE', label: 'Sin Cliente' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltroEspecial(item.id)}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs border transition-all ${
                      filtroEspecial === item.id 
                        ? 'bg-[#001757] text-white border-[#001757]' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Fase Constructiva</label>
              <select
                value={filtroFase}
                onChange={(e) => setFiltroFase(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl border border-slate-200 bg-white font-bold text-xs text-[#001757] outline-none">
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
                  setFiltroEspecial('TODAS');
                  setFiltroEstadoObra('ACTIVA');
                  setSearch('');
                  setModalFiltrosAbierto(false);
                }}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">
                Limpiar
              </button>

              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="flex-1 py-3 rounded-2xl bg-[#0091FB] hover:bg-[#007be0] text-white font-black text-xs shadow-md shadow-electric/25">
                Aplicar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}