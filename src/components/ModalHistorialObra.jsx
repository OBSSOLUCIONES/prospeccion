// src/components/ModalHistorialObra.jsx
import React from 'react';
import { X, Calendar, Camera, ShieldCheck, Tag, FileText, Eye, Clock, Building2 } from 'lucide-react';
import { FASE_COLORS } from '../data/constants';

export default function ModalHistorialObra({ isOpen, onClose, obra, onVerVisor }) {
  if (!isOpen || !obra) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-900 font-bold text-xs px-2.5 py-0.5 rounded-lg">
                {obra.sucursal}
              </span>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {obra.totalVisitas} visita(s) en bitácora
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">{obra.proyecto}</h3>
            <p className="text-xs text-slate-500 font-medium">{obra.direccionObra || 'Ubicación georreferenciada'}</p>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 flex items-center justify-center text-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Línea de Tiempo de Visitas */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1">
          {obra.visitas.map((v, index) => (
            <div key={v.id} className="relative pl-6 border-l-2 border-blue-200 space-y-2">
              {/* Punto indicador en la línea */}
              <div className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full absolute -left-[8px] top-1 shadow-xs" />

              {/* Tarjeta del Registro Histórico */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {v.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {v.fecha}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${FASE_COLORS[v.estatus]}`}>
                    {v.estatus}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                    Actividad: {v.actividad}
                  </span>
                  {v.monto && (
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Monto: {v.monto}
                    </span>
                  )}
                </div>

                {v.observaciones && (
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 font-medium">
                    "{v.observaciones}"
                  </p>
                )}

                {/* Evidencias de esta visita */}
                {v.fotos && v.fotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-1 pb-1">
                    {v.fotos.map((foto, idx) => (
                      <img
                        key={idx}
                        src={foto}
                        alt="evidencia"
                        onClick={() => onVerVisor({ 
                          tipo: 'foto', 
                          fotos: v.fotos, 
                          index: idx, 
                          titulo: `${obra.proyecto} - ${v.fecha}` 
                        })}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-300 cursor-pointer shrink-0 hover:opacity-90 active:scale-95 transition-all"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botón de Cierre */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all shrink-0 mt-2">
          Cerrar Bitácora
        </button>

      </div>
    </div>
  );
}