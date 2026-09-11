// src/components/MapaTab.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Building2, User, Radio, Eye, Layers } from 'lucide-react';
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

// 1. PIN DE OBRAS (Icono de Construcción Verde)
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

// 2. PIN DE CLIENTES (Icono de Empresa Morado)
const clienteIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); display: flex; flex-direction: column; align-items: center; width: 30px; height: 38px;">
      <div style="background-color: #8B5CF6; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; display: flex; align-items: center; justify-content: center;">
        <span style="transform: rotate(45deg); font-size: 13px;">🏢</span>
      </div>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38]
});

// 3. PIN DE TU DISPOSITIVO (Azul)
const tuDispositivoIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div style="background-color: #0066FF; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="width: 7px; height: 7px; background: white; border-radius: 50%;"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// 4. PIN DE ASESOR EN VIVO (Con Pulso)
const asesorIcon = (iniciales) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: #2563EB; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #2563EB; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; font-family: monospace;">
        ${iniciales}
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

function PanToBranch({ filtroSucursal, tabletPos }) {
  const map = useMap();
  useEffect(() => {
    if (filtroSucursal !== 'TODAS' && SUCURSAL_COORDS[filtroSucursal]) {
      map.flyTo(SUCURSAL_COORDS[filtroSucursal], 13, { duration: 1.2 });
    } else {
      map.flyTo([tabletPos.lat, tabletPos.lng], 11, { duration: 1 });
    }
  }, [filtroSucursal, map, tabletPos]);
  return null;
}

// Rescate inteligente de coordenadas de obras
const resolverCoordenadasVisita = (v, clientes) => {
  let lat = v.lat ? parseFloat(v.lat) : null;
  let lng = v.lng ? parseFloat(v.lng) : null;

  // Si no tiene lat/lng, extraer de la URL de Google Maps
  if ((!lat || !lng) && v.ubicacion) {
    const match = v.ubicacion.match(/q=([-\d.]+),([-\d.]+)/);
    if (match) {
      lat = parseFloat(match[1]);
      lng = parseFloat(match[2]);
    }
  }

  // Si aún no tiene, heredar de su cliente vinculado
  if ((!lat || !lng) && v.clienteId && clientes) {
    const c = clientes.find(item => item.id === v.clienteId);
    if (c && c.lat && c.lng) {
      lat = parseFloat(c.lat);
      lng = parseFloat(c.lng);
    }
  }

  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  return null;
};

