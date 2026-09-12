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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] transition-all">
      
      {/* Logotipo e Identidad de Marca Silicon Valley */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-br from-[#001757] via-[#00227a] to-[#0091FB] flex items-center justify-center text-white shadow-md shadow-[#001757]/20 border border-white/20">
          <Building2 className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-black text-[#001757] tracking-tight truncate">
              Control de Obras
            </h1>

            {/* Micro-punto GPS con pulso de precisión */}
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

          <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 tracking-wider uppercase truncate">
            {esDirector ? 'Dirección General • Red Azul' : `${usuarioActivo?.sucursal || 'Red Azul'} • En Campo`}
          </p>
        </div>
      </div>

      {/* Controles de Alta Gama */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* Selector de Sucursal del Director */}
        {esDirector && (
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="h-8 sm:h-9 px-2 sm:px-3 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-[#001757] font-extrabold text-[11px] sm:text-xs rounded-xl sm:rounded-2xl outline-none shadow-2xs max-w-[125px] sm:max-w-[160px] truncate cursor-pointer transition-all">
            <option value="TODAS">TODAS (Consolidado)</option>
            {SUCURSALES.map(s => (
              <option key={s.codigo} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}

        {/* Botón de Metas Estilo Jewel */}
        <button
          type="button"
          onClick={onAbrirKpis}
          className="h-8 sm:h-9 px-2.5 sm:px-3 bg-gradient-to-b from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-200/60 active:scale-95 text-amber-950 border border-amber-200/90 rounded-xl sm:rounded-2xl text-[11px] font-black flex items-center gap-1 sm:gap-1.5 transition-all shadow-2xs">
          <Target className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
          <span className="hidden sm:inline">Metas</span>
        </button>

        {/* Exportar a Excel Power BI */}
        {esDirector && (
          <button
            type="button"
            onClick={onExportarExcel}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl text-xs font-black shadow-sm shadow-emerald-700/20 transition-all"
            title={`Exportar datos de ${filtroSucursal} para Power BI`}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BI Excel</span>
          </button>
        )}

        {/* Perfil del Usuario */}
        {usuarioActivo && (
          <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-200/80 pl-1.5 pr-1 sm:pr-2 py-1 rounded-xl sm:rounded-2xl">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-[#001757] text-[#0091FB] font-black text-[10px] sm:text-[11px] flex items-center justify-center uppercase shadow-2xs">
              {usuarioActivo.nombre.substring(0, 2)}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[90px]">{usuarioActivo.nombre}</p>
              <span className="text-[9px] font-extrabold text-[#0091FB] uppercase tracking-wider">
                {usuarioActivo.sucursal}
              </span>
            </div>
            <button 
              type="button"
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
              title="Cerrar Turno">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

    </header>
  );
}