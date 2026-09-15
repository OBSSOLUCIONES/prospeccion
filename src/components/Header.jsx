// src/components/Header.jsx
import React from 'react';
import { FileSpreadsheet, Lock, Target, Wifi, WifiOff, CloudUpload, Search, Route, MessageCircle } from 'lucide-react';
import { SUCURSALES } from '../data/constants';

export default function Header({ 
  gpsEstado, 
  onExportarExcel, 
  sincronizando, 
  usuarioActivo, 
  onLogout,
  onAbrirKpis,
  onAbrirBusqueda,
  onAbrirRutaDia,
  onAbrirChat,
  mensajesSinLeer = 0,
  filtroSucursal,
  setFiltroSucursal,
  estaOnline = true,
  pendientesOffline = 0,
  onForzarSincronizacion
}) {
  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-[56px] sm:h-[64px] bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-3 shadow-sm safe-top">
      
      {/* Logotipo e Identidad PROSPECCIÓN OBS */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
        <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-br from-[#001757] via-[#00227a] to-[#0091FB] p-0.5 shadow-sm border border-white/20 flex items-center justify-center">
          <div className="w-full h-full rounded-[14px] bg-[#000f38] flex items-center justify-center p-1">
            <img 
              src="./logo.png" 
              alt="OBS" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-black text-[#001757] tracking-tight truncate">
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
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                gpsEstado === 'activo'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse'
                  : gpsEstado === 'bloqueado'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                  : 'bg-slate-300'
              }`}
            />
          </div>

          <p className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 tracking-wider uppercase truncate">
            {esDirector ? 'Dirección General' : usuarioActivo?.sucursal || 'PROSPECCIÓN OBS'}
          </p>
        </div>
      </div>

      {/* Controles Elásticos */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        
        {/* Búsqueda global */}
        <button
          type="button"
          onClick={onAbrirBusqueda}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#001757] shadow-2xs active:scale-90 transition-all"
          title="Búsqueda universal (obras, clientes, folios)">
          <Search className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Chat interno */}
        <button
          type="button"
          onClick={onAbrirChat}
          className="relative w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#001757] shadow-2xs active:scale-90 transition-all"
          title="Chat interno">
          <MessageCircle className="w-4 h-4 stroke-[2.5]" />
          {mensajesSinLeer > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm">
              {mensajesSinLeer > 9 ? '9+' : mensajesSinLeer}
            </span>
          )}
        </button>
        {/* Ruta del día (no para director) */}
        {!esDirector && (
          <button
            type="button"
            onClick={onAbrirRutaDia}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#001757] to-[#00227a] hover:brightness-110 flex items-center justify-center text-white shadow-sm active:scale-90 transition-all"
            title="Ruta del Día">
            <Route className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Telemetría Offline / Online */}
        {pendientesOffline > 0 ? (
          <button
            type="button"
            onClick={onForzarSincronizacion}
            disabled={sincronizando || !estaOnline}
            className="h-8 px-2 sm:px-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-2xs active:scale-95 transition-all animate-pulse"
            title="Toca para subir registros pendientes">
            <CloudUpload className={`w-3.5 h-3.5 text-amber-700 ${sincronizando ? 'animate-bounce' : ''}`} />
            <span>{sincronizando ? '...' : `${pendientesOffline} pend.`}</span>
          </button>
        ) : !estaOnline ? (
          <span 
            className="h-8 px-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-2xs"
            title="Modo Campo: Guardando en tablet">
            <WifiOff className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline">Sin Señal</span>
          </span>
        ) : (
          <span 
            className="h-8 px-2 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-black hidden lg:flex items-center gap-1 shadow-2xs"
            title="Nube sincronizada">
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span>En Línea</span>
          </span>
        )}

        {/* Filtro Sucursal (Director) */}
        {esDirector && (
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="h-8 px-1.5 sm:px-2 bg-slate-100 border border-slate-200 text-[#001757] font-black text-[10px] sm:text-xs rounded-xl outline-none shadow-2xs max-w-[80px] sm:max-w-[140px] truncate cursor-pointer transition-all">
            <option value="TODAS">TODAS</option>
            {SUCURSALES.map(s => (
              <option key={s.codigo} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}

        {/* Botón Metas */}
        <button
          type="button"
          onClick={onAbrirKpis}
          className="h-8 px-2 sm:px-2.5 bg-gradient-to-b from-amber-50 to-amber-100/70 hover:from-amber-100 active:scale-95 text-amber-950 border border-amber-200/90 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 transition-all shadow-2xs"
          title="Ver Metas Diarias">
          <Target className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
          <span className="hidden sm:inline">Metas</span>
        </button>

        {/* Botón Excel (Director) */}
        {esDirector && (
          <button
            type="button"
            onClick={onExportarExcel}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-105 active:scale-95 text-white h-8 px-2 sm:px-2.5 rounded-xl text-xs font-black shadow-xs transition-all"
            title="Exportar a Excel para Power BI">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        )}

        {/* Perfil del Usuario */}
        {usuarioActivo && (
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 border border-slate-200 pl-1 pr-1 sm:pr-1.5 py-0.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-[#001757] text-[#0091FB] font-black text-[10px] flex items-center justify-center uppercase shadow-2xs">
              {usuarioActivo.nombre.substring(0, 2)}
            </div>
            <button 
              type="button"
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-90"
              title="Cerrar Turno">
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

    </header>
  );
}