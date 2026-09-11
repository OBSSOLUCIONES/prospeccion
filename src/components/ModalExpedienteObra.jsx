// src/components/ModalExpedienteObra.jsx
import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Camera, ShieldCheck, AlertTriangle, Compass, 
  DollarSign, FileText, Phone, MessageCircle, Navigation, Plus, 
  FileSpreadsheet, User, Building2, MapPin, Pencil, Trash2,
  ChevronRight, Link2, Receipt, FileCheck, CheckCircle2
} from 'lucide-react';
import { FASE_COLORS, CAT_FORMA_PAGO } from '../data/constants';

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
    const msg = encodeURIComponent(`Hola${resp}, te contacto respecto a la obra ${obra.nombre}.`);
    window.open(`https://wa.me/${telFinal}?text=${msg}`, '_blank');
  };

  // Convertir Cotización a Venta Cerrada
  const ejecutarConversionAVenta = (e) => {
    e.preventDefault();
    if (!cotizacionAConvertir || !folioVenta.trim()) return;

    // 1. Actualizar la cotización a GANADA
    const cotizacionActualizada = {
      ...cotizacionAConvertir,
      estatus: 'GANADA'
    };

    // 2. Crear el nuevo movimiento de Venta vinculado
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
      observaciones: `Venta cerrada a partir de la cotización ${cotizacionAConvertir.folio}`,
      cotizacionOrigenId: cotizacionAConvertir.id
    };

    onGuardarMovimientoDirecto(cotizacionActualizada);
    onGuardarMovimientoDirecto(nuevaVenta);
    setCotizacionAConvertir(null);
    setFolioVenta('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* CABECERA MAESTRA */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-black bg-blue-50 text-[#001757] px-2 py-0.5 rounded-lg border border-blue-200">
                  {obra.id}
                </span>

                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${
                  obra.estadoObra === 'PAUSADA' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                  obra.estadoObra === 'TERMINADA' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                  'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {obra.estadoObra === 'TERMINADA' ? 'Concluida' : obra.estadoObra === 'PAUSADA' ? 'Pausada' : 'En Proceso'}
                </span>

                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${FASE_COLORS[obra.estatusFase]}`}>
                  {obra.estatusFase}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-[#001757] leading-tight mt-1 truncate">
                {obra.nombre}
              </h2>
              <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                {obra.sucursal} • {obra.direccion || 'Ubicación satelital fijada'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditarObra(obra)}
                className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0091FB] hover:bg-blue-100 flex items-center justify-center transition-all active:scale-90"
                title="Editar Obra">
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onEliminarObra(obra)}
                className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-90"
                title="Eliminar Obra">
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90 ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SUB-PESTAÑAS */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setSubTab('bitacora')}
              className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                subTab === 'bitacora' ? 'bg-white text-[#001757] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <Camera className="w-3.5 h-3.5" />
              <span>Bitácora ({visitasObra.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('comercial')}
              className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                subTab === 'comercial' ? 'bg-white text-[#001757] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <DollarSign className="w-3.5 h-3.5" />
              <span>Comercial ({movimientosObra.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('contacto')}
              className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                subTab === 'contacto' ? 'bg-white text-[#001757] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <User className="w-3.5 h-3.5" />
              <span>Contacto & GPS</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* BITÁCORA */}
          {subTab === 'bitacora' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#001757]">Historial de Visitas de Campo</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Supervisiones técnicas registradas</p>
                </div>

                <button
                  type="button"
                  onClick={() => onNuevaVisita(obra)}
                  className="h-10 px-3.5 bg-[#0091FB] hover:bg-[#007be0] active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Check-in</span>
                </button>
              </div>

              {visitasObra.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Sin visitas registradas aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visitasObra.map((v, idx) => (
                    <div key={v.id || idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                          Visita #{visitasObra.length - idx} • {v.fecha}
                        </span>

                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Auditado GPS
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${FASE_COLORS[v.estatus]}`}>
                          {v.estatus}
                        </span>
                        <span className="font-semibold text-[#001757] bg-blue-50 px-2 py-0.5 rounded-md">
                          {v.actividad}
                        </span>
                      </div>

                      {v.observaciones && (
                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                          "{v.observaciones}"
                        </p>
                      )}

                      {v.fotos && v.fotos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pt-1">
                          {v.fotos.map((foto, fIdx) => (
                            <img
                              key={fIdx}
                              src={foto}
                              alt="Evidencia"
                              onClick={() => onVerVisor({
                                tipo: 'foto',
                                fotos: v.fotos,
                                index: fIdx,
                                titulo: `${obra.nombre} - ${v.fecha}`
                              })}
                              className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 cursor-pointer shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMERCIAL CON BOTÓN CONVERTIR A VENTA */}
          {subTab === 'comercial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-[#001757] tracking-widest block">Cotizado</span>
                  <p className="text-base font-black text-[#001757] mt-0.5">{formatearMoneda(totalCotizado)}</p>
                  <p className="text-[10px] font-bold text-[#0091FB] mt-0.5">{cotizaciones.length} cotización(es)</p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-emerald-800 tracking-widest block">Vendido</span>
                  <p className="text-base font-black text-emerald-800 mt-0.5">{formatearMoneda(totalVendido)}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{ventas.length} venta(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNuevoMovimiento({ obra, tipo: 'COTIZACION' })}
                  className="flex-1 h-10 px-3 bg-[#001757] hover:bg-[#00227a] active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Cotización</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNuevoMovimiento({ obra, tipo: 'VENTA' })}
                  className="flex-1 h-10 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Venta Cerrada</span>
                </button>
              </div>

              {movimientosObra.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Sin movimientos comerciales</p>
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
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          esVenta 
                            ? (esFactura ? 'bg-indigo-50/70 border-indigo-200' : 'bg-emerald-50/70 border-emerald-200')
                            : 'bg-white border-slate-200'
                        }`}>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                              esVenta 
                                ? (esFactura ? 'bg-indigo-700 text-white' : 'bg-emerald-700 text-white')
                                : (mov.estatus === 'GANADA' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#001757] text-white')
                            }`}>
                              {mov.comprobante} {mov.estatus === 'GANADA' ? '(CERRADA)' : ''}
                            </span>

                            <span className="font-mono text-xs font-bold text-slate-800">
                              {mov.folio}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {mov.fecha}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900">
                              {formatearMoneda(mov.monto)}
                            </p>
                            {esVenta && mov.formaPago && (
                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                Pago: {mov.formaPago}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ACCIONES: CONVERTIR EN VENTA O VER PDF */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {esCotizacionPendiente && (
                            <button
                              type="button"
                              onClick={() => {
                                setCotizacionAConvertir(mov);
                                setFolioVenta('');
                              }}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[11px] rounded-xl flex items-center gap-1 shadow-xs transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Convertir a Venta</span>
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
                              className="h-8 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-[#0091FB]" />
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
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Cliente Vinculado
                  </span>

                  {clienteVinculado && (
                    <button
                      type="button"
                      onClick={() => onVincularCliente(obra)}
                      className="text-xs font-black text-[#0091FB] hover:underline">
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
                            className="h-9 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#001757] font-black text-xs rounded-xl flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#0091FB]" />
                            <span>Llamar</span>
                          </a>

                          <button
                            type="button"
                            onClick={enviarWhatsApp}
                            className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs rounded-xl flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-1.5">
                    <p className="text-xs font-bold text-amber-900">Sin cliente asignado</p>
                    <button
                      type="button"
                      onClick={() => onVincularCliente(obra)}
                      className="h-8 px-3 bg-amber-600 text-white font-black text-xs rounded-xl inline-flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Vincular Cliente</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ubicación GPS</span>
                <p className="text-xs font-semibold text-slate-800">{obra.direccion || 'Ubicación fijada en mapa'}</p>
                <button
                  type="button"
                  onClick={() => onAbrirRuta({ nombre: obra.nombre, direccion: obra.direccion, lat: obra.lat, lng: obra.lng })}
                  className="w-full h-11 bg-[#001757] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0091FB]" />
                  <span>Iniciar Ruta GPS (Waze / Maps)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditarObra(obra)}
              className="h-10 px-3 rounded-xl bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 active:scale-95">
              <Pencil className="w-3.5 h-3.5 text-[#0091FB]" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => onEliminarObra(obra)}
              className="h-10 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs flex items-center gap-1.5 active:scale-95">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Eliminar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-[#001757] text-white font-black text-xs shadow-md active:scale-95">
            Cerrar
          </button>
        </div>

      </div>

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
                  className={`py-1.5 rounded-lg font-black text-xs ${
                    tipoComprobanteVenta === 'REMISIÓN' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                  }`}>
                  Remisión
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobanteVenta('FACTURA')}
                  className={`py-1.5 rounded-lg font-black text-xs ${
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:border-[#0091FB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Forma de Pago *</label>
                <select
                  value={formaPagoVenta}
                  onChange={(e) => setFormaPagoVenta(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none">
                  {CAT_FORMA_PAGO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                </select>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCotizacionAConvertir(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md">
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