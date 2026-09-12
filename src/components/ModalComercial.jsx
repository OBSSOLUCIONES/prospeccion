// src/components/ModalComercial.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, DollarSign, UploadCloud, Check, Loader2, Trash2, 
  Receipt, FileCheck, Mic, MicOff, Link2
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

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ModalComercial({ 
  isOpen, 
  onClose, 
  obra, 
  tipoDefault = 'COTIZACION', 
  movimientos = [], 
  onSave 
}) {
  const [tipo, setTipo] = useState(tipoDefault); // 'COTIZACION' | 'VENTA'
  const [comprobanteVenta, setComprobanteVenta] = useState('REMISIÓN'); // 'REMISIÓN' | 'FACTURA'
  const [cotizacionSeleccionadaId, setCotizacionSeleccionadaId] = useState('');
  const [folio, setFolio] = useState('');
  const [monto, setMonto] = useState('');
  const [formaPago, setFormaPago] = useState('EFECTIVO');
  const [tipoEntrega, setTipoEntrega] = useState('DOMICILIO');
  const [fecha, setFecha] = useState(obtenerFechaHoraActual());
  const [observaciones, setObservaciones] = useState(''); // SIEMPRE LIMPIO
  const [documentoAdjunto, setDocumentoAdjunto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  // Dictado por voz
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const recognitionRef = useRef(null);
  const debeSeguirGrabandoRef = useRef(false);

  // REINICIO TOTAL CADA VEZ QUE SE ABRE (NUNCA GUARDA BASURA ANTERIOR)
  useEffect(() => {
    if (isOpen) {
      setTipo(tipoDefault);
      setComprobanteVenta('REMISIÓN');
      setCotizacionSeleccionadaId('');
      setFolio('');
      setMonto('');
      setFormaPago('EFECTIVO');
      setTipoEntrega('DOMICILIO');
      setFecha(obtenerFechaHoraActual());
      setObservaciones(''); // Observaciones 100% vacías por defecto
      setDocumentoAdjunto(null);
      setSubiendo(false);
      setGrabandoVoz(false);
    }

    return () => {
      debeSeguirGrabandoRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, [isOpen, tipoDefault]);

  if (!isOpen || !obra) return null;

  const esVenta = tipo === 'VENTA';

  // Obtener cotizaciones de esta obra para poder enlazarlas
  const cotizacionesObra = movimientos.filter(m => 
    m.obraId === obra.id && 
    m.tipo === 'COTIZACION'
  );

  // Al elegir una cotización en el desplegable
  const handleCambiarCotizacionEnlace = (cotId) => {
    setCotizacionSeleccionadaId(cotId);
    if (!cotId) return;

    const cotEncontrada = cotizacionesObra.find(c => c.id === cotId);
    if (cotEncontrada) {
      // Autocompleta el monto para ahorrar tiempo, pero deja observaciones limpias
      setMonto(cotEncontrada.monto || '');
      if (cotEncontrada.tipoEntrega) {
        setTipoEntrega(cotEncontrada.tipoEntrega);
      }
    }
  };

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
          setObservaciones(prev => prev ? `${prev.trim()} ${textoNuevo.trim().toUpperCase()}` : textoNuevo.trim().toUpperCase());
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
      observaciones: observaciones.trim().toUpperCase(),
      cotizacionOrigenId: esVenta && cotizacionSeleccionadaId ? cotizacionSeleccionadaId : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Barra de arrastre táctil */}
        <div className="pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* Cabecera */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {esVenta ? `Registrar Venta (${comprobanteVenta})` : 'Registrar Cotización'}
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">Obra: <strong className="text-slate-800">{obra.nombre}</strong></p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0 active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-comercial" onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Selector Principal: Cotización vs Venta Cerrada */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTipo('COTIZACION');
                setCotizacionSeleccionadaId('');
              }}
              className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 ${
                !esVenta ? 'bg-[#001757] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}>
              Cotización
            </button>
            <button
              type="button"
              onClick={() => setTipo('VENTA')}
              className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 ${
                esVenta ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}>
              Venta Cerrada
            </button>
          </div>

          {/* SI ES VENTA: SELECTOR DE COMPROBANTE Y ENLACE DE COTIZACIÓN */}
          {esVenta && (
            <div className="space-y-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-in fade-in duration-150">
              
              {/* Tipo de comprobante */}
              <div>
                <label className="block font-black text-emerald-950 text-[11px] uppercase tracking-wider mb-1.5">
                  Tipo de Comprobante de Venta *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setComprobanteVenta('REMISIÓN')}
                    className={`min-h-[42px] px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                      comprobanteVenta === 'REMISIÓN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100/50'
                    }`}>
                    <Receipt className="w-4 h-4" />
                    <span>Con Remisión</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setComprobanteVenta('FACTURA')}
                    className={`min-h-[42px] px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                      comprobanteVenta === 'FACTURA'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-indigo-900 border-indigo-300 hover:bg-indigo-100/50'
                    }`}>
                    <FileCheck className="w-4 h-4" />
                    <span>Con Factura</span>
                  </button>
                </div>
              </div>

              {/* Selector para enlazar cotización previa de esta obra */}
              <div className="pt-2 border-t border-emerald-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-emerald-950 text-xs flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Enlazar a Cotización Previa</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">(Opcional)</span>
                </div>

                {cotizacionesObra.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic bg-white/80 p-2 rounded-xl border border-emerald-200">
                    Esta obra no tiene cotizaciones previas (se registrará como venta directa).
                  </p>
                ) : (
                  <select
                    value={cotizacionSeleccionadaId}
                    onChange={(e) => handleCambiarCotizacionEnlace(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-emerald-300 bg-white font-black text-xs text-emerald-950 outline-none">
                    <option value="">-- Venta Directa (Sin cotización previa) --</option>
                    {cotizacionesObra.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.folio} — {formatearMoneda(c.monto)} ({c.estatus === 'GANADA' ? 'Cerrada' : 'Pendiente'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

            </div>
          )}

          {/* Folio y Monto */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-black text-slate-800 mb-1 text-xs">
                {esVenta ? `Folio de ${comprobanteVenta} *` : 'Folio Cotización *'}
              </label>
              <input
                type="text" required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder={esVenta ? (comprobanteVenta === 'REMISIÓN' ? 'REM-4920' : 'FAC-8812') : 'COT-1020'}
                className="w-full h-12 px-3.5 rounded-2xl border border-slate-300 font-black text-slate-900 outline-none focus:border-[#0091FB] text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-black text-slate-800 mb-1 text-xs">Monto Total ($ MXN) *</label>
              <input
                type="number" required min="0" step="any"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="450000"
                className="w-full h-12 px-3.5 rounded-2xl border border-slate-300 font-black text-slate-900 outline-none focus:border-[#0091FB] text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Forma de Pago y Entrega */}
          {esVenta ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-black text-slate-800 mb-1 text-xs">Forma de Pago *</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-slate-800 outline-none text-xs sm:text-sm">
                  {CAT_FORMA_PAGO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1 text-xs">Tipo de Entrega</label>
                <select
                  value={tipoEntrega}
                  onChange={(e) => setTipoEntrega(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-slate-800 outline-none text-xs sm:text-sm">
                  {CAT_TIPO_ENTREGA.map(te => <option key={te} value={te}>{te}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-black text-slate-800 mb-1 text-xs">Tipo de Entrega Propuesta</label>
              <select
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
                className="w-full h-12 px-3 rounded-2xl border border-slate-300 bg-white font-bold text-slate-800 outline-none text-xs sm:text-sm">
                {CAT_TIPO_ENTREGA.map(te => <option key={te} value={te}>{te}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block font-black text-slate-800 mb-1 text-xs">Fecha y Hora de Registro</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-12 px-3.5 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm outline-none font-bold text-slate-900"
            />
          </div>

          {/* OBSERVACIONES LIMPIAS (SIN TEXTO BASURA) + BOTÓN DE VOZ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-black text-slate-800 text-xs">
                {esVenta ? 'Observaciones de la Venta / Entrega' : 'Observaciones de la Cotización'}
              </label>

              <button
                type="button"
                onClick={toggleDictadoVoz}
                className={`min-h-[38px] px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  grabandoVoz 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-[#001757] border border-blue-200 hover:bg-blue-100'
                }`}>
                {grabandoVoz ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#0091FB]" />}
                <span>{grabandoVoz ? 'Detener' : '🎙 Dictar por voz'}</span>
              </button>
            </div>

            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escribe o dicta notas comerciales aquí..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#0091FB] leading-relaxed"
            />
          </div>

          {/* Adjuntar Documento */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-black text-slate-800 text-xs">Documento Adjunto (PDF o Foto)</label>
            {documentoAdjunto ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200">
                <span className="font-bold text-slate-800 truncate text-xs">{documentoAdjunto.nombre}</span>
                <button type="button" onClick={() => setDocumentoAdjunto(null)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg active:scale-90">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center p-3.5 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#0091FB] transition-colors">
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-black text-[#0091FB]">
                  Subir archivo de {esVenta ? comprobanteVenta : 'Cotización'}
                </span>
                <input type="file" accept=".pdf,image/*" onChange={handleDocumento} disabled={subiendo} className="hidden" />
              </label>
            )}
          </div>

        </form>

        {/* Botón Guardar */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            type="submit"
            form="form-comercial"
            disabled={subiendo}
            className={`w-full min-h-[50px] rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 ${
              esVenta ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#001757] hover:bg-[#00227a]'
            }`}>
            {subiendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[3]" />}
            <span>Guardar {esVenta ? `Venta con ${comprobanteVenta}` : 'Cotización'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}