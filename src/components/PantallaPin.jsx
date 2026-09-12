// src/components/PantallaPin.jsx
import React, { useState } from 'react';
import { Compass, Delete, ShieldCheck, Lock } from 'lucide-react';

export default function PantallaPin({ usuarios, onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const agregarDigito = (num) => {
    if (pin.length >= 4) return;
    const nuevoPin = pin + num;
    setPin(nuevoPin);
    setError('');

    if (nuevoPin.length === 4) {
      validarPin(nuevoPin);
    }
  };

  const borrarDigito = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const validarPin = (pinIngresado) => {
    const usuarioEncontrado = usuarios.find(u => String(u.pin) === String(pinIngresado));

    if (usuarioEncontrado) {
      onLogin(usuarioEncontrado);
    } else {
      setShake(true);
      setError('PIN incorrecto. Intenta de nuevo.');
      setTimeout(() => {
        setPin('');
        setShake(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#000b26] flex flex-col items-center justify-between p-6 sm:p-8 select-none animate-in fade-in duration-300">
      
      {/* Cabecera y Branding Homologado PROSPECCIÓN OBS */}
      <div className="flex flex-col items-center pt-4 sm:pt-8 text-center space-y-2.5">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#001757] via-[#00227a] to-[#0091FB] flex items-center justify-center text-white shadow-xl shadow-[#0091FB]/20 border border-white/20">
          <Compass className="w-8 h-8 text-[#0091FB] stroke-[2.4]" />
        </div>
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0091FB]">
            PROSPECCIÓN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">OBS</h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Acceso a Terminal de Campo</p>
        </div>
      </div>

      {/* Indicador de 4 dígitos */}
      <div className={`flex flex-col items-center space-y-3.5 ${shake ? 'animate-bounce' : ''}`}>
        <p className="text-xs sm:text-sm font-black text-slate-300 flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-[#0091FB]" /> Ingresa tu PIN de 4 dígitos
        </p>

        <div className="flex gap-4 sm:gap-5 my-1">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-150 ${
                pin.length > i 
                  ? 'bg-[#0091FB] border-[#0091FB] scale-110 shadow-lg shadow-[#0091FB]/50' 
                  : 'border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-xs sm:text-sm text-rose-400 font-extrabold animate-pulse">{error}</p>
        ) : (
          <p className="text-[11px] text-slate-500 font-medium">Uso exclusivo para asesores y directores</p>
        )}
      </div>

      {/* Teclado Numérico Ergonómico de Alto Contraste para Tablets y Fundas de Uso Rudo */}
      <div className="w-full max-w-xs sm:max-w-sm space-y-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => agregarDigito(n)}
              className="h-16 sm:h-18 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-2xl sm:text-3xl font-black hover:bg-slate-800 active:scale-95 active:bg-[#0091FB] active:border-[#0091FB] transition-all flex items-center justify-center shadow-md active:shadow-none select-none touch-manipulation">
              {n}
            </button>
          ))}

          {/* Fila inferior */}
          <div />
          <button
            type="button"
            onClick={() => agregarDigito(0)}
            className="h-16 sm:h-18 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-2xl sm:text-3xl font-black hover:bg-slate-800 active:scale-95 active:bg-[#0091FB] active:border-[#0091FB] transition-all flex items-center justify-center shadow-md active:shadow-none select-none touch-manipulation">
            0
          </button>
          <button
            type="button"
            onClick={borrarDigito}
            className="h-16 sm:h-18 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 active:bg-rose-600/30 transition-all flex items-center justify-center shadow-md active:shadow-none select-none touch-manipulation"
            title="Borrar dígito">
            <Delete className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Certificación de Seguridad */}
      <div className="text-[11px] font-bold text-slate-500 pb-2 flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sistema Seguro PROSPECCIÓN OBS
      </div>

    </div>
  );
}