// src/components/ModalCliente.jsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Check, Phone, Mail, Building2, User } from 'lucide-react';
import { SUCURSALES, CAT_TIPO_CLIENTE } from '../data/constants';

export default function ModalCliente({ 
  isOpen, 
  onClose, 
  onSave, 
  clientes = [], 
  clienteAEditar, 
  onAbrirMapaPicker,
  tabletPos, 
  usuarioActivo 
}) {
  const [form, setForm] = useState({
    sucursal: 'ALTOZANO',
    nombreCliente: '',
    tipoCliente: 'PROSPECTO',
    tipoMercado: '',
    responsable: '', // SIEMPRE EN BLANCO
    contacto: '',
    correo: '',
    idRedAzul: '',
    direccion: '',
    lat: null,
    lng: null
  });

  // Inicialización limpia: Responsable SIEMPRE en blanco para nuevo cliente
  useEffect(() => {
    if (!isOpen) return;

    if (clienteAEditar) {
      setForm({
        ...clienteAEditar,
        tipoCliente: clienteAEditar.tipoCliente || 'PROSPECTO',
        tipoMercado: clienteAEditar.tipoMercado || '',
        responsable: clienteAEditar.responsable || '',
        contacto: clienteAEditar.contacto || '',
        correo: clienteAEditar.correo || '',
        idRedAzul: clienteAEditar.idRedAzul || ''
      });
    } else {
      const sucursalDefault = (usuarioActivo && usuarioActivo.sucursal !== 'TODAS') 
        ? usuarioActivo.sucursal 
        : 'ALTOZANO';

      setForm({
        sucursal: sucursalDefault,
        nombreCliente: '',
        tipoCliente: 'PROSPECTO',
        tipoMercado: '',
        responsable: '', // CAMPO EN BLANCO PARA NUEVO CLIENTE
        contacto: '',
        correo: '',
        idRedAzul: '',
        direccion: '',
        lat: tabletPos?.lat || 19.6642,
        lng: tabletPos?.lng || -101.1718
      });
    }
  }, [isOpen, clienteAEditar]);

  if (!isOpen) return null;

  const sucursalObj = SUCURSALES.find(s => s.nombre === form.sucursal) || SUCURSALES[0];
  const existentes = clientes.filter(c => c.id && c.id.startsWith(sucursalObj.codigo)).length;
  const idMostrado = clienteAEditar ? clienteAEditar.id : `${sucursalObj.codigo}${String(existentes + 1).padStart(2, '0')}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: idMostrado,
      ...form,
      ubicacion: form.lat && form.lng ? `https://www.google.com/maps?q=${form.lat},${form.lng}` : ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#001757] tracking-tight">
                {clienteAEditar ? 'Editar Cliente' : 'Alta de Cliente'}
              </h2>
              <span className="bg-[#0091FB] text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                {idMostrado}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {clienteAEditar ? 'Modificando datos del cliente' : 'Catálogo maestro de constructores y clientes'}
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-cliente" onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* Sucursal e ID Red Azul */}
          <div className="grid grid-cols-2 gap-2 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
            <div>
              <label className="block font-black text-[#001757] mb-1">Sucursal *</label>
              <select
                value={form.sucursal}
                disabled={Boolean(clienteAEditar || (usuarioActivo && usuarioActivo.sucursal !== 'TODAS'))}
                onChange={(e) => setForm(prev => ({ ...prev, sucursal: e.target.value }))}
                className="w-full h-10 px-2.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-800 text-xs outline-none disabled:bg-slate-100">
                {SUCURSALES.map(s => <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-black text-[#001757] mb-1">ID Red Azul</label>
              <input 
                type="text"
                value={form.idRedAzul}
                onChange={(e) => setForm(prev => ({ ...prev, idRedAzul: e.target.value }))}
                placeholder="Ej. RA-1029"
                className="w-full h-10 px-3 rounded-xl border border-blue-200 bg-white font-bold text-slate-800 text-xs outline-none"
              />
            </div>
          </div>

          {/* Nombre Cliente */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Nombre del Cliente / Razón Social *</label>
            <input 
              type="text" required
              value={form.nombreCliente}
              onChange={(e) => setForm(prev => ({ ...prev, nombreCliente: e.target.value }))}
              placeholder="Ej. Constructora del Centro S.A. de C.V."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-[#0091FB]"
            />
          </div>

          {/* Tipo de Cliente */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
            <label className="block font-black text-slate-700 text-[11px] uppercase tracking-wider">
              Clasificación de Cliente *
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CAT_TIPO_CLIENTE.map(tc => (
                <button
                  key={tc}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, tipoCliente: tc }))}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    form.tipoCliente === tc
                      ? 'bg-[#001757] text-white border-[#001757] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {tc}
                </button>
              ))}
            </div>
          </div>

          {/* Encargado / Responsable (EN BLANCO) y Teléfono */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Encargado / Contacto *</label>
              <input 
                type="text" required
                value={form.responsable}
                onChange={(e) => setForm(prev => ({ ...prev, responsable: e.target.value }))}
                placeholder="Ej. Ing. Carlos Salinas"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 outline-none focus:border-[#0091FB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Teléfono (WhatsApp)</label>
              <input 
                type="tel"
                value={form.contacto}
                onChange={(e) => setForm(prev => ({ ...prev, contacto: e.target.value }))}
                placeholder="443-123-4567"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 outline-none focus:border-[#0091FB]"
              />
            </div>
          </div>

          {/* Correo y Mercado */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Correo Electrónico</label>
              <input 
                type="email"
                value={form.correo}
                onChange={(e) => setForm(prev => ({ ...prev, correo: e.target.value }))}
                placeholder="contacto@empresa.com"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:border-[#0091FB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Tipo de Mercado</label>
              <input 
                type="text"
                value={form.tipoMercado}
                onChange={(e) => setForm(prev => ({ ...prev, tipoMercado: e.target.value }))}
                placeholder="Residencial, Industrial..."
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:border-[#0091FB]"
              />
            </div>
          </div>

          {/* Geolocalización y Dirección */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Ubicación y Dirección Fiscal/Oficina *</label>
              {form.lat && form.lng && (
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 leading-snug">
              {form.direccion || 'Toca el botón para fijar la ubicación en el mapa'}
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
            form="form-cliente"
            className="w-full h-12 rounded-2xl bg-[#0091FB] hover:bg-[#007be0] active:scale-98 text-white font-black text-sm shadow-md shadow-[#0091FB]/25 transition-all flex items-center justify-center gap-2">
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{clienteAEditar ? 'Guardar Cambios del Cliente' : `Guardar Cliente (${idMostrado})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}