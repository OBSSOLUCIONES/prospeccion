// src/components/ModalObra.jsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Check, Building2, User, Compass } from 'lucide-react';
import { SUCURSALES, FASES_OBRA, CAT_TIPO_DESARROLLO } from '../data/constants';

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
    tipoDesarrollo: 'OBRA NUEVA',
    estatusFase: 'PRELIMINARES',
    estadoObra: 'ACTIVA',
    direccion: '',
    lat: null,
    lng: null
  });

  // CORRECCIÓN CLAVE: Solo se reinicia al abrir/cerrar o cambiar de obra
  // tabletPos YA NO está en las dependencias para evitar que el GPS borre lo que escribes
  useEffect(() => {
    if (!isOpen) return;

    if (obraAEditar) {
      setForm({
        ...obraAEditar,
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
        tipoDesarrollo: 'OBRA NUEVA',
        estatusFase: 'PRELIMINARES',
        estadoObra: 'ACTIVA',
        direccion: '',
        lat: tabletPos?.lat || 19.6642,
        lng: tabletPos?.lng || -101.1718
      });
    }
  }, [isOpen, obraAEditar]);

  if (!isOpen) return null;

  const sucursalObj = SUCURSALES.find(s => s.nombre === form.sucursal) || SUCURSALES[0];
  const existentes = obras.filter(o => o.id && o.id.startsWith(`OBR-${sucursalObj.codigo}`)).length;
  const idMostrado = obraAEditar ? obraAEditar.id : `OBR-${sucursalObj.codigo}${String(existentes + 1).padStart(2, '0')}`;

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
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* CABECERA HOMOLOGADA */}
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
              {obraAEditar ? 'Modificando expediente técnico' : 'Registro de proyecto físico en campo'}
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
          
          {/* BLOQUE 1: SUCURSAL Y TIPO DE DESARROLLO */}
          <div className="grid grid-cols-2 gap-2 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
            <div>
              <label className="block font-black text-[#001757] mb-1">Sucursal *</label>
              <select
                value={form.sucursal}
                disabled={Boolean(obraAEditar || (usuarioActivo && usuarioActivo.sucursal !== 'TODAS'))}
                onChange={(e) => setForm(prev => ({ ...prev, sucursal: e.target.value }))}
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

          {/* BLOQUE 2: NOMBRE PRINCIPAL */}
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

          {/* BLOQUE 3: ESTADO OPERATIVO (PÍLDORAS TÁCTILES) */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
            <label className="block font-black text-slate-700 text-[11px] uppercase tracking-wider">
              Estado de la Obra *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'ACTIVA', label: 'En Proceso' },
                { id: 'PAUSADA', label: 'Pausada' },
                { id: 'TERMINADA', label: 'Concluida' }
              ].map(est => (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, estadoObra: est.id }))}
                  className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                    form.estadoObra === est.id
                      ? (est.id === 'ACTIVA' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : est.id === 'PAUSADA' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-[#001757] text-white border-[#001757] shadow-xs')
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {est.label}
                </button>
              ))}
            </div>
          </div>

          {/* BLOQUE 4: CLIENTE VINCULADO (PRESERVA TODO LO ESCRITO) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800">Cliente Vinculado</label>
              <span className="text-[10px] text-slate-400 font-semibold">(Opcional, anexable después)</span>
            </div>
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
              <option value="">-- Sin cliente asignado (Prospección) --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.id} - {c.nombreCliente}</option>
              ))}
            </select>
          </div>

          {/* BLOQUE 5: FASE CONSTRUCTIVA */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Fase Constructiva Actual *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FASES_OBRA.map(fase => (
                <button
                  key={fase}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, estatusFase: fase }))}
                  className={`h-10 px-2 rounded-xl text-xs font-bold border transition-all truncate ${
                    form.estatusFase === fase
                      ? 'bg-[#001757] text-white border-[#001757] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {fase}
                </button>
              ))}
            </div>
          </div>

          {/* BLOQUE 6: GEOLOCALIZACIÓN Y DIRECCIÓN (MISMO ESTILO EN AMBOS) */}
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

        {/* BOTÓN INFERIOR HOMOLOGADO */}
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