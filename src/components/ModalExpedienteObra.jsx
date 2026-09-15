import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Camera, ShieldCheck, AlertTriangle, Compass, 
  DollarSign, FileText, Phone, MessageCircle, Navigation, Plus, 
  FileSpreadsheet, User, Building2, MapPin, Pencil, Trash2,
  ChevronRight, Link2, Receipt, FileCheck, CheckCircle2, Eye
} from 'lucide-react';
import { FASE_COLORS, CAT_FORMA_PAGO } from '../data/constants';
import { abrirGoogleCalendar } from '../lib/calendario';

const formatearMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ModalExpedienteObra({ 
  isOpen, 
  onClose, 
  obra, 
  visitas = [], 
  movimientos = [], 
  clientes = [],
  onNuevaVisita, 
  onEditarVisita,
  onEliminarVisita,
  onNuevoMovimiento,
  onEditarObra,
  onEliminarObra,
  onVerVisor,
  onAbrirRuta,
  onVincularCliente,
  onGuardarMovimientoDirecto
}) {
  const [subTab, setSubTab] = useState('bitacora');
  const [cotizacionAConvertir, setCotizacionAConvertir] = useState(null);
  const [folioVenta, setFolioVenta] = useState('');
  const [tipoComprobanteVenta, setTipoComprobanteVenta] = useState('REMISIÓN');
  const [formaPagoVenta, setFormaPagoVenta] = useState('EFECTIVO');
  
  // ESTADO PARA ABRIR EL DETALLE COMPLETO DE UNA VISITA
  const [visitaDetalle, setVisitaDetalle] = useState(null);

  if (!isOpen || !obra) return null;

  const clienteVinculado = clientes.find(c => c.id === obra.clienteId);

  const visitasObra = visitas
    .filter(v => v.obraId === obra.id)
    .sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')));

  const movimientosObra = movimientos
    .filter(m => m.obraId === obra.id)
    .sort((a, b) => new Date(b.fecha.replace(' ', 'T')) - new Date(a.fecha.replace(' ', 'T')));

  const cotizaciones = movimientosObra.filter(m => m.tipo === 'COTIZACION');
  const ventas = movimientosObra.filter(m => m.tipo === 'VENTA');

  const totalCotizado = cotizaciones.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
  const totalVendido = ventas.reduce((acc, v) => acc + (Number(v.monto) || 0), 0);

  const enviarWhatsApp = () => {
    if (!clienteVinculado || !clienteVinculado.contacto) return;
    const tel = clienteVinculado.contacto.replace(/\D/g, '');
    const telFinal = tel.length === 10 ? `52${tel}` : tel;
    const resp = clienteVinculado.responsable ? ` ${clienteVinculado.responsable}` : '';
    const msg = encodeURIComponent(`HOLA${resp}, TE CONTACTO RESPECTO A LA OBRA ${obra.nombre}.`);
    window.open(`https://wa.me/${telFinal}?text=${msg}`, '_blank');
  };

  const ejecutarConversionAVenta = (e) => {
    e.preventDefault();
    if (!cotizacionAConvertir || !folioVenta.trim()) return;

    const cotizacionActualizada = {
      ...cotizacionAConvertir,
      estatus: 'GANADA'
    };

    const nuevaVenta = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      obraId: obra.id,
      tipo: 'VENTA',
      comprobante: tipoComprobanteVenta,
      folio: folioVenta.trim().toUpperCase(),
      monto: Number(cotizacionAConvertir.monto) || 0,
      estatus: 'ENTREGADO',
      formaPago: formaPagoVenta,
      tipoEntrega: cotizacionAConvertir.tipoEntrega || 'DOMICILIO',
      fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
      documentoAdjunto: cotizacionAConvertir.documentoAdjunto,
      observaciones: `VENTA CERRADA A PARTIR DE COTIZACIÓN ${cotizacionAConvertir.folio}`,
      cotizacionOrigenId: cotizacionAConvertir.id
    };

    onGuardarMovimientoDirecto(cotizacionActualizada);
    onGuardarMovimientoDirecto(nuevaVenta);
    setCotizacionAConvertir(null);
    setFolioVenta('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-3xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        <div className="pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* CABECERA MAESTRA */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-black bg-blue-50 text-[#001757] px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {obra.id}
                </span>

                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase ${
                  obra.estadoObra === 'PAUSADA' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                  obra.estadoObra === 'TERMINADA' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                  'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {obra.estadoObra === 'TERMINADA' ? 'Concluida' : obra.estadoObra === 'PAUSADA' ? 'Pausada' : 'En Proceso'}
                </span>

                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase ${FASE_COLORS[obra.estatusFase]}`}>
                  {obra.estatusFase}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-[#001757] leading-tight mt-1.5 truncate">
                {obra.nombre}
              </h2>
              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {obra.sucursal} • {obra.direccion || 'Ubicación satelital fijada'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditarObra(obra)}
                className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0091FB] hover:bg-blue-100 flex items-center justify-center transition-all active:scale-90"
                title="Editar Obra">
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onEliminarObra(obra)}
                className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-90"
                title="Eliminar Obra">
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90 ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SUB-PESTAÑAS TÁCTILES */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setSubTab('bitacora')}
              className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                subTab === 'bitacora' ? 'bg-white text-[#001757] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <Camera className="w-4 h-4" />
              <span>Bitácora ({visitasObra.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('comercial')}
              className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                subTab === 'comercial' ? 'bg-white text-[#001757] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <DollarSign className="w-4 h-4" />
              <span>Comercial ({movimientosObra.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('contacto')}
              className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                subTab === 'contacto' ? 'bg-white text-[#001757] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <User className="w-4 h-4" />
              <span>Contacto & GPS</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* BITÁCORA EN FORMATO LISTA FLUIDA */}
          {subTab === 'bitacora' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#001757]">Historial de Visitas de Campo</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Toca cualquier visita para ver sus fotos y detalles</p>
                </div>

                <button
                  type="button"
                  onClick={() => onNuevaVisita(obra)}
                  className="min-h-[42px] px-4 bg-[#0091FB] hover:bg-[#007be0] active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Check-in</span>
                </button>
              </div>

              {visitasObra.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                  <Camera className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700">Sin visitas registradas aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visitasObra.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      onClick={() => setVisitaDetalle(v)}
                      className="p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/90 hover:border-[#0091FB] rounded-2xl cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group">
                      
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#001757] shrink-0 font-bold shadow-2xs group-hover:border-[#0091FB]">
                          <Calendar className="w-5 h-5 text-[#0091FB]" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                              {v.fecha}
                            </p>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${FASE_COLORS[v.estatus]}`}>
                              {v.estatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                            {v.actividad} • <strong className="text-slate-700">{v.asesorNombre || 'Asesor'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {v.fotos && v.fotos.length > 0 && (
                          <span className="text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                            <Camera className="w-3.5 h-3.5 text-[#0091FB]" />
                            {v.fotos.length}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0091FB] transition-colors" />
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMERCIAL */}
          {subTab === 'comercial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-[#001757] tracking-widest block">Cotizado</span>
                  <p className="text-lg font-black text-[#001757] mt-0.5">{formatearMoneda(totalCotizado)}</p>
                  <p className="text-xs font-bold text-[#0091FB] mt-0.5">{cotizaciones.length} cotización(es)</p>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest block">Vendido</span>
                  <p className="text-lg font-black text-emerald-800 mt-0.5">{formatearMoneda(totalVendido)}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">{ventas.length} venta(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNuevoMovimiento({ obra, tipo: 'COTIZACION' })}
                  className="flex-1 min-h-[44px] px-3 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Cotización</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNuevoMovimiento({ obra, tipo: 'VENTA' })}
                  className="flex-1 min-h-[44px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Venta Cerrada</span>
                </button>
              </div>

              {movimientosObra.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                  <FileSpreadsheet className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700">Sin movimientos comerciales</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {movimientosObra.map((mov) => {
                    const esVenta = mov.tipo === 'VENTA';
                    const esFactura = mov.comprobante === 'FACTURA';
                    const esCotizacionPendiente = mov.tipo === 'COTIZACION' && mov.estatus !== 'GANADA';

                    return (
                      <div 
                        key={mov.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                          esVenta 
                            ? (esFactura ? 'bg-indigo-50/80 border-indigo-200' : 'bg-emerald-50/80 border-emerald-200')
                            : 'bg-white border-slate-200'
                        }`}>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              esVenta 
                                ? (esFactura ? 'bg-indigo-700 text-white' : 'bg-emerald-700 text-white')
                                : (mov.estatus === 'GANADA' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#001757] text-white')
                            }`}>
                              {mov.comprobante} {mov.estatus === 'GANADA' ? '(CERRADA)' : ''}
                            </span>

                            <span className="font-mono text-xs sm:text-sm font-bold text-slate-800">
                              {mov.folio}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {mov.fecha}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-sm sm:text-base font-black text-slate-900">
                              {formatearMoneda(mov.monto)}
                            </p>
                            {esVenta && mov.formaPago && (
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {mov.formaPago}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {esCotizacionPendiente && (
                            <button
                              type="button"
                              onClick={() => {
                                setCotizacionAConvertir(mov);
                                setFolioVenta('');
                              }}
                              className="min-h-[38px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Cerrar Venta</span>
                            </button>
                          )}

                          {mov.documentoAdjunto?.url && (
                            <button
                              type="button"
                              onClick={() => onVerVisor({
                                tipo: mov.documentoAdjunto.tipo || 'pdf',
                                url: mov.documentoAdjunto.url,
                                titulo: `${mov.folio} - ${obra.nombre}`
                              })}
                              className="min-h-[38px] px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95">
                              <FileText className="w-4 h-4 text-[#0091FB]" />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONTACTO & GPS */}
          {subTab === 'contacto' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Cliente Vinculado
                  </span>

                  {clienteVinculado && (
                    <button
                      type="button"
                      onClick={() => onVincularCliente(obra)}
                      className="text-xs sm:text-sm font-black text-[#0091FB] hover:underline">
                      Cambiar cliente
                    </button>
                  )}
                </div>

                {clienteVinculado ? (
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-base font-black text-[#001757]">{clienteVinculado.nombreCliente}</h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Encargado: <strong>{clienteVinculado.responsable || 'No asignado'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {clienteVinculado.contacto && (
                        <>
                          <a
                            href={`tel:${clienteVinculado.contacto.replace(/\D/g, '')}`}
                            className="min-h-[42px] px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#001757] font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 active:scale-95">
                            <Phone className="w-4 h-4 text-[#0091FB]" />
                            <span>Llamar</span>
                          </a>

                          <button
                            type="button"
                            onClick={enviarWhatsApp}
                            className="min-h-[42px] px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 active:scale-95">
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-2">
                    <p className="text-xs sm:text-sm font-bold text-amber-900">Sin cliente asignado</p>
                    <button
                      type="button"
                      onClick={() => onVincularCliente(obra)}
                      className="min-h-[42px] px-4 bg-amber-600 text-white font-black text-xs rounded-xl inline-flex items-center gap-1.5 active:scale-95">
                      <Link2 className="w-4 h-4" />
                      <span>Vincular Cliente</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Ubicación GPS</span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">{obra.direccion || 'Ubicación fijada en mapa'}</p>
                <button
                  type="button"
                  onClick={() => onAbrirRuta({ nombre: obra.nombre, direccion: obra.direccion, lat: obra.lat, lng: obra.lng })}
                  className="w-full min-h-[48px] bg-[#001757] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-98 shadow-sm">
                  <Navigation className="w-4 h-4 text-[#0091FB]" />
                  <span>Iniciar Ruta GPS (Waze / Google Maps)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const manana = new Date();
                    manana.setDate(manana.getDate() + 1);
                    manana.setHours(9, 0, 0, 0);
                    abrirGoogleCalendar({
                      titulo: `Visita a obra: ${obra.nombre}`,
                      descripcion: `Supervisión técnica - ${obra.sucursal}\nFase actual: ${obra.estatusFase}`,
                      ubicacion: obra.direccion || `${obra.lat}, ${obra.lng}`,
                      fechaInicio: manana,
                      duracionHoras: 1
                    });
                  }}
                  className="w-full min-h-[48px] bg-white border-2 border-[#001757] text-[#001757] font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-98 shadow-sm mt-2">
                  <Calendar className="w-4 h-4 text-[#0091FB]" />
                  <span>📅 Agendar visita en Google Calendar</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditarObra(obra)}
              className="min-h-[44px] px-4 rounded-xl bg-slate-200 text-slate-800 font-black text-xs sm:text-sm flex items-center gap-1.5 active:scale-95">
              <Pencil className="w-4 h-4 text-[#0091FB]" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => onEliminarObra(obra)}
              className="min-h-[44px] px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs sm:text-sm flex items-center gap-1.5 active:scale-95">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Eliminar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 rounded-xl bg-[#001757] text-white font-black text-xs sm:text-sm shadow-md active:scale-95">
            Cerrar
          </button>
        </div>

      </div>

      {/* =========================================================================
          SUB-MODAL: DETALLE COMPLETO DE VISITA (CON EDITAR Y BORRAR INDIVIDUAL)
         ========================================================================= */}
      {visitaDetalle && (
        <div className="fixed inset-0 z-[95] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Cabecera del Detalle */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-blue-50 text-[#001757] px-2 py-0.5 rounded-md border border-blue-200">
                    {visitaDetalle.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase ${FASE_COLORS[visitaDetalle.estatus]}`}>
                    {visitaDetalle.estatus}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">Supervisión Técnica</h3>
                <p className="text-xs text-slate-500 font-semibold">{visitaDetalle.fecha}</p>
              </div>

              <button 
                type="button"
                onClick={() => setVisitaDetalle(null)} 
                className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadatos y Auditoría */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Asesor a Cargo</span>
                <p className="font-black text-slate-900 mt-0.5">{visitaDetalle.asesorNombre || 'ASESOR'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Auditoría GPS</span>
                <p className="font-black text-emerald-700 mt-0.5">
                  {visitaDetalle.auditoriaEstado === 'en_sitio' ? 'En Sitio' : 'Remoto'} ({visitaDetalle.distanciaAuditoriaMetros || 0}m)
                </p>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Notas y Acuerdos de Campo</label>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                {visitaDetalle.observaciones ? `"${visitaDetalle.observaciones}"` : 'Sin observaciones registradas.'}
              </div>
            </div>

            {/* Galería de Fotos */}
            {visitaDetalle.fotos && visitaDetalle.fotos.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Evidencia Fotográfica ({visitaDetalle.fotos.length})
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {visitaDetalle.fotos.map((f, fIdx) => (
                    <img
                      key={fIdx}
                      src={f}
                      alt="Evidencia"
                      onClick={() => onVerVisor({
                        tipo: 'foto',
                        fotos: visitaDetalle.fotos,
                        index: fIdx,
                        titulo: `${obra.nombre} - ${visitaDetalle.fecha}`
                      })}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 cursor-pointer shrink-0 active:scale-95 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN: EDITAR Y BORRAR EN SUPABASE */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              
              <button
                type="button"
                onClick={() => {
                  const target = visitaDetalle;
                  setVisitaDetalle(null);
                  onEditarVisita(target);
                }}
                className="min-h-[44px] px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#001757] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <Pencil className="w-4 h-4 text-[#0091FB]" />
                <span>Editar Visita</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar la visita del ${visitaDetalle.fecha} de forma permanente en Supabase?`)) {
                    onEliminarVisita(visitaDetalle.id);
                    setVisitaDetalle(null);
                  }
                }}
                className="min-h-[44px] px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Borrar Visita</span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* SUB-MODAL RÁPIDO: CONVERTIR COTIZACIÓN A VENTA */}
      {cotizacionAConvertir && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-black text-[#001757]">Cerrar Venta</h4>
              </div>
              <button onClick={() => setCotizacionAConvertir(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Convertirás la cotización <strong className="text-slate-900">{cotizacionAConvertir.folio}</strong> por <strong className="text-emerald-700">{formatearMoneda(cotizacionAConvertir.monto)}</strong> en una venta ganada.
            </p>

            <form onSubmit={ejecutarConversionAVenta} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipoComprobanteVenta('REMISIÓN')}
                  className={`min-h-[38px] py-1.5 rounded-lg font-black text-xs ${
                    tipoComprobanteVenta === 'REMISIÓN' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                  }`}>
                  Remisión
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobanteVenta('FACTURA')}
                  className={`min-h-[38px] py-1.5 rounded-lg font-black text-xs ${
                    tipoComprobanteVenta === 'FACTURA' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}>
                  Factura
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Folio de {tipoComprobanteVenta} *</label>
                <input
                  type="text" required
                  value={folioVenta}
                  onChange={(e) => setFolioVenta(e.target.value)}
                  placeholder={tipoComprobanteVenta === 'REMISIÓN' ? 'REM-501' : 'FAC-809'}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:border-[#0091FB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Forma de Pago *</label>
                <select
                  value={formaPagoVenta}
                  onChange={(e) => setFormaPagoVenta(e.target.value)}
                  className="w-full h-11 px-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none">
                  {CAT_FORMA_PAGO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                </select>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCotizacionAConvertir(null)}
                  className="w-full min-h-[44px] py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md">
                  Confirmar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}