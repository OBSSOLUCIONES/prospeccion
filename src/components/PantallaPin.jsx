// src/components/PantallaPin.jsx
import React, { useState } from 'react';
import { Building2, Delete, ShieldCheck, Lock } from 'lucide-react';

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
    <div className="fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200">
      
      {/* Cabecera y Marca */}
      <div className="flex flex-col items-center pt-6 sm:pt-10 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Building2 className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Control de Obras</h1>
          <p className="text-xs text-slate-400">Acceso Territorial Red Azul</p>
        </div>
      </div>

      {/* Indicador de 4 dígitos */}
      <div className={`flex flex-col items-center space-y-3 ${shake ? 'animate-bounce' : ''}`}>
        <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-blue-400" /> Ingresa tu PIN de acceso
        </p>

        <div className="flex gap-4 my-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > i 
                  ? 'bg-blue-500 border-blue-500 scale-115 shadow-md shadow-blue-500/50' 
                  : 'border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-xs text-rose-400 font-bold animate-pulse">{error}</p>
        ) : (
          <p className="text-[11px] text-slate-500">4 dígitos numéricos</p>
        )}
      </div>

      {/* Teclado Numérico Táctil */}
      <div className="w-full max-w-xs space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => agregarDigito(n)}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-white text-2xl font-bold hover:bg-slate-800 active:scale-90 active:bg-blue-600 transition-all flex items-center justify-center shadow-xs">
              {n}
            </button>
          ))}

          {/* Fila inferior */}
          <div />
          <button
            type="button"
            onClick={() => agregarDigito(0)}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-white text-2xl font-bold hover:bg-slate-800 active:scale-90 active:bg-blue-600 transition-all flex items-center justify-center shadow-xs">
            0
          </button>
          <button
            type="button"
            onClick={borrarDigito}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center shadow-xs">
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Pie de página discreto */}
      <div className="text-[10px] text-slate-600 pb-2 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Sistema Seguro Red Azul
      </div>

    </div>
  );
}