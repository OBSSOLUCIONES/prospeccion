// src/components/SplashScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Radio, Zap } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [faseAnimacion, setFaseAnimacion] = useState('inicio');
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // 1. Revelado instantáneo
    const t1 = setTimeout(() => setFaseAnimacion('revelado'), 80);
    // 2. Salida rápida a los 1.1 segundos
    const t2 = setTimeout(() => setFaseAnimacion('salida'), 1100);
    // 3. Desmontar y dar paso a la app a los 1.4 segundos exactos
    const t3 = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []); // [] asegura que NUNCA se reinicie por el GPS o la conexión

  const saltarSplash = () => {
    if (onFinishRef.current) onFinishRef.current();
  };

  return (
    <div
      onClick={saltarSplash}
      className={`fixed inset-0 z-[200] bg-[#000b26] flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer transition-all duration-300 ease-out ${
        faseAnimacion === 'salida' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      title="Toca para entrar"
    >
      {/* Resplandor radial de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#0091FB]/15 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 w-60 sm:w-80 h-60 sm:h-80 bg-[#001757]/80 rounded-full blur-2xl" />
      </div>

      {/* Barra superior de hardware */}
      <div className="w-full flex items-center justify-between pt-2 relative z-10 text-[9px] sm:text-[11px] font-black tracking-widest text-slate-500 uppercase">
        <span className="flex items-center gap-1 text-[#0091FB]">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> TELEMETRÍA EN CAMPO
        </span>
        <span className="font-mono text-slate-400">TABLET OS v2.4</span>
      </div>

      {/* Núcleo Central: Imagotipo y PROSPECCIÓN OBS */}
      <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 relative z-10 my-auto">
        <div
          className={`relative transition-all duration-500 ease-out transform ${
            faseAnimacion === 'inicio' ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <div className="absolute -inset-2.5 sm:-inset-3 rounded-3xl bg-gradient-to-tr from-[#0091FB] to-[#001757] opacity-50 blur-lg animate-pulse" />

          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-[#001757] via-[#00227a] to-[#0091FB] p-1 shadow-2xl shadow-[#0091FB]/30 border border-white/25 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-[#000f38] flex items-center justify-center p-2.5">
              <img 
                src="./logo.png" 
                alt="PROSPECCIÓN OBS" 
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Textos de Marca */}
        <div
          className={`space-y-1.5 sm:space-y-2 transition-all duration-500 delay-100 ease-out ${
            faseAnimacion === 'inicio' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="inline-block px-3 py-0.5 sm:py-1 rounded-full bg-[#0091FB]/10 border border-[#0091FB]/30">
            <p className="text-[9px] sm:text-xs font-black tracking-[0.25em] text-[#0091FB] uppercase">
              PROSPECCIÓN
            </p>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            OBS
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wide">
            Control Territorial y Auditoría de Obras
          </p>
        </div>
      </div>

      {/* Indicadores Inferiores */}
      <div
        className={`w-full max-w-xs space-y-2.5 relative z-10 transition-all duration-500 delay-150 ease-out ${
          faseAnimacion === 'inicio' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center justify-center gap-3 text-[10px] sm:text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" /> GPS Activo
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Terminal Lista
          </span>
        </div>

        <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full bg-gradient-to-r from-[#0091FB] to-emerald-400 rounded-full transition-all duration-700 ease-in-out ${
              faseAnimacion === 'inicio' ? 'w-0' : 'w-full'
            }`}
          />
        </div>

        <p className="text-center text-[9px] text-slate-500">Toca en cualquier lugar para continuar</p>
      </div>

    </div>
  );
}