export default function MapaTab({ tabletPos, visitas, clientes, onAbrirRuta, filtroSucursal, setFiltroSucursal, asesoresEnVivo = [] }) {
  // Capas activas (para prender o apagar Obras, Clientes o Asesores)
  const [verObras, setVerObras] = useState(true);
  const [verClientes, setVerClientes] = useState(true);
  const [verAsesores, setVerAsesores] = useState(true);

  // Filtrado por sucursal
  const visitasPorSucursal = visitas.filter(v => 
    filtroSucursal === 'TODAS' || v.sucursal === filtroSucursal
  );
  
  const clientesPorSucursal = clientes.filter(c => 
    filtroSucursal === 'TODAS' || c.sucursal === filtroSucursal
  );

  const asesoresFiltrados = asesoresEnVivo.filter(a =>
    filtroSucursal === 'TODAS' || a.sucursal === filtroSucursal
  );

  // Procesar obras con coordenadas válidas y evitar solapamiento con clientes
  const obrasGeorreferenciadas = visitasPorSucursal.map(v => {
    const coords = resolverCoordenadasVisita(v, clientes);
    if (!coords) return null;

    // Si coincide exactamente con la coordenada de un cliente, desplazarla ~15m para que ambos pines se vean
    const coincideConCliente = clientesPorSucursal.some(
      c => c.lat && c.lng && Math.abs(parseFloat(c.lat) - coords.lat) < 0.0001 && Math.abs(parseFloat(c.lng) - coords.lng) < 0.0001
    );

    return {
      ...v,
      latFinal: coincideConCliente ? coords.lat + 0.00015 : coords.lat,
      lngFinal: coincideConCliente ? coords.lng + 0.00015 : coords.lng
    };
  }).filter(Boolean);

  return (
    <div className="space-y-3">
      
      {/* Barra de Control de Dirección y Filtros */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">Monitor Satelital de Obras y Flota</p>
              <p className="text-slate-500 text-[10px]">
                Obras geolocalizadas: <strong className="text-emerald-600">{obrasGeorreferenciadas.length}</strong> • Clientes: <strong className="text-purple-600">{clientesPorSucursal.length}</strong>
              </p>
            </div>
          </div>

          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/50 text-xs font-bold text-blue-900 outline-none">
            <option value="TODAS">Todas las Sucursales ({SUCURSALES.length})</option>
            {SUCURSALES.map(s => (
              <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>
            ))}
          </select>
        </div>

        {/* Interruptores de Capas para alternar la vista */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Capas:
          </span>

          <button
            type="button"
            onClick={() => setVerObras(!verObras)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              verObras 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
            }`}>
            <span>🏗️ Obras ({obrasGeorreferenciadas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVerClientes(!verClientes)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              verClientes 
                ? 'bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
            }`}>
            <span>🏢 Clientes ({clientesPorSucursal.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVerAsesores(!verAsesores)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              verAsesores 
                ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
            }`}>
            <span>👤 Asesores en Vivo ({asesoresFiltrados.length})</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa Satelital */}
      <div className="h-[70vh] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer center={[tabletPos.lat, tabletPos.lng]} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <PanToBranch filtroSucursal={filtroSucursal} tabletPos={tabletPos} />

          {/* Círculo de Precisión de tu dispositivo */}
          <Circle
            center={[tabletPos.lat, tabletPos.lng]}
            radius={tabletPos.accuracy || 15}
            pathOptions={{
              color: '#0066FF',
              fillColor: '#0066FF',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '3, 4'
            }}
          />

          {/* Pin de tu tablet */}
          <Marker position={[tabletPos.lat, tabletPos.lng]} icon={tuDispositivoIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-blue-600 block">Tu Dispositivo</strong>
                <span>Precisión GPS: ±{tabletPos.accuracy}m</span>
              </div>
            </Popup>
          </Marker>

          {/* PINES DE OBRAS (Icono 🏗️ Verde) */}
          {verObras && obrasGeorreferenciadas.map(v => (
            <Marker key={`obra-${v.id}`} position={[v.latFinal, v.lngFinal]} icon={obraIcon}>
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[170px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-emerald-700">{v.id}</span>
                      <span className="text-[9px] bg-emerald-100 px-1.5 py-0.2 rounded font-bold text-emerald-800">{v.sucursal}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs leading-tight mt-0.5">{v.proyecto}</h4>
                    <p className="text-[11px] text-emerald-700 font-bold">{v.estatus}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{v.actividad}</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => onAbrirRuta({
                      nombre: v.proyecto,
                      direccion: v.direccionObra || `Folio ${v.id}`,
                      lat: v.latFinal,
                      lng: v.lngFinal
                    })}
                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors">
                    <Navigation className="w-3 h-3" /> ¿Cómo llegar?
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* PINES DE CLIENTES (Icono 🏢 Morado) */}
          {verClientes && clientesPorSucursal.filter(c => c.lat && c.lng).map(c => (
            <Marker key={`cliente-${c.id}`} position={[parseFloat(c.lat), parseFloat(c.lng)]} icon={clienteIcon}>
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[170px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-purple-600">{c.id}</span>
                      <span className="text-[9px] bg-purple-100 px-1.5 py-0.2 rounded font-bold text-purple-800">{c.sucursal}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs leading-tight mt-0.5">{c.nombreCliente}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{c.direccion}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAbrirRuta({
                      nombre: c.nombreCliente,
                      direccion: c.direccion,
                      lat: parseFloat(c.lat),
                      lng: parseFloat(c.lng)
                    })}
                    className="w-full py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors">
                    <Navigation className="w-3 h-3" /> ¿Cómo llegar?
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* PINES DE ASESORES EN VIVO (Icono 👤 Azul) */}
          {verAsesores && asesoresFiltrados.map(asesor => (
            <Marker 
              key={`asesor-${asesor.usuario_id}`} 
              position={[asesor.lat, asesor.lng]} 
              icon={asesorIcon(asesor.nombre.substring(0, 2))}>
              <Popup>
                <div className="text-xs space-y-1 min-w-[160px]">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{asesor.nombre}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold">Sucursal: {asesor.sucursal}</p>
                  <p className="text-[10px] text-blue-700 font-mono">
                    Precisión GPS: ±{Math.round(asesor.accuracy)}m
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Última señal: {new Date(asesor.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </div>
    </div>
  );
}