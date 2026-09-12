// src/components/MapaTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Radio, Layers, Crosshair } from 'lucide-react';
import { SUCURSALES } from '../data/constants';

const SUCURSAL_COORDS = {
  'ALTOZANO': [19.6642, -101.1718],
  'LA MIRA': [18.0333, -102.3167],
  'LÁZARO': [17.9583, -102.2000],
  'PÁTZCUARO': [19.5139, -101.6094],
  'PERIFERICO': [19.7000, -101.1900],
  'SAN MIGUEL': [20.9144, -100.7452],
  'URIANGATO': [20.1417, -101.1764],
  'VILLADIEGO': [20.4000, -101.5000],
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
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: #0091FB; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="background-color: #0091FB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// CONTROLADOR PASIVO: Únicamente ejecuta acciones cuando tú presionas un botón
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
  setFiltroSucursal 
}) {
  const [verObras, setVerObras] = useState(true);
  const [verClientes, setVerClientes] = useState(true);
  const [ordenVuelo, setOrdenVuelo] = useState(null);

  const centroInicial = [tabletPos?.lat || 19.6642, tabletPos?.lng || -101.1718];

  const obrasPorSucursal = obras.filter(o => filtroSucursal === 'TODAS' || o.sucursal === filtroSucursal);
  const clientesPorSucursal = clientes.filter(c => filtroSucursal === 'TODAS' || c.sucursal === filtroSucursal);

  // Obras reales georreferenciadas (incluso si no tienen visitas aún)
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
        zoom: 13
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

  const resetVuelo = useCallback(() => {
    setOrdenVuelo(null);
  }, []);

  return (
    <div className="space-y-2.5 pb-24">
      
      {/* BARRA SUPERIOR DE CONTROL */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0091FB] flex items-center justify-center">
              <Radio className="w-4 h-4 text-[#0091FB] animate-pulse" />
            </div>
            <div>
              <p className="font-black text-[#001757] text-xs">Monitor Territorial de Obras</p>
              <p className="text-slate-400 text-[10px] font-semibold">
                Obras: <strong className="text-emerald-600">{obrasConCoordenadas.length}</strong> • Clientes: <strong className="text-[#001757]">{clientesPorSucursal.length}</strong>
              </p>
            </div>
          </div>

          <select
            value={filtroSucursal}
            onChange={(e) => handleCambiarSucursal(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-[#001757] outline-none">
            <option value="TODAS">Todas las Sucursales ({SUCURSALES.length})</option>
            {SUCURSALES.map(s => (
              <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Ver:
          </span>

          <button
            type="button"
            onClick={() => setVerObras(!verObras)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
              verObras ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 opacity-60'
            }`}>
            🏗️ Obras ({obrasConCoordenadas.length})
          </button>

          <button
            type="button"
            onClick={() => setVerClientes(!verClientes)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
              verClientes ? 'bg-blue-50 text-[#001757] border border-blue-200' : 'bg-slate-100 text-slate-400 opacity-60'
            }`}>
            🏢 Clientes ({clientesPorSucursal.length})
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA */}
      <div className="h-[68vh] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
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

          {/* Círculo de precisión GPS */}
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

          {/* Tu ubicación */}
          {tabletPos?.lat && tabletPos?.lng && (
            <Marker position={[tabletPos.lat, tabletPos.lng]} icon={tuDispositivoIcon}>
              <Popup>
                <div className="text-xs font-bold text-slate-800">
                  <p className="text-[#0091FB] font-black">Tu Ubicación Actual</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Precisión GPS: ±{tabletPos.accuracy}m</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* PINES DE OBRAS (Ahora muestra todas las obras) */}
          {verObras && obrasConCoordenadas.map(obra => (
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
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {obra.direccion || 'Ubicación satelital'}
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

          {/* PINES DE CLIENTES */}
          {verClientes && clientesPorSucursal.filter(c => c.lat && c.lng).map(c => (
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

        {/* BOTÓN FLOTANTE MI UBICACIÓN */}
        <button
          type="button"
          onClick={handleCentrarMiGps}
          className="absolute bottom-4 right-4 z-[400] bg-white text-[#001757] hover:text-[#0091FB] font-black text-xs px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-1.5 active:scale-95 transition-all">
          <Crosshair className="w-4 h-4 text-[#0091FB]" />
          <span>Mi Ubicación</span>
        </button>
      </div>

    </div>
  );
}