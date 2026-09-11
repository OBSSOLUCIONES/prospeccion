import React, { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ModalVisor({ visorModal, onClose }) {
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    if (visorModal && typeof visorModal.index === 'number') {
      setIndiceActual(visorModal.index);
    } else {
      setIndiceActual(0);
    }
  }, [visorModal]);

  if (!visorModal) return null;

  const esPdf = visorModal.tipo === 'pdf';
  const listaFotos = visorModal.fotos || (visorModal.url ? [visorModal.url] : []);
  const totalFotos = listaFotos.length;
  const fotoActual = listaFotos[indiceActual] || visorModal.url;

  const anterior = () => {
    setIndiceActual(prev => (prev > 0 ? prev - 1 : totalFotos - 1));
  };

  const siguiente = () => {
    setIndiceActual(prev => (prev < totalFotos - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* Cabecera */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="truncate pr-2">
            <h3 className="font-bold text-xs sm:text-sm truncate text-slate-100">
              {visorModal.titulo}
            </h3>
            {!esPdf && totalFotos > 1 && (
              <span className="text-[11px] text-blue-400 font-mono">
                Foto {indiceActual + 1} de {totalFotos}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a 
              href={esPdf ? visorModal.url : fotoActual} 
              target="_blank" 
              rel="noreferrer"
              download
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors"
              title="Descargar archivo">
              <Download className="w-4 h-4" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visor Central */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-2 relative overflow-hidden min-h-[350px]">
          {esPdf ? (
            <iframe 
              src={visorModal.url} 
              title={visorModal.titulo}
              className="w-full h-[70vh] rounded-xl border border-slate-800"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={fotoActual} 
                alt="Evidencia" 
                className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-2xl transition-all duration-200"
              />

              {/* Controles de Carrusel (si hay más de 1 foto) */}
              {totalFotos > 1 && (
                <>
                  <button
                    type="button"
                    onClick={anterior}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-xs transition-all active:scale-90">
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={siguiente}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-xs transition-all active:scale-90">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}