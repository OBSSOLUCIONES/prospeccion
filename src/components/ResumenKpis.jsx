// src/components/ResumenKpis.jsx
import React from 'react';
import { 
  X, Target, DollarSign, Briefcase, TrendingUp, 
  Snowflake, Clock, CheckCircle2, Award
} from 'lucide-react';

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val);
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
  totalObrasFrias 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        
        {/* Cabecera del Panel */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">Rendimiento y Metas</h3>
              <span className="bg-blue-100 text-blue-900 font-bold text-xs px-2.5 py-0.5 rounded-lg">
                {sucursal}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Resumen comercial y operativo</p>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 flex items-center justify-center text-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Meta Diaria de Visitas */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 rounded-3xl shadow-sm space-y-2.5">
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

          {/* Barra de Progreso */}
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
              Faltan {metaDiaria - visitasHoy} visitas para completar tu jornada recomendada.
            </p>
          )}
        </div>

        {/* 2. Tarjetas de KPIs Comerciales */}
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* Monto Presupuestado */}
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

          {/* Obras en Radar */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
              <Briefcase className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Obras Activas</span>
            </div>
            <p className="text-base font-extrabold text-slate-950 truncate">
              {totalObras}
            </p>
            <p className="text-[10px] font-semibold text-slate-400">En catálogo</p>
          </div>

          {/* Ventas Cerradas */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Ventas Directas</span>
            </div>
            <p className="text-base font-extrabold text-emerald-700 truncate">
              {ventasCerradas}
            </p>
            <p className="text-[10px] font-semibold text-slate-400">Cierres exitosos</p>
          </div>

          {/* Obras Frías / En Riesgo */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-rose-700 mb-1">
              <Snowflake className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Obras Frías</span>
            </div>
            <p className="text-base font-extrabold text-rose-700 truncate">
              {totalObrasFrias}
            </p>
            <p className="text-[10px] font-semibold text-slate-400">&gt;12 días sin visita</p>
          </div>

        </div>

        {/* Botón de cierre ergonómico */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all">
          Cerrar Resumen
        </button>

      </div>
    </div>
  );
}