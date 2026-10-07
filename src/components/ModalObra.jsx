// src/components/ModalObra.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Check, Building2, Info, Search, User, Phone, CheckCircle2 } from 'lucide-react';
import { SUCURSALES, FASES_OBRA, CAT_TIPO_DESARROLLO, ETAPAS_COMERCIALES, CAT_TIPOS_OBRA } from '../data/constants';

export default function ModalObra({ 
  isOpen, 
  onClose, 
  onSave, 
  obraAEditar, 
  clientes = [], 
  obras = [], 
  tabletPos, 
  onAbrirMapaPicker,
  usuarioActivo 
}) {
  const [form, setForm] = useState({
    sucursal: 'ALTOZANO',
    nombre: '',
    clienteId: '',
    tipoObra: 'CASA_HABITACION',
    tipoDesarrollo: 'OBRA NUEVA',
    estatusFase: 'PRELIMINARES',
    etapaComercial: 'PROSPECTO',
    estadoObra: 'ACTIVA',
    direccion: '',
    lat: null,
    lng: null
  });

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [verTodasSucursales, setVerTodasSucursales] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setBusquedaCliente('');
    setVerTodasSucursales(false);

    if (obraAEditar) {
      setForm({
        ...obraAEditar,
        tipoObra: obraAEditar.tipoObra || 'CASA_HABITACION',
        estatusFase: obraAEditar.estatusFase || 'PRELIMINARES',
        etapaComercial: obraAEditar.etapaComercial || 'PROSPECTO',
        estadoObra: obraAEditar.estadoObra || 'ACTIVA',
        clienteId: obraAEditar.clienteId || ''
      });
    } else {
      const sucursalDefault = (usuarioActivo && usuarioActivo.sucursal !== 'TODAS') 
        ? usuarioActivo.sucursal 
        : 'ALTOZANO';

      setForm({
        sucursal: sucursalDefault,
        nombre: '',
        clienteId: '',
        tipoObra: 'CASA_HABITACION',
        tipoDesarrollo: 'OBRA NUEVA',
        estatusFase: 'PRELIMINARES',
        etapaComercial: 'PROSPECTO',
        estadoObra: 'ACTIVA',
        direccion: '',
        lat: tabletPos?.lat || 19.6642,
        lng: tabletPos?.lng || -101.1718
      });
    }
  }, [isOpen, obraAEditar]);

  // Clientes filtrados estrictamente por la sucursal de la obra y por el texto de búsqueda
  const clientesFiltrados = useMemo(() => {
    const sucActual = form.sucursal.trim().toUpperCase();
    const q = busquedaCliente.toLowerCase().trim();

    return clientes
      .filter(c => {
        if (verTodasSucursales) return true;
        return c.sucursal && c.sucursal.trim().toUpperCase() === sucActual;
      })
      .filter(c => {
        if (!q) return true;
        return (
          (c.nombreCliente && c.nombreCliente.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q)) ||
          (c.responsable && c.responsable.toLowerCase().includes(q)) ||
          (c.contacto && c.contacto.includes(q))
        );
      });
  }, [clientes, form.sucursal, busquedaCliente, verTodasSucursales]);

  const clienteSeleccionado = useMemo(() => {
    if (!form.clienteId) return null;
    return clientes.find(c => c.id === form.clienteId);
  }, [clientes, form.clienteId]);

  if (!isOpen) return null;

  const sucursalObj = SUCURSALES.find(s => s.nombre === form.sucursal) || SUCURSALES[0];
  const existentes = obras.filter(o => o.id && o.id.startsWith(`OBR-${sucursalObj.codigo}`)).length;
  const idMostrado = obraAEditar ? obraAEditar.id : `OBR-${sucursalObj.codigo}${String(existentes + 1).padStart(2, '0')}`;

  const etapaSeleccionadaObj = ETAPAS_COMERCIALES.find(e => e.id === form.etapaComercial) || ETAPAS_COMERCIALES[0];
  const tipoObraObj = CAT_TIPOS_OBRA.find(t => t.id === form.tipoObra) || CAT_TIPOS_OBRA[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: idMostrado,
      ...form,
      createdAt: obraAEditar ? obraAEditar.createdAt : new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200 my-auto">
        
        {/* Cabecera */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#001757] tracking-tight">
                {obraAEditar ? 'Editar Obra' : 'Alta de Obra'}
              </h2>
              <span className="bg-[#0091FB] text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                {idMostrado}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Expediente territorial y comercial para Power BI y Google Maps
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-obra" onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* Sucursal y Tipo de Desarrollo */}
          <div className="grid grid-cols-2 gap-2 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
            <div>
              <label className="block font-black text-[#001757] mb-1">Sucursal *</label>
              <select
                value={form.sucursal}
                disabled={Boolean(obraAEditar || (usuarioActivo && usuarioActivo.sucursal !== 'TODAS'))}
                onChange={(e) => {
                  const nuevaSuc = e.target.value;
                  setForm(prev => ({ ...prev, sucursal: nuevaSuc, clienteId: '' }));
                }}
                className="w-full h-10 px-2.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-800 text-xs outline-none disabled:bg-slate-100">
                {SUCURSALES.map(s => <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-black text-[#001757] mb-1">Tipo de Desarrollo</label>
              <select
                value={form.tipoDesarrollo}
                onChange={(e) => setForm(prev => ({ ...prev, tipoDesarrollo: e.target.value }))}
                className="w-full h-10 px-2.5 rounded-xl border border-blue-200 bg-white font-semibold text-slate-800 text-xs outline-none">
                {CAT_TIPO_DESARROLLO.map(td => <option key={td} value={td}>{td}</option>)}
              </select>
            </div>
          </div>

          {/* TIPOLOGÍA / VOCACIÓN DE LA OBRA */}
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
            <label className="block font-black text-emerald-950 text-[11px] uppercase tracking-wider">
              Tipología Arquitectónica / Uso de la Obra *
            </label>
            <select
              value={form.tipoObra}
              onChange={(e) => setForm(prev => ({ ...prev, tipoObra: e.target.value }))}
              className="w-full h-11 px-3 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20">
              {CAT_TIPOS_OBRA.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.icono} {tipo.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-emerald-700 font-medium">Define el icono visual en el mapa satelital y en Google My Maps.</p>
          </div>

          {/* Nombre de la Obra */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Nombre del Proyecto / Obra *</label>
            <input 
              type="text" required
              value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Torre Residencial Lote 14 o Bodega Central"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-[#0091FB]"
            />
          </div>

          {/* ============================================================== */}
          {/* CLIENTE VINCULADO (FILTRADO POR SUCURSAL + BUSCADOR CON LUPA)  */}
          {/* ============================================================== */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-[#001757] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0091FB]" />
                <span>Cliente de {form.sucursal}</span>
              </label>

              {/* Botón para ver de otras sucursales si es necesario */}
              <button
                type="button"
                onClick={() => setVerTodasSucursales(!verTodasSucursales)}
                className="text-[10px] font-bold text-slate-500 hover:text-[#0091FB] transition-colors">
                {verTodasSucursales ? 'Filtrar solo esta sucursal' : 'Ver de todas las sucursales'}
              </button>
            </div>

            {/* Buscador inteligente */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder={`Buscar cliente en ${verTodasSucursales ? 'todas las sucursales' : form.sucursal}...`}
                className="w-full h-9 pl-8 pr-7 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#0091FB]"
              />
              {busquedaCliente && (
                <button
                  type="button"
                  onClick={() => setBusquedaCliente('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector de Cliente */}
            <select
              value={form.clienteId}
              onChange={(e) => {
                const cId = e.target.value;
                const c = clientes.find(item => item.id === cId);
                setForm(prev => ({
                  ...prev,
                  clienteId: cId,
                  direccion: c?.direccion || prev.direccion,
                  lat: c?.lat ? parseFloat(c.lat) : prev.lat,
                  lng: c?.lng ? parseFloat(c.lng) : prev.lng
                }));
              }}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#0091FB]">
              <option value="">-- Sin cliente asignado (Prospección Inicial) --</option>
              {clientesFiltrados.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.nombreCliente} ({c.sucursal} • {c.tipoMercado || 'CLIENTE'})
                </option>
              ))}
            </select>

            {clientesFiltrados.length === 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                ⚠️ No se encontraron clientes registrados en {form.sucursal} con esa búsqueda.
              </p>
            )}

            {/* Ficha Visual del Cliente Seleccionado */}
            {clienteSeleccionado && (
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-900 truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{clienteSeleccionado.nombreCliente}</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5">
                    {clienteSeleccionado.id} • Encargado: {clienteSeleccionado.responsable || 'No asignado'}
                    {clienteSeleccionado.contacto && ` • Tel: ${clienteSeleccionado.contacto}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, clienteId: '' }))}
                  className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 font-bold text-[10px] hover:bg-rose-50 shrink-0"
                  title="Quitar cliente de esta obra">
                  Quitar
                </button>
              </div>
            )}
          </div>

          {/* EMBUDO COMERCIAL OBS (10 ETAPAS) */}
          <div className="p-3 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-black text-[#001757] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span>🎯 Etapa Comercial con OBS (Pipeline) *</span>
              </label>
              <span className="text-[10px] font-black bg-[#001757] text-white px-2 py-0.5 rounded-md">
                {etapaSeleccionadaObj.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {ETAPAS_COMERCIALES.map(etapa => (
                <button
                  key={etapa.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, etapaComercial: etapa.id }))}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-black border transition-all truncate text-center ${
                    form.etapaComercial === etapa.id
                      ? 'bg-[#001757] text-white border-[#001757] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {etapa.label}
                </button>
              ))}
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-blue-200 flex items-start gap-2 shadow-2xs">
              <Info className="w-4 h-4 text-[#0091FB] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-700 leading-snug font-medium">
                <strong className="text-[#001757]">{etapaSeleccionadaObj.label}:</strong> {etapaSeleccionadaObj.desc}
              </p>
            </div>
          </div>

          {/* FASE FÍSICA CONSTRUCTIVA */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Fase Física de Construcción *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FASES_OBRA.map(fase => (
                <button
                  key={fase}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, estatusFase: fase }))}
                  className={`h-10 px-2 rounded-xl text-xs font-bold border transition-all truncate ${
                    form.estatusFase === fase
                      ? 'bg-[#0091FB] text-white border-[#0091FB] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {fase}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación y GPS */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Ubicación y Coordenadas GPS *</label>
              {form.lat && form.lng && (
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 leading-snug">
              {form.direccion || 'Toca el botón para fijar la ubicación exacta en el mapa'}
            </p>

            <button
              type="button"
              onClick={() => {
                onAbrirMapaPicker({
                  initialPos: form.lat && form.lng ? { lat: form.lat, lng: form.lng } : tabletPos,
                  onConfirm: ({ lat, lng, direccion }) => {
                    setForm(prev => ({ ...prev, lat, lng, direccion: direccion || prev.direccion }));
                  }
                });
              }}
              className="w-full h-11 bg-white hover:bg-slate-50 active:scale-98 border border-blue-200 rounded-xl text-xs font-black text-[#001757] flex items-center justify-center gap-2 shadow-xs transition-all">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>🗺️ Seleccionar ubicación en el mapa</span>
            </button>
          </div>

        </form>

        <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
          <button
            type="submit"
            form="form-obra"
            className="w-full h-12 rounded-2xl bg-[#0091FB] hover:bg-[#007be0] active:scale-98 text-white font-black text-sm shadow-md shadow-[#0091FB]/25 transition-all flex items-center justify-center gap-2">
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{obraAEditar ? 'Guardar Cambios de la Obra' : `Guardar Obra (${idMostrado})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}