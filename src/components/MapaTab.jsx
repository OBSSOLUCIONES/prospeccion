// src/components/MapaTab.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Radio, Layers, Crosshair, Route } from 'lucide-react';
import { SUCURSALES } from '../data/constants';

const SUCURSAL_COORDS = {
  'ALTOZANO': [19.6642, -101.1718],
  'LA MIRA': [18.0333, -102.3167],
  'LÁZARO': [17.9583, -102.2000],
  'PÁTZCUARO': [19.5139, -101.6094],
  'PERIFERICO': [19.7000, -101.1900],
  'SAN MIGUEL': [20.9144, -100.7452],
  'URIANGATO': [20.1417, -101.1764],
  'VILLADIEGO': [19.6918, -101.2090],
  'ZAMORA': [19.9833, -102.2833],
  'ZIHUATANEJO': [17.6410, -101.5510]
};

const obraIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); display: flex; flex-direction: column; align-items: center; width: 30px; height: 38px;">
      <div style="background-color: #10B981; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; display: flex; align-items: center; justify-content: center;">
        <span style="transform: rotate(45deg); font-size: 13px;">🏗️</span>
      </div>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38]
});

const clienteIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); display: flex; flex-direction: column; align-items: center; width: 30px; height: 38px;">
      <div style="background-color: #001757; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; display: flex; align-items: center; justify-content: center;">
        <span style="transform: rotate(45deg); font-size: 13px;">🏢</span>
      </div>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38]
});

const tuDispositivoIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: #0091FB; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="background-color: #0091FB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const crearIconoAsesorEnVivo = (nombre) => {
  const iniciales = (nombre || 'AS').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 44px; height: 52px;">
        <div style="position: absolute; top: 0; width: 38px; height: 38px; border-radius: 50%; background-color: #0091FB; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 38px; height: 38px; border-radius: 50%; background: #001757; border: 2.5px solid #0091FB; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,23,87,0.45); z-index: 10;">
          <span style="color: white; font-weight: 900; font-size: 11px; font-family: Montserrat, sans-serif;">${iniciales}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #001757; margin-top: -2px; z-index: 9;"></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46]
  });
};

