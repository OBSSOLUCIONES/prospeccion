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

  const limpiarTelefono = (tel) => (tel ? tel.replace(/\D/g, '') : '');

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
    <div className="space-y-3 pb-28">
      
      {/* Buscador y Alta Rápida */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente, responsable o teléfono..."
            className="w-full h-10.5 pl-10 pr-3 rounded-2xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#0091FB] focus:ring-2 focus:ring-[#0091FB]/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all"
          />
        </div>

        {!esDirector && (
          <button
            type="button"
            onClick={onNuevoCliente}
            className="h-10.5 px-4 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white rounded-2xl text-xs font-black shadow-sm shadow-[#001757]/20 flex items-center gap-1.5 shrink-0 transition-all">
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Cliente</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400">
        <span>{clientesFiltrados.length} clientes {filtroSucursal !== 'TODAS' ? `en ${filtroSucursal}` : 'totales'}</span>
        {filtroSucursal !== 'TODAS' && (
          <span className="font-extrabold text-[#001757] bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded-md">
            {filtroSucursal}
          </span>
        )}
      </div>

      {/* Grid de Clientes Estilo Alta Gama */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200/70 text-center space-y-2 shadow-sm">
          <Building2 className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-xs font-black text-slate-800">No encontramos ningún cliente</p>
          <p className="text-[11px] text-slate-400">
            {filtroSucursal !== 'TODAS' 
              ? `No hay clientes registrados en la sucursal ${filtroSucursal}.` 
              : 'Intenta con otra palabra o registra uno nuevo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {clientesFiltrados.map(cli => {
            const telLimpio = limpiarTelefono(cli.contacto);
            const tieneTelefono = Boolean(telLimpio && telLimpio.length >= 7);

            return (
              <div 
                key={cli.id} 
                onClick={() => onEditarCliente(cli)}
                className="w-full bg-white hover:border-[#0091FB]/60 active:scale-[0.99] cursor-pointer rounded-2xl border border-slate-200/70 px-4 py-3.5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 space-y-2.5">
                
                {/* Línea 1: ID + Nombre + Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md text-[10px] shrink-0 border border-slate-200/50">
                      {cli.id}
                    </span>
                    <h3 className="text-sm font-black text-[#001757] tracking-tight truncate leading-snug">
                      {cli.nombreCliente}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] font-black bg-blue-50 text-[#001757] border border-blue-200/60 px-1.5 py-0.5 rounded-md">
                      {cli.sucursal}
                    </span>
                    <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                      {cli.tipoCliente}
                    </span>
                  </div>
                </div>

                {/* Línea 2: Responsable y Dirección */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <p className="truncate font-bold flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-[#0091FB] shrink-0" />
                    <span className="truncate">{cli.responsable || 'Sin encargado'}</span>
                  </p>

                  <p className="text-[10px] text-slate-400 font-semibold truncate flex items-center gap-0.5 shrink-0 max-w-[140px]">
                    <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                    <span className="truncate">{cli.direccion || 'Sin dirección'}</span>
                  </p>
                </div>

                {/* Línea 3: Botones de Acción */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {tieneTelefono ? (
                      <>
                        <a 
                          href={`tel:${telLimpio}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-[#001757] font-black text-[11px] rounded-xl border border-blue-200/80 flex items-center gap-1 transition-all"
                          title="Llamar">
                          <Phone className="w-3 h-3 text-[#0091FB]" />
                          <span>Llamar</span>
                        </a>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirWhatsAppCliente(cli.contacto, cli.nombreCliente, cli.responsable, cli.sucursal);
                          }}
                          className="h-7.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-[11px] rounded-xl border border-emerald-200/80 flex items-center gap-1 transition-all"
                          title="WhatsApp">
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic font-semibold">Sin teléfono</span>
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
                      className="h-7.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-xl flex items-center gap-1 transition-all">
                      <Navigation className="w-3 h-3 text-[#0091FB]" />
                      <span>Ruta</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditarCliente(cli);
                      }}
                      className="w-7.5 h-7.5 rounded-xl text-slate-400 hover:text-[#0091FB] hover:bg-blue-50 flex items-center justify-center transition-colors"
                      title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarCliente(cli);
                      }}
                      className="w-7.5 h-7.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                      title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
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