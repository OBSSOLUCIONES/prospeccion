// src/components/SplashScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Zap, Radio } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [fase, setFase] = useState('inicio'); // 'inicio' | 'iluminar' | 'salida'
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // 1. Destello y entrada cinemática
    const t1 = setTimeout(() => setFase('iluminar'), 100);
    // 2. Transición de salida suave
    const t2 = setTimeout(() => setFase('salida'), 1500);
    // 3. Entrada al sistema
    const t3 = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const saltarSplash = () => {
    if (onFinishRef.current) onFinishRef.current();
  };

  return (
    <div
      onClick={saltarSplash}
      className={`fixed inset-0 z-[300] bg-[#000411] flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        fase === 'salida' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      title="Toca para entrar"
    >
      {/* =========================================================================
          ATMÓSFERA CINEMÁTICA DE FONDO (LUZ VOLUMÉTRICA TIPO NETFLIX)
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Halo central expansivo con luz eléctrica */}
        <div
          className={`absolute w-[360px] sm:w-[620px] h-[360px] sm:h-[620px] rounded-full bg-gradient-to-tr from-[#001757] via-[#0091FB]/25 to-transparent blur-[90px] sm:blur-[130px] transition-all duration-1000 ease-out ${
            fase === 'inicio' ? 'scale-50 opacity-20' : 'scale-110 opacity-70'
          }`}
        />

        {/* Destello de lente horizontal */}
        <div
          className={`absolute w-full max-w-4xl h-[2px] bg-gradient-to-r from-transparent via-[#0091FB]/40 to-transparent blur-[1px] transition-all duration-1000 ease-out ${
            fase === 'inicio' ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
          }`}
        />

        {/* Viñeta oscura en los bordes de pantalla */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#000411_95%)]" />
      </div>

      {/* Cabecera Superior: Micro-Telemetría */}
      <div className="w-full flex items-center justify-between pt-1 sm:pt-2 relative z-10 text-[9px] sm:text-[11px] font-black tracking-[0.25em] text-slate-500 uppercase">
        <span className="flex items-center gap-1.5 text-[#0091FB]">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> OBS FIELD OS
        </span>
        <span className="font-mono text-slate-500">v2.4 PRO</span>
      </div>

      {/* =========================================================================
          NÚCLEO PRINCIPAL: LOGO COMPLETO PROTAGONISTA (CENTRADO Y FLOTANTE)
         ========================================================================= */}
      <div className="flex flex-col items-center justify-center text-center relative z-10 my-auto w-full max-w-lg px-4">
        
        {/* Contenedor del Logo con Zoom Cinemático */}
        <div
          className={`relative transition-all duration-1000 ease-out transform ${
            fase === 'inicio'
              ? 'scale-90 opacity-0 translate-y-3 filter blur-[6px]'
              : 'scale-100 opacity-100 translate-y-0 filter blur-0'
          }`}
        >
          {/* Resplandor silueta detrás del logo */}
          <div className="absolute inset-0 bg-[#0091FB]/30 blur-2xl rounded-full scale-95" />

          {/* Tu imagen de logo completa sin cajas que la recorten */}
          <img
            src="./logo.png"
            alt="PROSPECCIÓN OBS"
            className="relative max-w-[220px] sm:max-w-[340px] max-h-[140px] sm:max-h-[190px] w-auto h-auto object-contain mx-auto drop-shadow-[0_12px_28px_rgba(0,145,251,0.4)] transition-transform duration-700 hover:scale-102"
          />
        </div>

        {/* Tipografía de Identidad Institucional */}
        <div
          className={`mt-6 space-y-1.5 transition-all duration-700 delay-200 ease-out ${
            fase === 'inicio' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#001757]/60 border border-[#0091FB]/30 backdrop-blur-md shadow-lg shadow-[#001757]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0091FB] animate-ping" />
            <p className="text-[10px] sm:text-xs font-black tracking-[0.3em] text-[#0091FB] uppercase">
              PROSPECCIÓN
            </p>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            OBS
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wider">
            Control Territorial & Auditoría de Obras
          </p>
        </div>

      </div>

      {/* =========================================================================
          PIE INFERIOR: LÍNEA LÁSER NEÓN Y ESTADO DE SENSORES
         ========================================================================= */}
      <div
        className={`w-full max-w-sm space-y-3 relative z-10 transition-all duration-700 delay-300 ease-out ${
          fase === 'inicio' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center justify-center gap-4 text-[10px] sm:text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" /> GPS Satelital
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-[#0091FB]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0091FB]" /> Terminal Lista
          </span>
        </div>

        {/* Línea Láser Ultradelgada con Destello en la Punta */}
        <div className="relative w-full h-[2px] bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-transparent via-[#0091FB] to-cyan-300 rounded-full shadow-[0_0_10px_#0091FB] transition-all duration-1200 ease-in-out ${
              fase === 'inicio' ? 'w-0' : 'w-full'
            }`}
          />
        </div>

        <p className="text-center text-[9px] text-slate-600 font-medium">
          Toca en cualquier lugar para continuar
        </p>
      </div>

    </div>
  );
}