function calcularTiempoTranscurrido(fechaIso) {
  if (!fechaIso) return 'Reciente';
  try {
    const diffSeg = Math.floor((Date.now() - new Date(fechaIso).getTime()) / 1000);
    if (diffSeg < 60) return 'Hace unos segundos';
    const diffMin = Math.floor(diffSeg / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    return `Hace ${diffHoras} h`;
  } catch {
    return 'Reciente';
  }
}

function AccionesUsuarioEnMapa({ vueloDestino, onVueloCompletado }) {
  const map = useMap();

  useEffect(() => {
    if (vueloDestino) {
      map.flyTo(vueloDestino.coords, vueloDestino.zoom || 14, { duration: 1.2 });
      onVueloCompletado();
    }
  }, [vueloDestino, map, onVueloCompletado]);

  return null;
}

export default function MapaTab({ 
  tabletPos, 
  obras = [], 
  visitas = [], 
  clientes = [], 
  onAbrirRuta, 
  filtroSucursal, 
  setFiltroSucursal,
  asesoresEnVivo = [],
  usuarioActivo,
  deviceId
}) {
  const [verObras, setVerObras] = useState(true);
  const [verClientes, setVerClientes] = useState(true);
  const [verAsesores, setVerAsesores] = useState(true);
  const [ordenVuelo, setOrdenVuelo] = useState(null);
  const [modoRutaFlotilla, setModoRutaFlotilla] = useState(false);

  const centroInicial = [tabletPos?.lat || 19.6642, tabletPos?.lng || -101.1718];

  const obrasPorSucursal = obras.filter(o => filtroSucursal === 'TODAS' || o.sucursal === filtroSucursal);
  const clientesPorSucursal = clientes.filter(c => filtroSucursal === 'TODAS' || c.sucursal === filtroSucursal);

  // FILTRO ANTI-DUPLICADOS Y ANTI-FANTASMAS
  const asesoresFiltrados = useMemo(() => {
    const ahora = Date.now();
    const LIMITE_ACTIVO_MS = 4 * 60 * 60 * 1000; // Máximo 4 horas de inactividad

    const activos = asesoresEnVivo
      .filter(a => a.lat && a.lng)
      // 1. Ocultar posiciones viejas de días u horas anteriores
      .filter(a => {
        if (!a.updated_at) return true;
        const tiempoReporte = new Date(a.updated_at).getTime();
        return (ahora - tiempoReporte) < LIMITE_ACTIVO_MS;
      })
      .filter(a => filtroSucursal === 'TODAS' || a.sucursal === filtroSucursal)
      // 2. Ocultar tu propio usuario activo actual (ya se dibuja como 'Tu Terminal')
      .filter(a => a.usuario_id !== usuarioActivo?.id)
      // 3. Ocultar si el registro vino de este mismo dispositivo físico
      .filter(a => !deviceId || !a.device_id || a.device_id !== deviceId);

    // 4. Deduplicar por nombre: solo conservar la posición más reciente de cada persona
    const mapaUnicos = new Map();
    for (const a of activos) {
      const clave = a.nombre || a.usuario_id;
      const existente = mapaUnicos.get(clave);
      if (!existente || new Date(a.updated_at) > new Date(existente.updated_at)) {
        mapaUnicos.set(clave, a);
      }
    }

    return Array.from(mapaUnicos.values());
  }, [asesoresEnVivo, filtroSucursal, usuarioActivo, deviceId]);

  const obrasConCoordenadas = obrasPorSucursal
    .filter(o => o.lat && o.lng)
    .map(o => ({
      ...o,
      latFinal: parseFloat(o.lat),
      lngFinal: parseFloat(o.lng)
    }));

  const handleCambiarSucursal = (sucursalSeleccionada) => {
    setFiltroSucursal(sucursalSeleccionada);
    if (sucursalSeleccionada !== 'TODAS' && SUCURSAL_COORDS[sucursalSeleccionada]) {
      setOrdenVuelo({
        coords: SUCURSAL_COORDS[sucursalSeleccionada],
        zoom: 14
      });
    }
  };

  const handleCentrarMiGps = () => {
    if (tabletPos?.lat && tabletPos?.lng) {
      setOrdenVuelo({
        coords: [tabletPos.lat, tabletPos.lng],
        zoom: 16
      });
    }
  };

  const handleEnfocarGestores = () => {
    if (asesoresFiltrados.length > 0) {
      const primerGestor = asesoresFiltrados[0];
      setOrdenVuelo({
        coords: [parseFloat(primerGestor.lat), parseFloat(primerGestor.lng)],
        zoom: 14
      });
    } else if (asesoresEnVivo.length > 0) {
      const primerGestor = asesoresEnVivo[0];
      setOrdenVuelo({
        coords: [parseFloat(primerGestor.lat), parseFloat(primerGestor.lng)],
        zoom: 14
      });
    }
  };

  const resetVuelo = useCallback(() => {
    setOrdenVuelo(null);
  }, []);

  return (
    <div className="space-y-3 pb-28">
      
      {/* Barra Superior de Control */}
      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/70 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0091FB] flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <Radio className="w-4 h-4 text-[#0091FB] animate-pulse" />
            </div>
            <div>
              <p className="font-black text-[#001757] text-xs">Monitor Territorial en Tiempo Real</p>
              <p className="text-slate-400 text-[10px] font-bold">
                Gestores activos ahora: <strong className="text-[#0091FB]">{asesoresFiltrados.length}</strong> • Obras: <strong className="text-emerald-600">{obrasConCoordenadas.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {asesoresFiltrados.length > 0 && (
              <button
                type="button"
                onClick={handleEnfocarGestores}
                className="py-2 px-3 bg-gradient-to-r from-[#0091FB] to-[#007be0] text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" />
                <span>🎯 Enfocar Gestores</span>
              </button>
            )}

            <select
              value={filtroSucursal}
              onChange={(e) => handleCambiarSucursal(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200/80 bg-slate-50 text-xs font-black text-[#001757] outline-none flex-1 sm:flex-initial cursor-pointer">
              <option value="TODAS">Todas las Sucursales</option>
              {SUCURSALES.map(s => (
                <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles */}
        {!modoRutaFlotilla && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Ver:
            </span>

            <button
              type="button"
              onClick={() => setVerAsesores(!verAsesores)}
              className={`text-xs px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1 ${
                verAsesores ? 'bg-blue-50 text-[#001757] border border-blue-300 shadow-2xs' : 'bg-slate-100 text-slate-400 opacity-60'
              }`}>
              <span>🚗 Gestores en Vivo ({asesoresFiltrados.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setVerObras(!verObras)}
              className={`text-xs px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1 ${
                verObras ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs' : 'bg-slate-100 text-slate-400 opacity-60'
              }`}>
              <span>🏗️ Obras ({obrasConCoordenadas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setVerClientes(!verClientes)}
              className={`text-xs px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-1 ${
                verClientes ? 'bg-slate-100 text-[#001757] border border-slate-300 shadow-2xs' : 'bg-slate-100 text-slate-400 opacity-60'
              }`}>
              <span>🏢 Clientes ({clientesPorSucursal.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Contenedor del Mapa */}
      <div className="h-[68vh] w-full rounded-3xl overflow-hidden border border-slate-200/80 shadow-md relative">
        
        <button
          type="button"
          onClick={handleCentrarMiGps}
          className="absolute top-3.5 right-3.5 z-20 bg-white/95 backdrop-blur-md text-[#001757] hover:text-[#0091FB] font-black text-xs px-3 py-2 rounded-2xl shadow-lg border border-slate-200/90 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
          <Crosshair className="w-4 h-4 text-[#0091FB] shrink-0" />
          <span>Mi Ubicación</span>
        </button>

        <MapContainer 
          center={centroInicial} 
          zoom={12} 
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          style={{ height: '100%', width: '100%' }}>
          
          <TileLayer 
            attribution='&copy; OpenStreetMap' 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          
          <AccionesUsuarioEnMapa 
            vueloDestino={ordenVuelo} 
            onVueloCompletado={resetVuelo} 
          />

          {/* Círculo de tu GPS */}
          {tabletPos?.lat && tabletPos?.lng && (
            <Circle
              center={[tabletPos.lat, tabletPos.lng]}
              radius={tabletPos.accuracy || 15}
              pathOptions={{
                color: '#0091FB',
                fillColor: '#0091FB',
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: '3, 4'
              }}
            />
          )}

          {/* Marcador Único de Tu Terminal Actual */}
          {tabletPos?.lat && tabletPos?.lng && (
            <Marker position={[tabletPos.lat, tabletPos.lng]} icon={tuDispositivoIcon}>
              <Popup>
                <div className="text-xs font-bold text-slate-800">
                  <p className="text-[#0091FB] font-black">Tu Terminal Actual</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Precisión: ±{tabletPos.accuracy}m</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ASESORES ACTIVOS EN VIVO (SIN DUPLICADOS) */}
          {!modoRutaFlotilla && verAsesores && asesoresFiltrados.map((asesor) => (
            <Marker 
              key={`asesor-${asesor.usuario_id}`} 
              position={[parseFloat(asesor.lat), parseFloat(asesor.lng)]}
              icon={crearIconoAsesorEnVivo(asesor.nombre)}>
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[170px]">
                  <div>
                    <span className="font-mono text-[9px] font-black bg-blue-50 text-[#001757] px-2 py-0.5 rounded border border-blue-200 uppercase">
                      {asesor.sucursal || 'CAMPO'}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm leading-tight mt-1 truncate">
                      {asesor.nombre}
                    </h4>
                    <p className="text-[10px] text-[#0091FB] font-bold mt-0.5 flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{calcularTiempoTranscurrido(asesor.updated_at)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Precisión GPS: ±{asesor.accuracy || 10}m</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAbrirRuta({
                      nombre: `Gestor: ${asesor.nombre}`,
                      direccion: `Sucursal ${asesor.sucursal}`,
                      lat: parseFloat(asesor.lat),
                      lng: parseFloat(asesor.lng)
                    })}
                    className="w-full py-1.5 px-2 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors">
                    <Navigation className="w-3 h-3 text-[#0091FB]" />
                    <span>Navegar hacia él</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Pines de Obras */}
          {!modoRutaFlotilla && verObras && obrasConCoordenadas.map(obra => (
            <Marker key={`obra-${obra.id}`} position={[obra.latFinal, obra.lngFinal]} icon={obraIcon}>
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[170px]">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {obra.id}
                    </span>
                    <h4 className="font-black text-slate-900 text-xs leading-tight mt-1 truncate">{obra.nombre}</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {obra.sucursal} • {obra.estatusFase}
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => onAbrirRuta({
                      nombre: obra.nombre,
                      direccion: obra.direccion || `Obra ${obra.id}`,
                      lat: obra.latFinal,
                      lng: obra.lngFinal
                    })}
                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors">
                    <Navigation className="w-3 h-3" /> Iniciar Ruta GPS
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Pines de Clientes */}
          {!modoRutaFlotilla && verClientes && clientesPorSucursal.filter(c => c.lat && c.lng).map(c => (
            <Marker key={`cliente-${c.id}`} position={[parseFloat(c.lat), parseFloat(c.lng)]} icon={clienteIcon}>
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[170px]">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#001757] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {c.id}
                    </span>
                    <h4 className="font-black text-slate-900 text-xs leading-tight mt-1 truncate">{c.nombreCliente}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{c.direccion || 'Domicilio fiscal'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAbrirRuta({
                      nombre: c.nombreCliente,
                      direccion: c.direccion,
                      lat: parseFloat(c.lat),
                      lng: parseFloat(c.lng)
                    })}
                    className="w-full py-1.5 px-2 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors">
                    <Navigation className="w-3 h-3 text-[#0091FB]" /> Iniciar Ruta GPS
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>

      </div>

    </div>
  );
}