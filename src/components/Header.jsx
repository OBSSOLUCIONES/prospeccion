// src/components/Header.jsx
import React from 'react';
import { Building2, FileSpreadsheet, Lock, RefreshCw, Target } from 'lucide-react';
import { SUCURSALES } from '../data/constants';

export default function Header({ 
  gpsEstado, 
  onExportarExcel, 
  sincronizando, 
  usuarioActivo, 
  onLogout,
  onAbrirKpis,
  filtroSucursal,
  setFiltroSucursal
}) {
  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
      
      {/* Logotipo e Identidad */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#001757] flex items-center justify-center text-[#0091FB] shadow-sm shadow-navy/20">
          <Building2 className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-black text-[#001757] tracking-tight truncate">
              Control de Obras
            </h1>

            {/* Micro-punto GPS */}
            <span
              title={
                gpsEstado === 'activo'
                  ? 'GPS Satelital Activo'
                  : gpsEstado === 'bloqueado'
                  ? 'Permiso de GPS bloqueado'
                  : 'Sincronizando ubicación'
              }
              className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                gpsEstado === 'activo'
                  ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse'
                  : gpsEstado === 'bloqueado'
                  ? 'bg-rose-500'
                  : 'bg-slate-300'
              }`}
            />

            {sincronizando && (
              <RefreshCw className="w-3 h-3 text-[#0091FB] animate-spin shrink-0" title="Sincronizando con la nube..." />
            )}
          </div>

          <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 tracking-wider uppercase truncate">
            {esDirector ? 'Panel de Dirección • Auditoría' : `${usuarioActivo?.sucursal || 'Red Azul'} • En Campo`}
          </p>
        </div>
      </div>

      {/* Controles: Filtro de Sucursal (Director) + Metas + Excel + Perfil */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* SELECTOR MAESTRO DE SUCURSAL PARA EL DIRECTOR */}
        {esDirector && (
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="h-8 sm:h-9 px-2 sm:px-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#001757] font-black text-[11px] sm:text-xs rounded-xl sm:rounded-2xl outline-none shadow-2xs max-w-[125px] sm:max-w-[160px] truncate cursor-pointer transition-all">
            <option value="TODAS">TODAS (Consolidado)</option>
            {SUCURSALES.map(s => (
              <option key={s.codigo} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}

        {/* Botón de Metas */}
        <button
          type="button"
          onClick={onAbrirKpis}
          className="h-8 sm:h-9 px-2.5 sm:px-3 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-200/90 rounded-xl sm:rounded-2xl text-[11px] font-black flex items-center gap-1 sm:gap-1.5 transition-all shadow-2xs"
          title="Ver Metas Diarias y Rendimiento">
          <Target className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
          <span className="hidden sm:inline">Metas</span>
        </button>

        {/* Exportar a Excel Power BI (Director) */}
        {esDirector && (
          <button
            type="button"
            onClick={onExportarExcel}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl text-xs font-black shadow-sm transition-all"
            title={`Exportar reporte de ${filtroSucursal} para Power BI`}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BI Excel</span>
          </button>
        )}

        {/* Perfil / Cerrar Turno */}
        {usuarioActivo && (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 pl-1.5 pr-1.5 sm:pr-2 py-1 rounded-xl sm:rounded-2xl">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-[#001757] text-[#0091FB] font-black text-[10px] sm:text-[11px] flex items-center justify-center uppercase">
              {usuarioActivo.nombre.substring(0, 2)}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[90px]">{usuarioActivo.nombre}</p>
              <span className="text-[9px] font-extrabold text-[#0091FB] uppercase tracking-wider">
                {usuarioActivo.sucursal}
              </span>
            </div>
            <button 
              type="button"
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar Turno / Cambiar Asesor">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

    </header>
  );
}