// src/components/BottomNav.jsx
import React from 'react';
import { Layers, Users, MapPin } from 'lucide-react';

export default function BottomNav({ tab, setTab, usuarioActivo }) {
  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  return (
    <div className="fixed bottom-3.5 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/80 shadow-[0_12px_36px_-6px_rgba(0,23,87,0.15)] rounded-3xl p-1.5 flex items-center justify-around transition-all">
        
        {/* Pestaña Obras */}
        <button
          type="button"
          onClick={() => setTab('pipeline')}
          className={`flex-1 py-2 px-3 rounded-2xl flex flex-col items-center gap-0.5 transition-all duration-200 ${
            tab === 'pipeline' 
              ? 'bg-[#001757] text-white shadow-md shadow-[#001757]/20 scale-102' 
              : 'text-slate-400 hover:text-slate-700 active:scale-95'
          }`}>
          <Layers className={`w-4 h-4 stroke-[2.4] ${tab === 'pipeline' ? 'text-[#0091FB]' : ''}`} />
          <span className="text-[10px] font-black tracking-tight">Obras</span>
        </button>

        {/* Pestaña Clientes */}
        <button
          type="button"
          onClick={() => setTab('clientes')}
          className={`flex-1 py-2 px-3 rounded-2xl flex flex-col items-center gap-0.5 transition-all duration-200 ${
            tab === 'clientes' 
              ? 'bg-[#001757] text-white shadow-md shadow-[#001757]/20 scale-102' 
              : 'text-slate-400 hover:text-slate-700 active:scale-95'
          }`}>
          <Users className={`w-4 h-4 stroke-[2.4] ${tab === 'clientes' ? 'text-[#0091FB]' : ''}`} />
          <span className="text-[10px] font-black tracking-tight">Clientes</span>
        </button>

        {/* Pestaña Mapa Satelital (Solo Director) */}
        {esDirector && (
          <button
            type="button"
            onClick={() => setTab('mapa')}
            className={`flex-1 py-2 px-3 rounded-2xl flex flex-col items-center gap-0.5 transition-all duration-200 ${
              tab === 'mapa' 
                ? 'bg-[#001757] text-white shadow-md shadow-[#001757]/20 scale-102' 
                : 'text-slate-400 hover:text-slate-700 active:scale-95'
            }`}>
            <MapPin className={`w-4 h-4 stroke-[2.4] ${tab === 'mapa' ? 'text-[#0091FB]' : ''}`} />
            <span className="text-[10px] font-black tracking-tight">Mapa en Vivo</span>
          </button>
        )}

      </nav>
    </div>
  );
}