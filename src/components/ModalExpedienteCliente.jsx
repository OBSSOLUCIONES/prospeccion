// src/components/ModalExpedienteCliente.jsx
import React from 'react';
import { 
  X, User, Phone, Mail, MapPin, Navigation, 
  Building2, DollarSign, Pencil, Trash2, ChevronRight, Plus, ExternalLink,
  MessageCircle
} from 'lucide-react';
import { CAT_TIPOS_OBRA, FASE_COLORS } from '../data/constants';

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ModalExpedienteCliente({
  isOpen,
  onClose,
  cliente,
  obras = [],
  movimientos = [],
  onEditarCliente,
  onEliminarCliente,
  onAbrirRuta,
  onSeleccionarObra,
  onNuevaObraParaCliente
}) {
  if (!isOpen || !cliente) return null;

  // Obras asociadas a este cliente
  const obrasCliente = obras.filter(o => o.clienteId === cliente.id);
  const obrasIds = obrasCliente.map(o => o.id);
  const movsCliente = movimientos.filter(m => obrasIds.includes(m.obraId));

  const totalCotizado = movsCliente
    .filter(m => m.tipo === 'COTIZACION')
    .reduce((sum, item) => sum + (Number(item.monto) || 0), 0);

  const totalVendido = movsCliente
    .filter(m => m.tipo === 'VENTA')
    .reduce((sum, item) => sum + (Number(item.monto) || 0), 0);

  const telLimpio = cliente.contacto ? String(cliente.contacto).replace(/\D/g, '') : '';
  const tieneTelefono = Boolean(telLimpio && telLimpio.length >= 7);

  const abrirWhatsApp = () => {
    if (!tieneTelefono) return;
    const telFinal = telLimpio.length === 10 ? `52${telLimpio}` : telLimpio;
    const resp = cliente.responsable ? ` ${cliente.responsable}` : '';
    const msg = encodeURIComponent(`Hola${resp}, te contacto de OBS respecto a tus proyectos.`);
    window.open(`https://wa.me/${telFinal}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200 my-auto">
        
        {/* CABECERA MAESTRA DEL CLIENTE */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-black bg-blue-50 text-[#001757] px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {cliente.id}
                </span>

                {cliente.idRedAzul && (
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                    {cliente.idRedAzul}
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase bg-amber-50 text-amber-800 border-amber-200">
                  {cliente.tipoCliente || 'PROSPECTO'}
                </span>

                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-[#001757] border border-blue-200">
                  {cliente.sucursal}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#001757] to-[#0091FB] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  👤
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#001757] leading-tight truncate">
                  {cliente.nombreCliente}
                </h2>
              </div>

              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                Oficio: <strong className="text-slate-800">{cliente.tipoMercado || 'CLIENTE FINAL'}</strong> • Encargado: {cliente.responsable || 'Sin encargado'}
              </p>
            </div>

            {/* Botones de Cabecera: Editar, Borrar, Cerrar */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditarCliente(cliente)}
                className="w-9 h-9 rounded-xl bg-blue-50 text-[#0091FB] hover:bg-blue-100 flex items-center justify-center transition-all active:scale-90"
                title="Editar Datos del Cliente">
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onEliminarCliente(cliente)}
                className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-90"
                title="Eliminar Cliente">
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90 ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TARJETAS DE IMPACTO FINANCIERO */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[9px] uppercase font-black text-slate-400 block">Obras Activas</span>
              <strong className="text-sm sm:text-base font-black text-[#001757]">
                {obrasCliente.length}
              </strong>
            </div>

            <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-200 text-center">
              <span className="text-[9px] uppercase font-black text-[#001757] block">Cotizado</span>
              <strong className="text-xs sm:text-sm font-black text-[#001757] truncate block">
                {formatearMoneda(totalCotizado)}
              </strong>
            </div>

            <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[9px] uppercase font-black text-emerald-800 block">Comprado</span>
              <strong className="text-xs sm:text-sm font-black text-emerald-700 truncate block">
                {formatearMoneda(totalVendido)}
              </strong>
            </div>
          </div>
        </div>

        {/* CONTENIDO DEL EXPEDIENTE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* BLOQUE 1: COMUNICACIÓN DIRECTA */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Canales Directos de Contacto
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tieneTelefono ? (
                <>
                  <a
                    href={`tel:${telLimpio}`}
                    className="min-h-[42px] px-3 bg-white hover:bg-blue-50 border border-blue-200 text-[#001757] font-black text-xs rounded-xl flex items-center justify-between shadow-2xs active:scale-95 transition-all">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0091FB]" />
                      <span>{cliente.contacto}</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-[#001757]">Llamar</span>
                  </a>

                  <button
                    type="button"
                    onClick={abrirWhatsApp}
                    className="min-h-[42px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-between shadow-xs transition-all">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Directo</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </>
              ) : (
                <div className="col-span-full p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 italic">
                  Sin teléfono registrado
                </div>
              )}
            </div>

            {cliente.correo && (
              <a
                href={`mailto:${cliente.correo}`}
                className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 truncate hover:border-[#0091FB] transition-colors">
                <Mail className="w-4 h-4 text-[#0091FB] shrink-0" />
                <span className="truncate">{cliente.correo}</span>
              </a>
            )}
          </div>

          {/* BLOQUE 2: UBICACIÓN FISCAL / OFICINA */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Domicilio Fiscal / Oficina
            </span>

            <p className="text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
              {cliente.direccion || 'Sin dirección física registrada'}
            </p>

            {(cliente.lat && cliente.lng) && (
              <button
                type="button"
                onClick={() => onAbrirRuta({
                  nombre: cliente.nombreCliente,
                  direccion: cliente.direccion,
                  lat: cliente.lat,
                  lng: cliente.lng
                })}
                className="w-full min-h-[42px] bg-[#001757] hover:bg-[#00227a] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 active:scale-98 shadow-sm transition-all">
                <Navigation className="w-4 h-4 text-[#0091FB]" />
                <span>Iniciar Ruta GPS hacia la Oficina</span>
              </button>
            )}
          </div>

          {/* BLOQUE 3: OBRAS ASOCIADAS A ESTE CLIENTE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#001757]">
                  Obras de este Cliente ({obrasCliente.length})
                </h3>
                <p className="text-[10px] text-slate-400">Proyectos en construcción supervisados por OBS</p>
              </div>

              <button
                type="button"
                onClick={() => onNuevaObraParaCliente(cliente)}
                className="min-h-[36px] px-3 bg-[#0091FB] hover:bg-[#007be0] active:scale-95 text-white font-black text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Obra</span>
              </button>
            </div>

            {obrasCliente.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Este cliente aún no tiene obras vinculadas</p>
                <p className="text-[11px] text-slate-400">Toca el botón "+ Obra" para asociarle su primer proyecto.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {obrasCliente.map(o => {
                  const tipoObraObj = CAT_TIPOS_OBRA.find(t => t.id === o.tipoObra) || CAT_TIPOS_OBRA[0];

                  return (
                    <div
                      key={o.id}
                      onClick={() => onSeleccionarObra(o)}
                      className="p-3 bg-white hover:bg-blue-50/70 border border-slate-200/90 hover:border-[#0091FB] rounded-2xl cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group">
                      
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-base shrink-0 group-hover:border-[#0091FB]">
                          {tipoObraObj.icono}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[9px] font-black bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                              {o.id}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[9px] font-black border uppercase ${FASE_COLORS[o.estatusFase]}`}>
                              {o.estatusFase}
                            </span>
                          </div>
                          <p className="text-xs font-black text-slate-900 truncate mt-0.5 group-hover:text-[#001757]">
                            {o.nombre}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-[#0091FB]">
                          Ver Obra
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0091FB] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* PIE DE PÁGINA */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEditarCliente(cliente)}
            className="min-h-[42px] px-4 rounded-xl bg-blue-50 border border-blue-200 text-[#001757] font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all">
            <Pencil className="w-3.5 h-3.5 text-[#0091FB]" />
            <span>Editar Datos</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-6 rounded-xl bg-[#001757] text-white font-black text-xs shadow-md active:scale-95">
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
}