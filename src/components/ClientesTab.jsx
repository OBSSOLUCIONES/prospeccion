// src/components/ClientesTab.jsx
import React, { useState } from 'react';
import { 
  UserPlus, Phone, MapPin, Navigation, Pencil, Trash2, 
  Search, MessageCircle, Building2, User
} from 'lucide-react';

export default function ClientesTab({ 
  clientes = [], 
  onNuevoCliente, 
  onEditarCliente, 
  onEliminarCliente, 
  onAbrirRuta,
  esDirector = false,
  filtroSucursal = 'TODAS'
}) {
  const [busqueda, setBusqueda] = useState('');

  const clientesFiltrados = clientes
    .filter(cli => filtroSucursal === 'TODAS' || cli.sucursal === filtroSucursal)
    .filter(cli => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        (cli.nombreCliente && cli.nombreCliente.toLowerCase().includes(q)) ||
        (cli.responsable && cli.responsable.toLowerCase().includes(q)) ||
        (cli.id && cli.id.toLowerCase().includes(q)) ||
        (cli.idRedAzul && cli.idRedAzul.toLowerCase().includes(q)) ||
        (cli.tipoCliente && cli.tipoCliente.toLowerCase().includes(q)) ||
        (cli.direccion && cli.direccion.toLowerCase().includes(q))
      );
    });

  const limpiarTelefono = (tel) => (tel ? String(tel).replace(/\D/g, '') : '');

  const abrirWhatsAppCliente = (tel, nombre, responsable, sucursal) => {
    const numeroLimpio = limpiarTelefono(tel);
    if (!numeroLimpio) return;
    const nombreContacto = responsable ? ` ${responsable}` : '';
    const textoSucursal = sucursal ? ` OBS ${sucursal}` : ' OBS';
    const mensaje = encodeURIComponent(`Hola${nombreContacto}, te contacto de${textoSucursal} respecto a ${nombre}.`);
    const telFinal = numeroLimpio.length === 10 ? `52${numeroLimpio}` : numeroLimpio;
    window.open(`https://wa.me/${telFinal}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="space-y-3.5 pb-28">
      
      {/* Buscador con Lupa Centrada Matemáticamente y Alta Rápida */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="relative flex-1">
          {/* Contenedor que centra la lupa en el medio vertical exacto */}
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>

          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente, responsable o teléfono..."
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-slate-300/80 bg-white text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#0091FB] focus:ring-2 focus:ring-[#0091FB]/15 shadow-sm transition-all"
          />
        </div>

        {!esDirector && (
          <button
            type="button"
            onClick={onNuevoCliente}
            className="min-h-[44px] px-4 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black shadow-sm flex items-center gap-1.5 shrink-0 transition-all">
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Cliente</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-1 text-[11px] sm:text-xs font-extrabold text-slate-500">
        <span>{clientesFiltrados.length} clientes {filtroSucursal !== 'TODAS' ? `en ${filtroSucursal}` : 'totales'}</span>
        {filtroSucursal !== 'TODAS' && (
          <span className="font-black text-[#001757] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            {filtroSucursal}
          </span>
        )}
      </div>

      {/* Grid de Clientes Adaptativo */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200/80 text-center space-y-2.5 shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-black text-slate-800">No encontramos ningún cliente</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filtroSucursal !== 'TODAS' 
              ? `No hay clientes registrados en la sucursal ${filtroSucursal}.` 
              : 'Intenta con otra palabra o registra uno nuevo con el botón superior.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {clientesFiltrados.map(cli => {
            const telLimpio = limpiarTelefono(cli.contacto);
            const tieneTelefono = Boolean(telLimpio && telLimpio.length >= 7);

            return (
              <div 
                key={cli.id} 
                onClick={() => onEditarCliente(cli)}
                className="w-full bg-white hover:border-[#0091FB] active:scale-[0.99] cursor-pointer rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all duration-150 space-y-2.5">
                
                {/* Línea 1: ID + Nombre + Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] shrink-0 border border-slate-200">
                      {cli.id}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-[#001757] tracking-tight truncate leading-snug">
                      {cli.nombreCliente}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] font-black bg-blue-50 text-[#001757] border border-blue-200 px-1.5 py-0.5 rounded-md">
                      {cli.sucursal}
                    </span>
                    <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                      {cli.tipoCliente}
                    </span>
                  </div>
                </div>

                {/* Línea 2: Responsable y Dirección */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <p className="truncate font-bold flex items-center gap-1.5 text-xs text-slate-700">
                    <User className="w-3.5 h-3.5 text-[#0091FB] shrink-0" />
                    <span className="truncate">{cli.responsable || 'Sin encargado'}</span>
                  </p>

                  <p className="text-[11px] text-slate-400 font-semibold truncate flex items-center gap-1 shrink-0 max-w-[150px]">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">{cli.direccion || 'Sin dirección'}</span>
                  </p>
                </div>

                {/* Línea 3: Acciones */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {tieneTelefono ? (
                      <>
                        <a 
                          href={`tel:${telLimpio}`}
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[36px] px-3 bg-blue-50 hover:bg-blue-100 text-[#001757] font-black text-xs rounded-xl border border-blue-200 flex items-center gap-1 transition-all active:scale-95"
                          title="Llamar">
                          <Phone className="w-3.5 h-3.5 text-[#0091FB]" />
                          <span>Llamar</span>
                        </a>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirWhatsAppCliente(cli.contacto, cli.nombreCliente, cli.responsable, cli.sucursal);
                          }}
                          className="min-h-[36px] px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl border border-emerald-200 flex items-center gap-1 transition-all active:scale-95"
                          title="WhatsApp">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic font-semibold">Sin teléfono</span>
                    )}

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrirRuta({
                          nombre: cli.nombreCliente,
                          direccion: cli.direccion,
                          lat: cli.lat,
                          lng: cli.lng
                        });
                      }}
                      className="min-h-[36px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95">
                      <Navigation className="w-3.5 h-3.5 text-[#0091FB]" />
                      <span>Ruta</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditarCliente(cli);
                      }}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-[#0091FB] hover:bg-blue-50 flex items-center justify-center transition-colors active:scale-90"
                      title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarCliente(cli);
                      }}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors active:scale-90"
                      title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}