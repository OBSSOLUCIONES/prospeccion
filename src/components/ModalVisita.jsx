import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Image as ImageIcon, Loader2, 
  Mic, MicOff, Check, WifiOff, Pencil
} from 'lucide-react';
import { FASES_OBRA, CAT_ACTIVIDAD_VISITA } from '../data/constants';
import { subirArchivoSupabase } from '../lib/supabase';
import { iniciarDictado } from '../lib/dictado';
import { useSwipeToClose } from '../hooks/useSwipeToClose';

function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const obtenerFechaHoraActual = () => {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  const h = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
};

export default function ModalVisita({ 
  isOpen, 
  onClose, 
  obra, 
  onSave, 
  tabletPos, 
  usuarioActivo,
  visitaAEditar = null
}) {
  const [fase, setFase] = useState('CIMENTACIÓN');
  const [actividad, setActividad] = useState('SUPERVISIÓN TÉCNICA');
  const [fecha, setFecha] = useState(obtenerFechaHoraActual());
  const [observaciones, setObservaciones] = useState('');
  const [fotos, setFotos] = useState([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [grabandoVoz, setGrabandoVoz] = useState(false);

  const dictadoRef = useRef(null);

  const { translateY, handlers: swipeHandlers } = useSwipeToClose(onClose, { threshold: 120 });

  useEffect(() => {
    if (!isOpen) return;

    if (visitaAEditar) {
      setFase(visitaAEditar.estatus || 'CIMENTACIÓN');
      setActividad(visitaAEditar.actividad || 'SUPERVISIÓN TÉCNICA');
      setFecha(visitaAEditar.fecha ? visitaAEditar.fecha.replace(' ', 'T') : obtenerFechaHoraActual());
      setObservaciones(visitaAEditar.observaciones || '');
      setFotos(visitaAEditar.fotos || []);
    } else if (obra) {
      setFase(obra.estatusFase || 'CIMENTACIÓN');
      setFecha(obtenerFechaHoraActual());
      setObservaciones('');
      setFotos([]);
    }

    return () => {
      if (dictadoRef.current) {
        try { dictadoRef.current.detener(); } catch (_) {}
        dictadoRef.current = null;
      }
    };
  }, [obra, isOpen, visitaAEditar]);

  if (!isOpen || (!obra && !visitaAEditar)) return null;

  const toggleDictadoVoz = async () => {
    if (grabandoVoz) {
      if (dictadoRef.current) {
        await dictadoRef.current.detener();
        dictadoRef.current = null;
      }
      setGrabandoVoz(false);
      return;
    }

    setGrabandoVoz(true);
    const instancia = await iniciarDictado({
      onTexto: (texto) => {
        setObservaciones(prev => prev ? `${prev.trim()} ${texto}` : texto);
      },
      onError: (err) => {
        console.warn('Error dictado:', err);
        if (err === 'sin_soporte') {
          alert('El dictado por voz no está disponible en este dispositivo');
        }
        setGrabandoVoz(false);
        dictadoRef.current = null;
      },
      onFin: () => {
        setGrabandoVoz(false);
        dictadoRef.current = null;
      }
    });

    if (!instancia) {
      setGrabandoVoz(false);
      return;
    }

    dictadoRef.current = instancia;
  };

  const handleFotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendoArchivo(true);
    try {
      const urls = await Promise.all(files.map(f => subirArchivoSupabase(f, 'fotos')));
      setFotos(prev => [...prev, ...urls]);
    } catch {
      alert('Error procesando fotografías');
    } finally {
      setSubiendoArchivo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (subiendoArchivo) return;

    if (dictadoRef.current) {
      try { dictadoRef.current.detener(); } catch (_) {}
      dictadoRef.current = null;
    }

    const obraRef = obra || { id: visitaAEditar?.obraId, sucursal: visitaAEditar?.sucursal, lat: visitaAEditar?.latGpsReal, lng: visitaAEditar?.lngGpsReal };
    const latGpsReal = tabletPos?.lat || obraRef.lat;
    const lngGpsReal = tabletPos?.lng || obraRef.lng;
    const distancia = calcularDistanciaMetros(obraRef.lat, obraRef.lng, latGpsReal, lngGpsReal);

    let auditoriaEstado = 'en_sitio';
    if (distancia > 1000) auditoriaEstado = 'remoto';
    else if (distancia > 250) auditoriaEstado = 'perimetro';

    onSave({
      id: visitaAEditar ? visitaAEditar.id : `VIS-${Date.now().toString().slice(-6)}`,
      obraId: obraRef.id,
      sucursal: obraRef.sucursal,
      fecha: fecha.replace('T', ' '),
      asesorNombre: visitaAEditar ? visitaAEditar.asesorNombre : (usuarioActivo?.nombre || 'Asesor'),
      estatus: fase,
      actividad,
      observaciones,
      fotos,
      latGpsReal: visitaAEditar?.latGpsReal || latGpsReal,
      lngGpsReal: visitaAEditar?.lngGpsReal || lngGpsReal,
      distanciaAuditoriaMetros: visitaAEditar?.distanciaAuditoriaMetros || distancia,
      auditoriaEstado: visitaAEditar?.auditoriaEstado || auditoriaEstado
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200"
        style={{ 
          transform: `translateY(${translateY}px)`,
          transition: translateY === 0 ? 'transform 0.25s ease-out' : 'none'
        }}
      >
        
        <div 
          {...swipeHandlers}
          className="pt-2 pb-1 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* Cabecera */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {visitaAEditar ? 'Editar Visita de Campo' : 'Check-in de Campo'}
              </h3>
              {!navigator.onLine && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md flex items-center gap-1 border border-amber-300">
                  <WifiOff className="w-3 h-3 text-amber-700" /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {visitaAEditar ? `Folio: ${visitaAEditar.id}` : `Obra: ${obra?.nombre}`}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0 active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-visita" onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-4 text-xs">
          
          <div>
            <label className="block font-black text-slate-800 text-xs mb-2">Fase Constructiva Actual *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FASES_OBRA.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFase(f)}
                  className={`min-h-[44px] px-2 rounded-xl text-xs font-black border transition-all truncate active:scale-95 ${
                    fase === f
                      ? 'bg-[#001757] text-white border-[#001757] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-black text-slate-800 text-xs mb-1.5">Tipo de Actividad en Sitio</label>
            <select
              value={actividad}
              onChange={(e) => setActividad(e.target.value)}
              className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-slate-900 text-xs sm:text-sm outline-none">
              {CAT_ACTIVIDAD_VISITA.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-black text-slate-800 text-xs mb-1.5">Fecha y Hora de la Visita</label>
            <input 
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-slate-900 text-xs sm:text-sm outline-none"
            />
          </div>

          {/* Fotos de Evidencia */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-black text-slate-900 text-xs sm:text-sm">Evidencia Fotográfica ({fotos.length})</label>
                <p className="text-[11px] text-slate-500">Fotografía del avance real</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="min-h-[44px] px-4 bg-[#0091FB] active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm">
                  <Camera className="w-5 h-5 stroke-[2.4]" />
                  <span>Cámara</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFotos} disabled={subiendoArchivo} className="hidden" />
                </label>

                <label className="min-h-[44px] px-3.5 bg-white border border-slate-300 active:scale-95 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                  <input type="file" accept="image/*" multiple onChange={handleFotos} disabled={subiendoArchivo} className="hidden" />
                </label>
              </div>
            </div>

            {subiendoArchivo && (
              <div className="flex items-center gap-2 text-xs text-[#0091FB] font-bold bg-blue-50 p-3 rounded-xl animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Optimizando imagen para campo...
              </div>
            )}

            {fotos.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1">
                {fotos.map((f, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={f} alt="preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1.5 shadow-md active:scale-90">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas con Dictado por Voz */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-black text-slate-800 text-xs">Notas de Supervisión</label>
              <button
                type="button"
                onClick={toggleDictadoVoz}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  grabandoVoz 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-[#001757] border border-blue-200'
                }`}>
                {grabandoVoz ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#0091FB]" />}
                <span>{grabandoVoz ? 'Detener' : '🎙 Dictar por voz'}</span>
              </button>
            </div>

            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalla acuerdos, materiales recibidos o incidencias..."
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#0091FB] leading-relaxed"
            />
          </div>

        </form>

        {/* Botón Guardar */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            type="submit"
            form="form-visita"
            disabled={subiendoArchivo}
            className="w-full min-h-[50px] rounded-2xl bg-[#001757] hover:bg-[#00227a] active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2">
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{visitaAEditar ? 'Guardar Cambios de la Visita' : 'Completar Visita en Sitio'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}