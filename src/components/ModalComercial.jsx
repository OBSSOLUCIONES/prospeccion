// src/components/ModalComercial.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, DollarSign, UploadCloud, Check, Loader2, Trash2, 
  Receipt, FileCheck, Mic, MicOff 
} from 'lucide-react';
import { CAT_FORMA_PAGO, CAT_TIPO_ENTREGA } from '../data/constants';
import { subirArchivoSupabase } from '../lib/supabase';

const obtenerFechaHoraActual = () => {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  const h = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
};

export default function ModalComercial({ isOpen, onClose, obra, tipoDefault = 'COTIZACION', onSave }) {
  const [tipo, setTipo] = useState(tipoDefault); // 'COTIZACION' | 'VENTA'
  const [comprobanteVenta, setComprobanteVenta] = useState('REMISIÓN'); // 'REMISIÓN' | 'FACTURA'
  const [folio, setFolio] = useState('');
  const [monto, setMonto] = useState('');
  const [formaPago, setFormaPago] = useState('EFECTIVO');
  const [tipoEntrega, setTipoEntrega] = useState('DOMICILIO');
  const [fecha, setFecha] = useState(obtenerFechaHoraActual());
  const [observaciones, setObservaciones] = useState('');
  const [documentoAdjunto, setDocumentoAdjunto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  // Estados y referencias para Dictado por Voz
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const recognitionRef = useRef(null);
  const debeSeguirGrabandoRef = useRef(false);

  useEffect(() => {
    return () => {
      debeSeguirGrabandoRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  if (!isOpen || !obra) return null;

  const esVenta = tipo === 'VENTA';

  // Lógica de Dictado por Voz
  const toggleDictadoVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador o dispositivo no soporta dictado por voz.');
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

  const handleDocumento = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirArchivoSupabase(file, 'documentos');
      setDocumentoAdjunto({
        nombre: file.name,
        tipo: file.type.includes('pdf') ? 'pdf' : 'imagen',
        url
      });
    } catch {
      alert('Error al subir documento');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Detener micrófono si estaba dictando
    debeSeguirGrabandoRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const montoLimpio = parseFloat(String(monto).replace(/[^0-9.]/g, '')) || 0;

    onSave({
      id: `MOV-${Date.now().toString().slice(-6)}`,
      obraId: obra.id,
      tipo,
      comprobante: esVenta ? comprobanteVenta : 'COTIZACIÓN',
      folio: folio.trim().toUpperCase(),
      monto: montoLimpio,
      estatus: esVenta ? 'ENTREGADO' : 'PENDIENTE',
      formaPago: esVenta ? formaPago : 'N/A',
      tipoEntrega,
      fecha: fecha.replace('T', ' '),
      documentoAdjunto,
      observaciones: observaciones.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {esVenta ? `Registrar Venta (${comprobanteVenta})` : 'Registrar Cotización'}
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">Obra: <strong>{obra.nombre}</strong></p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-comercial" onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* Selector Principal: Cotización vs Venta */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setTipo('COTIZACION')}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                !esVenta ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
              }`}>
              Cotización
            </button>
            <button
              type="button"
              onClick={() => setTipo('VENTA')}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                esVenta ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
              }`}>
              Venta Cerrada
            </button>
          </div>

          {/* Si es Venta, selector de Remisión vs Factura */}
          {esVenta && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
              <label className="block font-black text-emerald-950 text-[11px] uppercase tracking-wider">
                Tipo de Comprobante de Venta *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setComprobanteVenta('REMISIÓN')}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    comprobanteVenta === 'REMISIÓN'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100/50'
                  }`}>
                  <Receipt className="w-4 h-4" />
                  <span>Con Remisión</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComprobanteVenta('FACTURA')}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    comprobanteVenta === 'FACTURA'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-indigo-900 border-indigo-300 hover:bg-indigo-100/50'
                  }`}>
                  <FileCheck className="w-4 h-4" />
                  <span>Con Factura</span>
                </button>
              </div>
            </div>
          )}

          {/* Folio y Monto */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {esVenta ? `Folio de ${comprobanteVenta} *` : 'Folio Cotización *'}
              </label>
              <input
                type="text" required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder={esVenta ? (comprobanteVenta === 'REMISIÓN' ? 'REM-4920' : 'FAC-8812') : 'COT-1020'}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Monto Total ($ MXN) *</label>
              <input
                type="number" required min="0" step="any"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="450000"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Forma de Pago: Solo en Ventas */}
          {esVenta ? (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Forma de Pago *</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-800 outline-none">
                  {CAT_FORMA_PAGO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tipo de Entrega</label>
                <select
                  value={tipoEntrega}
                  onChange={(e) => setTipoEntrega(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none">
                  {CAT_TIPO_ENTREGA.map(te => <option key={te} value={te}>{te}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-800 mb-1">Tipo de Entrega Propuesta</label>
              <select
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none">
                {CAT_TIPO_ENTREGA.map(te => <option key={te} value={te}>{te}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">Fecha de Registro</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs outline-none font-semibold"
            />
          </div>

          {/* OBSERVACIONES CON BOTÓN DE DICTADO POR VOZ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">
                {esVenta ? 'Observaciones de la Entrega / Venta' : 'Observaciones de la Cotización'}
              </label>

              <button
                type="button"
                onClick={toggleDictadoVoz}
                className={`h-8 px-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                  grabandoVoz 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}>
                {grabandoVoz ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-blue-600" />}
                <span>{grabandoVoz ? 'Detener' : '🎙 Dictar por voz'}</span>
              </button>
            </div>

            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={
                esVenta 
                  ? 'Ej. Se entregó material completo con el residente Arq. Carlos, descarga sin incidencias...' 
                  : 'Ej. Precios vigentes por 15 días, incluye flete hasta pie de obra en camión de volteo...'
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Adjuntar Documento */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">Documento Adjunto (PDF o Foto)</label>
            {documentoAdjunto ? (
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-blue-200">
                <span className="font-semibold text-slate-800 truncate text-xs">{documentoAdjunto.nombre}</span>
                <button type="button" onClick={() => setDocumentoAdjunto(null)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-blue-600">
                  Subir archivo de {esVenta ? comprobanteVenta : 'Cotización'}
                </span>
                <input type="file" accept=".pdf,image/*" onChange={handleDocumento} disabled={subiendo} className="hidden" />
              </label>
            )}
          </div>

        </form>

        <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
          <button
            type="submit"
            form="form-comercial"
            disabled={subiendo}
            className={`w-full h-12 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 ${
              esVenta ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {subiendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[3]" />}
            <span>Guardar {esVenta ? `Venta con ${comprobanteVenta}` : 'Cotización'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}