import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Crosshair, Check, MapPin, Loader2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Pin vectorial SVG milimétricamente anclado en la punta inferior [18, 46]
const pinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div style="filter: drop-shadow(0 6px 10px rgba(0,0,0,0.35)); display: flex; justify-content: center; align-items: center; width: 36px; height: 46px;">
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.059 0 0 8.059 0 18C0 30.5 18 46 18 46C18 46 36 30.5 36 18C36 8.059 27.941 0 18 0Z" fill="#EF4444"/>
        <path d="M18 2C9.163 2 2 9.163 2 18C2 28.5 18 42.5 18 42.5C18 42.5 34 28.5 34 18C34 9.163 26.837 2 18 2Z" fill="#DC2626"/>
        <circle cx="18" cy="18" r="6.5" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [36, 46],
  iconAnchor: [18, 46]
});

// Forzar cálculo de dimensiones en pantalla y animar cámara
function MapController({ targetPos }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (targetPos && targetPos.lat) {
      map.flyTo([targetPos.lat, targetPos.lng], 16, { duration: 0.8 });
    }
  }, [targetPos, map]);

  return null;
}

// Escuchar toques en el mapa
function ClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

export default function ModalMapaPicker({ isOpen, onClose, initialPos, onConfirm, tabletPos }) {
  const [pos, setPos] = useState(initialPos || { lat: 19.6642, lng: -101.1718 });
  const [panTarget, setPanTarget] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [direccionTexto, setDireccionTexto] = useState('');
  const debounceRef = useRef(null);

  // Definida al inicio para evitar ReferenceError
  const obtenerNombreDireccion = useCallback(async (coords) => {
    if (!coords || !coords.lat) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setDireccionTexto(data.display_name);
      }
    } catch {
      // Silencioso
    }
  }, []);

  // Sincronizar posición inicial
  useEffect(() => {
    if (isOpen && initialPos && initialPos.lat) {
      setPos(initialPos);
      setPanTarget(initialPos);
      obtenerNombreDireccion(initialPos);
    }
  }, [isOpen, initialPos, obtenerNombreDireccion]);

  // Buscador con sugerencias mientras escribes
  const handleInputChange = (e) => {
    const query = e.target.value;
    setBusqueda(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSugerencias([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const refLat = tabletPos?.lat || 19.6642;
        const refLng = tabletPos?.lng || -101.1718;

        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${refLat}&lon=${refLng}&limit=5`
        );
        const data = await res.json();

        if (data && data.features) {
          const items = data.features.map(f => {
            const props = f.properties;
            const partes = [props.street, props.name, props.district, props.city, props.state]
              .filter(Boolean)
              .filter((val, idx, arr) => arr.indexOf(val) === idx);

            return {
              nombre: props.name || props.street || 'Ubicación',
              descripcion: partes.join(', '),
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0]
            };
          });
          setSugerencias(items);
        }
      } catch (err) {
        console.error('Error buscando direcciones:', err);
      } finally {
        setCargando(false);
      }
    }, 350);
  };

  const seleccionarSugerencia = (sug) => {
    const nuevaPos = { lat: sug.lat, lng: sug.lng };
    setPos(nuevaPos);
    setPanTarget(nuevaPos);
    setDireccionTexto(sug.descripcion);
    setBusqueda(sug.nombre);
    setSugerencias([]);
  };

  const handleMapClick = (nuevaPos) => {
    setPos(nuevaPos);
    obtenerNombreDireccion(nuevaPos);
  };

  const handleConfirmar = () => {
    onConfirm({
      lat: pos.lat,
      lng: pos.lng,
      direccion: direccionTexto || busqueda
    });
    onClose();
  };

  // Retorno condicional justo antes del JSX
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Cabecera */}
        <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" /> Fijar Ubicación de la Obra / Cliente
            </h3>
            <p className="text-[11px] text-slate-500">Busca la calle o toca el mapa para colocar el pin</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador inteligente */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 relative shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={handleInputChange}
                placeholder="Escribe calle, colonia o ciudad..."
                className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 font-medium outline-none focus:border-blue-500 shadow-xs"
              />
              {cargando && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 text-blue-500 animate-spin" />
              )}
              {busqueda && !cargando && (
                <button 
                  type="button"
                  onClick={() => { setBusqueda(''); setSugerencias([]); }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const gps = { lat: tabletPos.lat, lng: tabletPos.lng };
                setPos(gps);
                setPanTarget(gps);
                obtenerNombreDireccion(gps);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Mi GPS</span>
            </button>
          </div>

          {/* Sugerencias estilo Google Maps */}
          {sugerencias.length > 0 && (
            <div className="absolute left-3 right-3 top-14 bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100 z-50 max-h-56 overflow-y-auto">
              {sugerencias.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => seleccionarSugerencia(sug)}
                  className="w-full p-3 text-left hover:bg-blue-50 flex items-start gap-2.5 transition-colors">
                  <Navigation className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{sug.nombre}</p>
                    <p className="text-[11px] text-slate-500 truncate">{sug.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mapa Satelital */}
        <div className="flex-1 w-full h-full relative">
          <MapContainer 
            center={[pos.lat, pos.lng]} 
            zoom={16} 
            style={{ height: '100%', width: '100%' }}>
            
            <TileLayer 
              attribution='&copy; OpenStreetMap' 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            
            <MapController targetPos={panTarget} />
            <ClickListener onMapClick={handleMapClick} />
            
            <Marker 
              position={[pos.lat, pos.lng]} 
              icon={pinIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target.getLatLng();
                  const nuevaPos = { lat: m.lat, lng: m.lng };
                  setPos(nuevaPos);
                  obtenerNombreDireccion(nuevaPos);
                }
              }}
            />
          </MapContainer>
        </div>

        {/* Barra inferior */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 w-full sm:w-auto">
            <p className="text-xs font-bold text-slate-900 truncate">
              {direccionTexto || 'Punto fijado en el mapa'}
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmar}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all">
            <Check className="w-4 h-4 stroke-[3]" /> Confirmar Esta Ubicación
          </button>
        </div>

      </div>
    </div>
  );
}