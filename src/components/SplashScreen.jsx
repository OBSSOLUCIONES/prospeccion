// src/components/SplashScreen.jsx
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Compass, Radio, Zap } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [faseAnimacion, setFaseAnimacion] = useState('inicio'); // 'inicio' | 'revelado' | 'salida'

  useEffect(() => {
    const t1 = setTimeout(() => setFaseAnimacion('revelado'), 150);
    const t2 = setTimeout(() => setFaseAnimacion('salida'), 1750);
    const t3 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[200] bg-[#000b26] flex flex-col items-center justify-between p-8 select-none transition-all duration-500 ease-out ${
        faseAnimacion === 'salida' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Resplandor radial de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] bg-[#0091FB]/15 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#001757]/80 rounded-full blur-2xl" />
      </div>

      {/* Barra superior de hardware */}
      <div className="w-full flex items-center justify-between pt-3 relative z-10 text-[10px] font-black tracking-widest text-slate-500 uppercase">
        <span className="flex items-center gap-1 text-[#0091FB]">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> TELEMETRÍA EN CAMPO
        </span>
        <span className="font-mono text-slate-400">TABLET OS v2.4</span>
      </div>

      {/* Núcleo Central: Imagotipo y PROSPECCIÓN OBS */}
      <div className="flex flex-col items-center text-center space-y-6 relative z-10 my-auto">
        
        {/* Monograma Tecnológico */}
        <div
          className={`relative transition-all duration-700 ease-out transform ${
            faseAnimacion === 'inicio' ? 'scale-75 opacity-0 rotate-[-12deg]' : 'scale-100 opacity-100 rotate-0'
          }`}
        >
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-[#0091FB] to-[#001757] opacity-40 blur-md animate-pulse" />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#001757] via-[#00227a] to-[#0091FB] p-0.5 shadow-2xl shadow-[#0091FB]/30 border border-white/25 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-[#000f38] flex flex-col items-center justify-center gap-1">
              <Compass className="w-10 h-10 sm:w-12 sm:h-12 text-[#0091FB] stroke-[2.2] animate-[spin_18s_linear_infinite]" />
            </div>
          </div>
        </div>

        {/* Tipografía Oficial */}
        <div
          className={`space-y-2 transition-all duration-700 delay-150 ease-out ${
            faseAnimacion === 'inicio' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="inline-block px-3 py-1 rounded-full bg-[#0091FB]/10 border border-[#0091FB]/30">
            <p className="text-[10px] sm:text-xs font-black tracking-[0.28em] text-[#0091FB] uppercase">
              PROSPECCIÓN
            </p>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            OBS
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wide">
            Control Territorial y Auditoría de Obras
          </p>
        </div>

      </div>

      {/* Estado Inferior de Sensores */}
      <div
        className={`w-full max-w-xs space-y-3 relative z-10 transition-all duration-700 delay-300 ease-out ${
          faseAnimacion === 'inicio' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" /> GPS Satelital
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Terminal Lista
          </span>
        </div>

        <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full bg-gradient-to-r from-[#0091FB] to-emerald-400 rounded-full transition-all duration-1000 ease-in-out ${
              faseAnimacion === 'inicio' ? 'w-0' : 'w-full'
            }`}
          />
        </div>
      </div>

    </div>
  );
}