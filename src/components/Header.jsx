// src/components/Header.jsx
import React from 'react';
import { Compass, FileSpreadsheet, Lock, RefreshCw, Target } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-30 h-[58px] sm:h-[64px] bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between gap-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
      
      {/* Logotipo e Identidad PROSPECCIÓN OBS */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#001757] via-[#00227a] to-[#0091FB] flex items-center justify-center text-white shadow-md shadow-[#001757]/20 border border-white/20">
          <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] text-[#0091FB]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-black text-[#001757] tracking-tight whitespace-nowrap">
              PROSPECCIÓN OBS
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
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                  : gpsEstado === 'bloqueado'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  : 'bg-slate-300'
              }`}
            />

            {sincronizando && (
              <RefreshCw className="w-3 h-3 text-[#0091FB] animate-spin shrink-0" title="Sincronizando..." />
            )}
          </div>

          <p className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 tracking-wider uppercase whitespace-nowrap">
            {esDirector ? 'Dirección General' : usuarioActivo?.sucursal || 'PROSPECCIÓN OBS'}
          </p>
        </div>
      </div>

      {/* Controles del Header Optimizados para Celular y Tablet */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        
        {/* Selector de Sucursales para el Director */}
        {esDirector && (
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="h-8 px-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 text-[#001757] font-black text-[10px] sm:text-xs rounded-xl outline-none shadow-2xs max-w-[105px] sm:max-w-[145px] truncate cursor-pointer transition-all">
            <option value="TODAS">TODAS</option>
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
          className="h-8 px-2 sm:px-2.5 bg-gradient-to-b from-amber-50 to-amber-100/60 hover:from-amber-100 active:scale-95 text-amber-950 border border-amber-200/90 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all shadow-2xs"
          title="Ver Metas Diarias">
          <Target className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
          <span className="hidden md:inline">Metas</span>
        </button>

        {/* Exportar a Excel Power BI */}
        {esDirector && (
          <button
            type="button"
            onClick={onExportarExcel}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-105 active:scale-95 text-white h-8 px-2.5 sm:px-3 rounded-xl text-xs font-black shadow-xs shadow-emerald-700/20 transition-all"
            title={`Exportar datos de ${filtroSucursal} para Power BI`}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Excel</span>
          </button>
        )}

        {/* Perfil del Usuario */}
        {usuarioActivo && (
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 border border-slate-200/80 pl-1 pr-1 sm:pr-1.5 py-0.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-[#001757] text-[#0091FB] font-black text-[10px] flex items-center justify-center uppercase shadow-2xs">
              {usuarioActivo.nombre.substring(0, 2)}
            </div>
            <button 
              type="button"
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar Turno">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

    </header>
  );
}