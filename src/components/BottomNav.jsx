// src/components/BottomNav.jsx
import React from 'react';
import { Layers, Users, MapPin } from 'lucide-react';

export default function BottomNav({ tab, setTab, usuarioActivo }) {
  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 flex items-center justify-around shadow-lg">
      <button
        type="button"
        onClick={() => setTab('pipeline')}
        className={`flex flex-col items-center gap-1 transition-all ${
          tab === 'pipeline' ? 'text-[#0091FB] font-black scale-105' : 'text-slate-400 font-bold'
        }`}>
        <Layers className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] tracking-wide">Obras</span>
      </button>

      <button
        type="button"
        onClick={() => setTab('clientes')}
        className={`flex flex-col items-center gap-1 transition-all ${
          tab === 'clientes' ? 'text-[#0091FB] font-black scale-105' : 'text-slate-400 font-bold'
        }`}>
        <Users className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] tracking-wide">Clientes</span>
      </button>

      {esDirector && (
        <button
          type="button"
          onClick={() => setTab('mapa')}
          className={`flex flex-col items-center gap-1 transition-all ${
            tab === 'mapa' ? 'text-[#0091FB] font-black scale-105' : 'text-slate-400 font-bold'
          }`}>
          <MapPin className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-wide">Mapa en Vivo</span>
        </button>
      )}
    </nav>
  );
}