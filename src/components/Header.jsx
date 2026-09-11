// src/components/Header.jsx
import React from 'react';
import { Building2, FileSpreadsheet, Lock, RefreshCw } from 'lucide-react';

export default function Header({ gpsEstado, onExportarExcel, sincronizando, usuarioActivo, onLogout }) {
  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
      
      {/* Logotipo e Identidad Minimalista */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#001757] flex items-center justify-center text-[#0091FB] shadow-sm shadow-navy/20">
          <Building2 className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-black text-[#001757] tracking-tight truncate">
              Control de Obras
            </h1>

            {/* MICRO-PUNTO GPS MINIMALISTA (SIN TEXTO) */}
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
              <RefreshCw className="w-3 h-3 text-[#0091FB] animate-spin shrink-0" title="Sincronizando..." />
            )}
          </div>

          <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            Red Azul • En Campo
          </p>
        </div>
      </div>

      {/* Perfil del Asesor y Exportar Excel */}
      <div className="flex items-center gap-2 shrink-0">
        {usuarioActivo && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 pl-1.5 pr-2 py-1 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-[#001757] text-[#0091FB] font-black text-[11px] flex items-center justify-center uppercase">
              {usuarioActivo.nombre.substring(0, 2)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{usuarioActivo.nombre}</p>
              <span className="text-[9px] font-extrabold text-[#0091FB] uppercase tracking-wider">
                {usuarioActivo.sucursal}
              </span>
            </div>
            <button 
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
              title="Cambiar Asesor">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {esDirector && (
          <button
            type="button"
            onClick={onExportarExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-2xl text-xs font-black shadow-sm transition-all"
            title="Exportar reporte a Excel">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        )}
      </div>

    </header>
  );
}