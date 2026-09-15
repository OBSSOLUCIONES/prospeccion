// src/components/ModalBusquedaGlobal.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Search, Mic, MicOff, Building2, User, 
  FileText, MapPin, ChevronRight, Sparkles
} from 'lucide-react';
import { iniciarDictado } from '../lib/dictado';

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ModalBusquedaGlobal({
  isOpen,
  onClose,
  obras = [],
  clientes = [],
  movimientos = [],
  onSeleccionarObra,
  onSeleccionarCliente
}) {
  const [query, setQuery] = useState('');
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const dictadoRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setGrabandoVoz(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
    }

    return () => {
      if (dictadoRef.current) {
        try { dictadoRef.current.detener(); } catch (_) {}
        dictadoRef.current = null;
      }
    };
  }, [isOpen]);

  const resultados = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return { obras: [], clientes: [], movimientos: [] };

    const obrasMatch = obras
      .filter(o => 
        (o.nombre && o.nombre.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.direccion && o.direccion.toLowerCase().includes(q)) ||
        (o.sucursal && o.sucursal.toLowerCase().includes(q))
      )
      .slice(0, 8);

    const clientesMatch = clientes
      .filter(c => 
        (c.nombreCliente && c.nombreCliente.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.responsable && c.responsable.toLowerCase().includes(q)) ||
        (c.contacto && c.contacto.includes(q))
      )
      .slice(0, 8);

    const movimientosMatch = movimientos
      .filter(m => 
        (m.folio && m.folio.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q))
      )
      .slice(0, 5);

    return {
      obras: obrasMatch,
      clientes: clientesMatch,
      movimientos: movimientosMatch
    };
  }, [query, obras, clientes, movimientos]);

  const totalResultados = resultados.obras.length + resultados.clientes.length + resultados.movimientos.length;

  const toggleDictado = async () => {
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
        const limpio = texto.trim().toUpperCase();
        setQuery(prev => prev ? `${prev} ${limpio}` : limpio);
      },
      onError: () => {
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

  const limpiar = () => {
    if (dictadoRef.current) {
      try { dictadoRef.current.detener(); } catch (_) {}
      dictadoRef.current = null;
    }
    setGrabandoVoz(false);
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}>
      
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 mt-4 sm:mt-12 animate-in slide-in-from-top duration-200"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Input de búsqueda */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca obra, cliente, folio o dirección..."
              className="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-[#0091FB] focus:bg-white focus:ring-2 focus:ring-[#0091FB]/15 transition-all"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={limpiar}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 active:scale-90 transition-all">
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Botón de voz */}
          <button
            type="button"
            onClick={toggleDictado}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
              grabandoVoz 
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30' 
                : 'bg-[#001757] hover:bg-[#00227a] text-white shadow-md'
            }`}
            title={grabandoVoz ? 'Detener dictado' : 'Buscar por voz'}>
            {grabandoVoz ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 active:scale-90 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado vacío */}
        {!query.trim() && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#001757] to-[#0091FB] flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-base font-black text-slate-800">Búsqueda universal</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Encuentra obras, clientes, folios de cotizaciones o ventas desde un solo lugar.
              </p>
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Mic className="w-3.5 h-3.5" /> Toca el botón azul para dictar
              </p>
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {query.trim().length >= 2 && totalResultados === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-black text-slate-700">Sin resultados</p>
              <p className="text-xs text-slate-400">Intenta con otra palabra o folio</p>
            </div>
          </div>
        )}

        {/* Mensaje de "escribe más" */}
        {query.trim().length === 1 && (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-400 font-semibold">Escribe al menos 2 caracteres...</p>
          </div>
        )}

        {/* Resultados */}
        {query.trim().length >= 2 && totalResultados > 0 && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* Obras */}
            {resultados.obras.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Obras ({resultados.obras.length})
                </p>
                {resultados.obras.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSeleccionarObra(o);
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-[#0091FB] flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-all group">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#001757] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate group-hover:text-[#001757] transition-colors">
                          {o.nombre}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                          <span className="font-mono">{o.id}</span>
                          <span>•</span>
                          <span>{o.sucursal}</span>
                          {o.direccion && (
                            <>
                              <span>•</span>
                              <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                              <span className="truncate">{o.direccion}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0091FB] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Clientes */}
            {resultados.clientes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Clientes ({resultados.clientes.length})
                </p>
                {resultados.clientes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSeleccionarCliente(c);
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-[#0091FB] flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-all group">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate group-hover:text-[#001757] transition-colors">
                          {c.nombreCliente}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                          <span className="font-mono">{c.id}</span>
                          <span> • </span>
                          <span>{c.responsable || 'Sin encargado'}</span>
                          {c.contacto && (
                            <>
                              <span> • </span>
                              <span>{c.contacto}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0091FB] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Movimientos (folios) */}
            {resultados.movimientos.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Folios ({resultados.movimientos.length})
                </p>
                {resultados.movimientos.map(m => {
                  const obraMov = obras.find(o => o.id === m.obraId);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (obraMov) {
                          onClose();
                          onSeleccionarObra(obraMov);
                        }
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-all group">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          m.tipo === 'VENTA' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {m.folio} — {formatearMoneda(m.monto)}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                            {m.comprobante} • {obraMov ? obraMov.nombre : 'Sin obra'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}