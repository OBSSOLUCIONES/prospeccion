// src/components/MapaTab.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Radio, Layers, Crosshair, FileText, User } from 'lucide-react';
import { SUCURSALES, CAT_TIPOS_OBRA } from '../data/constants';

// COORDENADAS EXACTAS DE CADA SUCURSAL
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

const normalizarTexto = (txt) =>
  String(txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const coincideSucursal = (itemSucursal, filtro) => {
  if (!filtro || filtro === 'TODAS') return true;
  return normalizarTexto(itemSucursal) === normalizarTexto(filtro);
};

const crearIconoObraDinamico = (tipoObraId) => {
  const tipoEncontrado = CAT_TIPOS_OBRA.find(t => t.id === tipoObraId) || CAT_TIPOS_OBRA[0];
  const color = tipoEncontrado?.color || '#10B981';
  const icono = tipoEncontrado?.icono || '🏗️';

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35)); display: flex; flex-direction: column; align-items: center; width: 34px; height: 42px;">
        <div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
          <span style="transform: rotate(45deg); font-size: 15px; line-height: 1;">${icono}</span>
        </div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38]
  });
};

const clienteIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="filter: drop-shadow(0 4px 10px rgba(0,23,87,0.4)); display: flex; flex-direction: column; align-items: center; width: 34px; height: 42px;">
      <div style="background: linear-gradient(135deg, #001757 0%, #002b80 100%); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; display: flex; align-items: center; justify-content: center;">
        <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">👤</span>
      </div>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -38]
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

