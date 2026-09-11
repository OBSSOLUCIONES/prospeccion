import React, { useState } from 'react';
import { X, Navigation, ExternalLink, Copy, Check, MapPin } from 'lucide-react';

export default function ModalNavegacion({ isOpen, onClose, destino }) {
  const [copiado, setCopiado] = useState(false);

  if (!isOpen || !destino) return null;

  const lat = destino.lat;
  const lng = destino.lng;
  const tieneCoords = Boolean(lat && lng);

  // URLs universales para iniciar navegación inmediata desde la posición actual
  const urlGoogleMaps = tieneCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino.direccion || destino.nombre)}`;

  const urlWaze = tieneCoords
    ? `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : `https://www.waze.com/ul?q=${encodeURIComponent(destino.direccion || destino.nombre)}&navigate=yes`;

  const copiarCoordenadas = () => {
    if (!tieneCoords) return;
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100">
        
        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Navigation className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">¿Cómo llegar?</h3>
              <p className="text-xs text-slate-500">Inicia tu ruta GPS en tiempo real</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta de Destino */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
          <p className="text-xs font-bold text-slate-900 truncate">
            {destino.nombre || destino.proyecto || 'Ubicación seleccionada'}
          </p>
          <p className="text-[11px] text-slate-600 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{destino.direccion || 'Ubicación por coordenadas GPS'}</span>
          </p>
          {tieneCoords && (
            <p className="text-[10px] font-mono text-slate-400 pl-4.5">
              GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* Botones de Navegación */}
        <div className="space-y-2 pt-1">
          {/* Opción 1: Google Maps */}
          <a
            href={urlGoogleMaps}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-blue-500/20 active:scale-98 transition-all">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 stroke-[2.5]" />
              <span>Iniciar Ruta con Google Maps</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {/* Opción 2: Waze */}
          <a
            href={urlWaze}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#33CCFF] hover:bg-[#2bb8e6] text-slate-950 font-bold text-xs flex items-center justify-between shadow-md shadow-cyan-500/20 active:scale-98 transition-all">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">W</span>
              <span>Iniciar Ruta con Waze (Tráfico en vivo)</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {/* Opción 3: Copiar coordenadas */}
          {tieneCoords && (
            <button
              type="button"
              onClick={copiarCoordenadas}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors">
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Coordenadas copiadas al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar coordenadas para WhatsApp</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}