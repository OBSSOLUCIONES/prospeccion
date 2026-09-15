// src/components/RutaDelDia.jsx
import React, { useMemo } from 'react';
import { 
  X, MapPin, Navigation, Camera, ChevronRight, 
  Flame, Snowflake, Route, Target, Calendar
} from 'lucide-react';
import { FASE_COLORS } from '../data/constants';

function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const calcularDiasDesdeFecha = (fechaStr) => {
  if (!fechaStr) return 999;
  try {
    const d = new Date(fechaStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return 999;
    const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  } catch {
    return 999;
  }
};

const formatearDistancia = (metros) => {
  if (metros === null || metros === undefined) return null;
  if (metros < 1000) return `${metros} m`;
  return `${(metros / 1000).toFixed(1)} km`;
};

export default function RutaDelDia({ 
  isOpen, 
  onClose, 
  obras = [], 
  visitas = [], 
  clientes = [],
  tabletPos,
  usuarioActivo,
  filtroSucursal,
  onSeleccionarObra,
  onNuevaVisita,
  onAbrirRuta
}) {
  const rutas = useMemo(() => {
    if (!isOpen) return [];

    const hoy = new Date();
    const esDirector = usuarioActivo?.sucursal === 'TODAS' || usuarioActivo?.rol === 'admin';

    const procesadas = obras
      .filter(o => o.estadoObra === 'ACTIVA' || o.estadoObra === 'PAUSADA')
      .filter(o => esDirector || filtroSucursal === 'TODAS' || o.sucursal === filtroSucursal)
      .map(obra => {
        const visitasObra = visitas.filter(v => v.obraId === obra.id);
        const ultimaVisita = visitasObra.length > 0
          ? visitasObra.sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')))[0]
          : null;
        
        const diasSinVisita = ultimaVisita ? calcularDiasDesdeFecha(ultimaVisita.fecha) : 999;
        const visitaHoy = ultimaVisita && calcularDiasDesdeFecha(ultimaVisita.fecha) === 0;

        const distanciaMetros = (tabletPos?.lat && tabletPos?.lng && obra.lat && obra.lng)
          ? calcularDistanciaMetros(tabletPos.lat, tabletPos.lng, parseFloat(obra.lat), parseFloat(obra.lng))
          : null;

        const distanciaKm = distanciaMetros !== null ? distanciaMetros / 1000 : 5;

        // Score de prioridad: menor = más prioritario
        // Días sin visita pesan x3, distancia pesa x1
        const diasEfectivos = Math.min(diasSinVisita, 30);
        const score = (diasEfectivos * 3) + (distanciaKm * 1);

        const cliente = clientes.find(c => c.id === obra.clienteId);

        return {
          ...obra,
          cliente,
          ultimaVisita,
          diasSinVisita,
          distanciaMetros,
          distanciaKm,
          visitaHoy,
          score
        };
      })
      .filter(o => !o.visitaHoy) // Excluir las que ya se visitaron hoy
      .sort((a, b) => a.score - b.score); // Menor score primero

    return procesadas;
  }, [isOpen, obras, visitas, clientes, tabletPos, filtroSucursal, usuarioActivo]);

  if (!isOpen) return null;

  const totalObras = rutas.length;
  const obrasFrias = rutas.filter(r => r.diasSinVisita > 12).length;
  const obrasCerca = rutas.filter(r => r.distanciaMetros !== null && r.distanciaMetros < 1000).length;

  return (
    <div className="fixed inset-0 z-[95] bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Barra de arrastre */}
        <div className="pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* Cabecera */}
        <div className="p-5 bg-gradient-to-br from-[#001757] via-[#00227a] to-[#001757] text-white shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Route className="w-5 h-5 text-amber-300 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight">Ruta del Día</h2>
                  <p className="text-[11px] text-blue-200 font-semibold">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-100/80 leading-snug">
                Obras priorizadas por cercanía y días sin supervisión
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 active:scale-90 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mini-métricas */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/15">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">Total</p>
              <p className="text-lg font-black text-white">{totalObras}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-200 flex items-center gap-1">
                <Snowflake className="w-3 h-3" /> Frías
              </p>
              <p className="text-lg font-black text-white">{obrasFrias}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                <Target className="w-3 h-3" /> Cerca
              </p>
              <p className="text-lg font-black text-white">{obrasCerca}</p>
            </div>
          </div>
        </div>

        {/* Lista de obras */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
          {rutas.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <Flame className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-black text-slate-800">¡Todo al día!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                No hay obras pendientes de visita en este momento. Buen trabajo.
              </p>
            </div>
          ) : (
            rutas.map((obra, idx) => {
              const esFria = obra.diasSinVisita > 12;
              const esMuyFria = obra.diasSinVisita > 20;
              const distanciaTexto = formatearDistancia(obra.distanciaMetros);
              const esCercana = obra.distanciaMetros !== null && obra.distanciaMetros < 1000;

              return (
                <div
                  key={obra.id}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                    esMuyFria ? 'border-rose-300 shadow-md shadow-rose-100' :
                    esFria ? 'border-amber-300' :
                    'border-slate-200'
                  }`}>

                  {/* Número de orden y badges */}
                  <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        esMuyFria ? 'bg-rose-600 text-white' :
                        esFria ? 'bg-amber-500 text-white' :
                        'bg-[#001757] text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] border border-slate-200 shrink-0">
                        {obra.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase ${FASE_COLORS[obra.estatusFase]}`}>
                        {obra.estatusFase}
                      </span>
                    </div>

                    {esCercana && (
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                        <MapPin className="w-3 h-3" />
                        {distanciaTexto}
                      </span>
                    )}
                  </div>

                  {/* Info principal */}
                  <div className="px-3.5 pb-3 space-y-2">
                    <h4 className="text-sm sm:text-base font-black text-[#001757] leading-tight">
                      {obra.nombre}
                    </h4>

                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {esMuyFria && (
                        <span className="font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Snowflake className="w-3 h-3" />
                          {obra.diasSinVisita}d sin visita
                        </span>
                      )}
                      {esFria && !esMuyFria && (
                        <span className="font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {obra.diasSinVisita}d sin visita
                        </span>
                      )}
                      {!esFria && (
                        <span className="font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                          {obra.diasSinVisita === 999 ? 'Sin visitas' : `${obra.diasSinVisita}d`}
                        </span>
                      )}
                      {distanciaTexto && !esCercana && (
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {distanciaTexto}
                        </span>
                      )}
                      {obra.cliente && (
                        <span className="font-semibold text-slate-500 truncate">
                          • {obra.cliente.nombreCliente}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-3 gap-1.5 p-2.5 pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAbrirRuta({
                          nombre: obra.nombre,
                          direccion: obra.direccion,
                          lat: obra.lat,
                          lng: obra.lng
                        });
                      }}
                      className="min-h-[38px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all">
                      <Navigation className="w-3.5 h-3.5 text-[#0091FB]" />
                      Navegar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNuevaVisita(obra);
                      }}
                      className="min-h-[38px] rounded-xl bg-gradient-to-r from-[#0091FB] to-[#007be0] hover:brightness-105 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all">
                      <Camera className="w-3.5 h-3.5 stroke-[2.4]" />
                      Check-in
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSeleccionarObra(obra);
                      }}
                      className="min-h-[38px] rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-black text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all">
                      Ver
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-[#001757] hover:bg-[#00227a] text-white font-black text-sm shadow-md active:scale-98 transition-all">
            Cerrar Ruta
          </button>
        </div>

      </div>
    </div>
  );
}