// CONTROLADOR DE VUELO Y REDIMENSIÓN DE LEAFLET
function AccionesUsuarioEnMapa({ vueloDestino, onVueloCompletado }) {
  const map = useMap();

  // Forzar a Leaflet a adaptarse a las dimensiones exactas sin cortes
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (vueloDestino) {
      map.flyTo(vueloDestino.coords, vueloDestino.zoom || 14, { duration: 1.4 });
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
  onSeleccionarObra,
  onSeleccionarCliente,
  filtroSucursal, 
  asesoresEnVivo = [],
  usuarioActivo,
  deviceId
}) {
  const [verObras, setVerObras] = useState(true);
  const [verClientes, setVerClientes] = useState(true);
  const [verAsesores, setVerAsesores] = useState(true);
  const [ordenVuelo, setOrdenVuelo] = useState(null);

  const centroInicial = [tabletPos?.lat || 19.6642, tabletPos?.lng || -101.1718];

  const obrasPorSucursal = obras.filter(o => coincideSucursal(o.sucursal, filtroSucursal));
  const clientesPorSucursal = clientes.filter(c => coincideSucursal(c.sucursal, filtroSucursal));

  // VUELO AUTOMÁTICO AL CAMBIAR DE SUCURSAL
  useEffect(() => {
    if (!filtroSucursal) return;

    if (filtroSucursal === 'TODAS') {
      setOrdenVuelo({
        coords: [19.6642, -101.1718],
        zoom: 8
      });
    } else {
      const sucursalBuscada = normalizarTexto(filtroSucursal);
      const claveEncontrada = Object.keys(SUCURSAL_COORDS).find(
        k => normalizarTexto(k) === sucursalBuscada
      );

      if (claveEncontrada && SUCURSAL_COORDS[claveEncontrada]) {
        setOrdenVuelo({
          coords: SUCURSAL_COORDS[claveEncontrada],
          zoom: 14
        });
      }
    }
  }, [filtroSucursal]);

  const asesoresFiltrados = useMemo(() => {
    const ahora = Date.now();
    const LIMITE_ACTIVO_MS = 4 * 60 * 60 * 1000;

    const activos = asesoresEnVivo
      .filter(a => a.lat && a.lng)
      .filter(a => {
        if (!a.updated_at) return true;
        return (ahora - new Date(a.updated_at).getTime()) < LIMITE_ACTIVO_MS;
      })
      .filter(a => coincideSucursal(a.sucursal, filtroSucursal))
      .filter(a => a.usuario_id !== usuarioActivo?.id)
      .filter(a => !deviceId || !a.device_id || a.device_id !== deviceId);

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
    // CONTENEDOR AJUSTADO AL 100% DE LA PANTALLA LIBRE (SIN TOCAR EL BOTTOM NAV)
    <div className="flex flex-col h-[calc(100dvh-136px-env(safe-area-inset-bottom,0px))] sm:h-[calc(100dvh-150px)] w-full gap-2 overflow-hidden">
      
      {/* Barra de Control Compacta */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0091FB] flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-[#0091FB] animate-pulse" />
            </div>
            <div>
              <p className="font-black text-[#001757] text-xs leading-none">Monitor Territorial</p>
              <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                Obras: <strong className="text-emerald-600">{obrasConCoordenadas.length}</strong> • Clientes: <strong className="text-[#001757]">{clientesPorSucursal.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-black bg-blue-50 text-[#001757] border border-blue-200 px-2.5 py-1 rounded-xl shadow-2xs">
              {filtroSucursal === 'TODAS' ? '🌍 TODAS' : `📍 ${filtroSucursal}`}
            </span>
          </div>
        </div>

        {/* Toggles de Capas */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3" /> Ver:
          </span>

          <button
            type="button"
            onClick={() => setVerAsesores(!verAsesores)}
            className={`text-[11px] px-2.5 py-1 rounded-xl font-black transition-all whitespace-nowrap ${
              verAsesores ? 'bg-blue-50 text-[#001757] border border-blue-300 shadow-2xs' : 'bg-slate-100 text-slate-400 opacity-60'
            }`}>
            <span>🚗 Gestores ({asesoresFiltrados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVerObras(!verObras)}
            className={`text-[11px] px-2.5 py-1 rounded-xl font-black transition-all whitespace-nowrap ${
              verObras ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs' : 'bg-slate-100 text-slate-400 opacity-60'
            }`}>
            <span>🏗️ Obras ({obrasConCoordenadas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setVerClientes(!verClientes)}
            className={`text-[11px] px-2.5 py-1 rounded-xl font-black transition-all whitespace-nowrap ${
              verClientes ? 'bg-slate-100 text-[#001757] border border-slate-300 shadow-2xs' : 'bg-slate-100 text-slate-400 opacity-60'
            }`}>
            <span>👤 Clientes ({clientesPorSucursal.length})</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA FLUIDO (SE ADAPTA AUTOMÁTICAMENTE Y NUNCA INVADE EL NAV) */}
      <div className="flex-1 w-full min-h-0 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md relative">
        
        <button
          type="button"
          onClick={handleCentrarMiGps}
          className="absolute top-3.5 right-3.5 z-[500] bg-white/95 backdrop-blur-md text-[#001757] hover:text-[#0091FB] font-black text-xs px-3 py-1.5 rounded-2xl shadow-lg border border-slate-200/90 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
          <Crosshair className="w-3.5 h-3.5 text-[#0091FB] shrink-0" />
          <span>Mi GPS</span>
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

          {/* ASESORES EN VIVO */}
          {verAsesores && asesoresFiltrados.map((asesor) => (
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

          {/* OBRAS */}
          {verObras && obrasConCoordenadas.map(obra => {
            const tipoInfo = CAT_TIPOS_OBRA.find(t => t.id === obra.tipoObra) || CAT_TIPOS_OBRA[0];

            return (
              <Marker 
                key={`obra-${obra.id}`} 
                position={[obra.latFinal, obra.lngFinal]} 
                icon={crearIconoObraDinamico(obra.tipoObra)}>
                <Popup>
                  <div className="text-xs space-y-2 min-w-[210px] p-0.5">
                    <div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {obra.id}
                        </span>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                          {tipoInfo.icono} {tipoInfo.label.split('/')[0]}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-sm leading-tight mt-1.5 truncate">
                        {obra.nombre}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {obra.sucursal} • Etapa: <strong className="text-[#001757]">{obra.etapaComercial || 'PROSPECTO'}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Fase: {obra.estatusFase}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onSeleccionarObra && onSeleccionarObra(obra)}
                        className="w-full py-2 px-2.5 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all">
                        <FileText className="w-3.5 h-3.5 text-[#0091FB]" />
                        <span>Ver Expediente Completo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAbrirRuta({
                          nombre: obra.nombre,
                          direccion: obra.direccion || `Obra ${obra.id}`,
                          lat: obra.latFinal,
                          lng: obra.lngFinal
                        })}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-colors">
                        <Navigation className="w-3 h-3" />
                        <span>Iniciar Ruta GPS</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* CLIENTES */}
          {verClientes && clientesPorSucursal.filter(c => c.lat && c.lng).map(c => (
            <Marker key={`cliente-${c.id}`} position={[parseFloat(c.lat), parseFloat(c.lng)]} icon={clienteIcon}>
              <Popup>
                <div className="text-xs space-y-2 min-w-[210px] p-0.5">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#001757] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {c.id}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm leading-tight mt-1 truncate">{c.nombreCliente}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      Oficio: <strong>{c.tipoMercado || 'CLIENTE FINAL'}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Encargado: {c.responsable || 'Sin asignar'}
                    </p>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onSeleccionarCliente && onSeleccionarCliente(c)}
                      className="w-full py-2 px-2.5 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all">
                      <User className="w-3.5 h-3.5 text-[#0091FB]" />
                      <span>Ver Ficha del Cliente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAbrirRuta({
                        nombre: c.nombreCliente,
                        direccion: c.direccion,
                        lat: parseFloat(c.lat),
                        lng: parseFloat(c.lng)
                      })}
                      className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-colors">
                      <Navigation className="w-3 h-3" />
                      <span>Iniciar Ruta GPS</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>

      </div>

    </div>
  );
}