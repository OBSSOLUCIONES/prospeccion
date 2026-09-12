// src/components/BottomNav.jsx
import React from 'react';
import { Layers, Users, MapPin } from 'lucide-react';

export default function BottomNav({ tab, setTab, usuarioActivo }) {
  const esDirector = usuarioActivo?.rol === 'admin' || usuarioActivo?.sucursal === 'TODAS';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-2.5 pt-1.5 px-4 pointer-events-none flex justify-center safe-bottom">
      <nav className="pointer-events-auto w-full max-w-lg bg-[#000b26]/95 backdrop-blur-2xl border border-slate-700/60 shadow-[0_16px_40px_rgba(0,11,38,0.45)] rounded-[26px] p-1.5 flex items-center justify-around transition-all">
        
        {/* Pestaña Obras */}
        <button
          type="button"
          onClick={() => setTab('pipeline')}
          className={`flex-1 min-h-[48px] py-1.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
            tab === 'pipeline' 
              ? 'bg-gradient-to-r from-[#001757] to-[#0091FB] text-white shadow-md shadow-[#0091FB]/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className={`w-5 h-5 stroke-[2.4] ${tab === 'pipeline' ? 'text-white' : 'text-slate-400'}`} />
          <span className="text-[11px] font-black tracking-tight">Obras</span>
        </button>

        {/* Pestaña Clientes */}
        <button
          type="button"
          onClick={() => setTab('clientes')}
          className={`flex-1 min-h-[48px] py-1.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
            tab === 'clientes' 
              ? 'bg-gradient-to-r from-[#001757] to-[#0091FB] text-white shadow-md shadow-[#0091FB]/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 stroke-[2.4] ${tab === 'clientes' ? 'text-white' : 'text-slate-400'}`} />
          <span className="text-[11px] font-black tracking-tight">Clientes</span>
        </button>

        {/* Pestaña Mapa Satelital (Solo Director) */}
        {esDirector && (
          <button
            type="button"
            onClick={() => setTab('mapa')}
            className={`flex-1 min-h-[48px] py-1.5 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
              tab === 'mapa' 
                ? 'bg-gradient-to-r from-[#001757] to-[#0091FB] text-white shadow-md shadow-[#0091FB]/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className={`w-5 h-5 stroke-[2.4] ${tab === 'mapa' ? 'text-white' : 'text-slate-400'}`} />
            <span className="text-[11px] font-black tracking-tight">Mapa en Vivo</span>
          </button>
        )}

      </nav>
    </div>
  );
}