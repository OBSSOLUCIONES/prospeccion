// src/components/ModalVisita.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Image as ImageIcon, Loader2, 
  Mic, MicOff, Check
} from 'lucide-react';
import { FASES_OBRA, CAT_ACTIVIDAD_VISITA } from '../data/constants';
import { subirArchivoSupabase } from '../lib/supabase';

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
  usuarioActivo 
}) {
  const [fase, setFase] = useState('CIMENTACIÓN');
  const [actividad, setActividad] = useState('SUPERVISIÓN TÉCNICA');
  const [fecha, setFecha] = useState(obtenerFechaHoraActual());
  const [observaciones, setObservaciones] = useState('');
  const [fotos, setFotos] = useState([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [grabandoVoz, setGrabandoVoz] = useState(false);

  const recognitionRef = useRef(null);
  const debeSeguirGrabandoRef = useRef(false);

  useEffect(() => {
    if (obra) {
      setFase(obra.estatusFase || 'CIMENTACIÓN');
    }
    setFecha(obtenerFechaHoraActual());
    setObservaciones('');
    setFotos([]);
    return () => {
      debeSeguirGrabandoRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, [obra, isOpen]);

  if (!isOpen || !obra) return null;

  const toggleDictadoVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz.');
      return;
    }

    if (grabandoVoz) {
      debeSeguirGrabandoRef.current = false;
      setGrabandoVoz(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.continuous = true;
      recognition.interimResults = false;

      debeSeguirGrabandoRef.current = true;
      setGrabandoVoz(true);

      recognition.onresult = (event) => {
        let textoNuevo = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            textoNuevo += ' ' + event.results[i][0].transcript;
          }
        }
        if (textoNuevo.trim()) {
          setObservaciones(prev => prev ? `${prev.trim()} ${textoNuevo.trim()}` : textoNuevo.trim());
        }
      };

      recognition.onend = () => {
        if (debeSeguirGrabandoRef.current) {
          try { recognition.start(); } catch (_) {}
        } else {
          setGrabandoVoz(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setGrabandoVoz(false);
    }
  };

  const handleFotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendoArchivo(true);
    try {
      const urls = await Promise.all(files.map(f => subirArchivoSupabase(f, 'fotos')));
      setFotos(prev => [...prev, ...urls]);
    } catch {
      alert('Error subiendo fotos');
    } finally {
      setSubiendoArchivo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (subiendoArchivo) return;

    debeSeguirGrabandoRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const latGpsReal = tabletPos?.lat || obra.lat;
    const lngGpsReal = tabletPos?.lng || obra.lng;
    const distancia = calcularDistanciaMetros(obra.lat, obra.lng, latGpsReal, lngGpsReal);

    let auditoriaEstado = 'en_sitio';
    if (distancia > 1000) auditoriaEstado = 'remoto';
    else if (distancia > 250) auditoriaEstado = 'perimetro';

    onSave({
      id: `VIS-${Date.now().toString().slice(-6)}`,
      obraId: obra.id,
      sucursal: obra.sucursal,
      fecha: fecha.replace('T', ' '),
      asesorNombre: usuarioActivo?.nombre || 'Asesor',
      estatus: fase,
      actividad,
      observaciones,
      fotos,
      latGpsReal,
      lngGpsReal,
      distanciaAuditoriaMetros: distancia,
      auditoriaEstado
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Cabecera Fija */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">Check-in / Visita de Campo</h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">Obra: <strong className="text-slate-800">{obra.nombre}</strong></p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <form id="form-visita" onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-4 text-xs">
          
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Fase Constructiva Actual *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FASES_OBRA.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFase(f)}
                  className={`h-10 px-2 rounded-xl text-xs font-bold border transition-all truncate ${
                    fase === f
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Tipo de Actividad</label>
            <select
              value={actividad}
              onChange={(e) => setActividad(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-blue-900 text-xs outline-none">
              {CAT_ACTIVIDAD_VISITA.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Fotos */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-extrabold text-slate-900 text-xs">Evidencia Fotográfica ({fotos.length})</label>
                <p className="text-[10px] text-slate-500">Foto del avance de hoy</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="h-10 px-3.5 bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Camera className="w-4 h-4" />
                  <span>Cámara</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFotos} disabled={subiendoArchivo} className="hidden" />
                </label>

                <label className="h-10 px-3 bg-white border border-slate-300 active:scale-95 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <input type="file" accept="image/*" multiple onChange={handleFotos} disabled={subiendoArchivo} className="hidden" />
                </label>
              </div>
            </div>

            {subiendoArchivo && (
              <div className="flex items-center gap-2 text-xs text-blue-700 font-bold bg-blue-50 p-2.5 rounded-xl animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Optimizando y subiendo foto...
              </div>
            )}

            {fotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-1 pb-1">
                {fotos.map((f, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={f} alt="preview" className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-md">
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">Notas de Supervisión</label>
              <button
                type="button"
                onClick={toggleDictadoVoz}
                className={`h-9 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                  grabandoVoz 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                {grabandoVoz ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{grabandoVoz ? 'Detener' : 'Dictar por voz'}</span>
              </button>
            </div>

            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escribe o dicta los detalles del avance en obra..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </form>

        {/* Botón Fijo Inferior - Siempre visible */}
        <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
          <button
            type="submit"
            form="form-visita"
            disabled={subiendoArchivo}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2">
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Completar Visita en Sitio</span>
          </button>
        </div>

      </div>
    </div>
  );
}