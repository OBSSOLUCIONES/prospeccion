// src/components/ResumenKpis.jsx
import React, { useState } from 'react';
import { 
  X, Target, DollarSign, Briefcase, TrendingUp, 
  Snowflake, CheckCircle2, Building2, AlertCircle, Clock, ChevronRight
} from 'lucide-react';
import { SUCURSALES } from '../data/constants';

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ResumenKpis({ 
  isOpen, 
  onClose, 
  sucursal, 
  visitasHoy, 
  metaDiaria = 5, 
  porcentajeMeta, 
  totalMonto, 
  totalObras, 
  ventasCerradas, 
  totalObrasFrias,
  esDirector = false,
  visitas = [],
  obras = [],
  onSeleccionarSucursal
}) {
  const hoyStr = new Date().toISOString().slice(0, 10);

  if (!isOpen) return null;

  // CÁLCULO DE METAS POR SUCURSAL PARA EL DIRECTOR (EN VIVO HOY)
  const rankingSucursales = SUCURSALES.map(suc => {
    const visitasSucHoy = visitas.filter(v => 
      v.sucursal === suc.nombre && 
      v.fecha && 
      v.fecha.startsWith(hoyStr)
    ).length;

    const obrasSuc = obras.filter(o => o.sucursal === suc.nombre).length;
    const metaSuc = 5;
    const porcentaje = Math.min(100, Math.round((visitasSucHoy / metaSuc) * 100));

    let estado = 'ROJO';
    if (visitasSucHoy >= metaSuc) estado = 'VERDE';
    else if (visitasSucHoy > 0) estado = 'AMARILLO';

    return {
      ...suc,
      visitasHoy: visitasSucHoy,
      meta: metaSuc,
      porcentaje,
      obrasTotales: obrasSuc,
      estado
    };
  }).sort((a, b) => b.visitasHoy - a.visitasHoy);

  const totalVisitasHoyEmpresa = rankingSucursales.reduce((acc, s) => acc + s.visitasHoy, 0);
  const metaTotalEmpresa = SUCURSALES.length * 5; // 50 visitas al día
  const porcentajeGlobalEmpresa = Math.min(100, Math.round((totalVisitasHoyEmpresa / metaTotalEmpresa) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#001757]">
                {esDirector ? 'Control Diario de Metas por Sucursal' : 'Rendimiento y Metas'}
              </h3>
              <span className="bg-blue-100 text-[#001757] font-black text-xs px-2.5 py-0.5 rounded-lg">
                {esDirector ? 'Dirección General' : sucursal}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {esDirector ? `Toca una sucursal para filtrarla y auditarla (${hoyStr})` : 'Progreso de supervisión en campo'}
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 flex items-center justify-center text-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SI ES DIRECTOR: VISTA MAESTRA DE LAS 10 SUCURSALES */}
        {esDirector ? (
          <div className="space-y-3">
            
            {/* Tarjeta Consolidada General */}
            <div className="bg-gradient-to-r from-[#001757] to-[#002b80] text-white p-4 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-200">Avance Total Red Azul Hoy</h4>
                    <p className="text-base font-black text-white">
                      {totalVisitasHoyEmpresa} de {metaTotalEmpresa} visitas completadas
                    </p>
                  </div>
                </div>

                <span className="text-base font-black text-amber-300 bg-white/10 px-3 py-1 rounded-xl">
                  {porcentajeGlobalEmpresa}%
                </span>
              </div>

              <div className="w-full bg-black/25 h-2.5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeGlobalEmpresa}%` }}
                />
              </div>
            </div>

            {/* LISTADO INTERACTIVO: TOCAR UNA SUCURSAL PARA AUDITARLA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase text-slate-400">
                <span>Sucursal (Toca para auditar)</span>
                <span>Visitas Hoy / Meta</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                {rankingSucursales.map(s => {
                  const esVerde = s.estado === 'VERDE';
                  const esAmarillo = s.estado === 'AMARILLO';

                  return (
                    <div 
                      key={s.codigo}
                      onClick={() => {
                        if (onSeleccionarSucursal) {
                          onSeleccionarSucursal(s.nombre);
                          onClose();
                        }
                      }}
                      className="p-3 bg-white flex items-center justify-between gap-2 hover:bg-blue-50/70 active:scale-[0.99] cursor-pointer transition-all group"
                      title={`Filtrar toda la app a ${s.nombre}`}>
                      
                      <div className="min-w-0 flex items-center gap-2">
                        {/* Indicador de semáforo */}
                        <span className={`w-3 h-3 rounded-full shrink-0 ${
                          esVerde ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 
                          esAmarillo ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />

                        <div>
                          <p className="font-black text-slate-900 group-hover:text-[#0091FB] text-xs truncate leading-tight transition-colors">
                            {s.nombre} ({s.codigo})
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {s.obrasTotales} obras activas
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`text-xs font-black ${
                              esVerde ? 'text-emerald-700' : esAmarillo ? 'text-amber-800' : 'text-slate-400'
                            }`}>
                              {s.visitasHoy} / {s.meta}
                            </span>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                              esVerde ? 'bg-emerald-100 text-emerald-800' : esAmarillo ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {s.porcentaje}%
                            </span>
                          </div>
                          
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                            <div
                              className={`h-full rounded-full ${esVerde ? 'bg-emerald-500' : esAmarillo ? 'bg-amber-400' : 'bg-slate-300'}`}
                              style={{ width: `${s.porcentaje}%` }}
                            />
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0091FB] transition-colors" />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* VISTA NORMAL PARA EL ASESOR */
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 rounded-2xl shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-300 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs">Progreso de Visitas Hoy</p>
                    <p className="text-xs text-blue-100">
                      <strong className="text-white">{visitasHoy} de {metaDiaria}</strong> visitas completadas
                    </p>
                  </div>
                </div>

                <span className="text-base font-extrabold text-amber-300 bg-white/10 px-3 py-1 rounded-xl">
                  {porcentajeMeta}%
                </span>
              </div>

              <div className="w-full bg-black/25 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeMeta}%` }}
                />
              </div>

              {visitasHoy >= metaDiaria ? (
                <p className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ¡Excelente trabajo! Cumpliste tu meta de hoy.
                </p>
              ) : (
                <p className="text-[11px] text-blue-200">
                  Faltan {metaDiaria - visitasHoy} visitas para completar tu jornada.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-blue-700 mb-1">
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Monto Total</span>
                </div>
                <p className="text-base font-extrabold text-slate-950 truncate">
                  {formatearMoneda(totalMonto)}
                </p>
                <p className="text-[10px] font-semibold text-slate-400">Presupuestos activos</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
                  <Briefcase className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Obras Activas</span>
                </div>
                <p className="text-base font-extrabold text-slate-950 truncate">{totalObras}</p>
                <p className="text-[10px] font-semibold text-slate-400">En catálogo</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Ventas Directas</span>
                </div>
                <p className="text-base font-extrabold text-emerald-700 truncate">{ventasCerradas}</p>
                <p className="text-[10px] font-semibold text-slate-400">Cierres exitosos</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-rose-700 mb-1">
                  <Snowflake className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Obras Frías</span>
                </div>
                <p className="text-base font-extrabold text-rose-700 truncate">{totalObrasFrias}</p>
                <p className="text-[10px] font-semibold text-slate-400">&gt;12 días sin visita</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-[#001757] hover:bg-[#00227a] text-white font-extrabold text-xs shadow-md active:scale-98 transition-all">
          Cerrar Panel
        </button>

      </div>
    </div>
  );
}