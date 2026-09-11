import React from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { SUCURSALES, CAT_TIPO_CLIENTE } from '../data/constants';

export default function ModalCliente({ 
  isOpen, onClose, onSave, clientes, onAbrirMapaPicker, formCliente, setFormCliente, clienteAEditar, usuarioActivo 
}) {
  if (!isOpen) return null;

  const sucursalObj = SUCURSALES.find(s => s.nombre === formCliente.sucursal) || SUCURSALES[0];
  const existentes = clientes.filter(c => c.id && c.id.startsWith(sucursalObj.codigo)).length;
  const idMostrado = clienteAEditar ? clienteAEditar.id : `${sucursalObj.codigo}${String(existentes + 1).padStart(2, '0')}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: idMostrado,
      ...formCliente,
      ubicacion: formCliente.lat && formCliente.lng
        ? `https://maps.google.com/?q=${formCliente.lat},${formCliente.lng}`
        : ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {clienteAEditar ? 'Editar Cliente' : 'Alta de Cliente'}
              </h2>
              <span className="bg-blue-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                {idMostrado}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {clienteAEditar ? 'Modificando datos del cliente' : 'Catálogo Maestro de Clientes'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto py-3 space-y-3 text-xs pr-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <div>
              <label className="block font-bold text-blue-950 mb-1">Sucursal *</label>
              <select 
                value={formCliente.sucursal}
                disabled={Boolean(clienteAEditar || (usuarioActivo && usuarioActivo.sucursal !== 'TODAS'))}
                onChange={(e) => setFormCliente({...formCliente, sucursal: e.target.value})}
                className="w-full p-2.5 rounded-xl border border-blue-200 bg-white font-bold text-slate-800 text-xs outline-none disabled:bg-slate-100 disabled:text-slate-500">
                {SUCURSALES.map(s => <option key={s.codigo} value={s.nombre}>{s.nombre} ({s.codigo})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-blue-950 mb-1">ID Red Azul</label>
              <input 
                type="text" value={formCliente.idRedAzul}
                onChange={(e) => setFormCliente({...formCliente, idRedAzul: e.target.value})}
                placeholder="Ej. RA-1029"
                className="w-full p-2.5 rounded-xl border border-blue-200 bg-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre del Cliente / Empresa *</label>
            <input 
              type="text" required
              value={formCliente.nombreCliente}
              onChange={(e) => setFormCliente({...formCliente, nombreCliente: e.target.value})}
              placeholder="Ej. Constructora del Centro S.A."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Cliente *</label>
              <select 
                value={formCliente.tipoCliente}
                onChange={(e) => setFormCliente({...formCliente, tipoCliente: e.target.value})}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs outline-none">
                {CAT_TIPO_CLIENTE.map(tc => <option key={tc} value={tc}>{tc}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Mercado</label>
              <input 
                type="text" value={formCliente.tipoMercado}
                onChange={(e) => setFormCliente({...formCliente, tipoMercado: e.target.value})}
                placeholder="Residencial, Comercial..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre del Responsable *</label>
              <input 
                type="text" required
                value={formCliente.responsable}
                onChange={(e) => setFormCliente({...formCliente, responsable: e.target.value})}
                placeholder="Ej. Ing. Carlos Salinas"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contacto (Teléfono)</label>
              <input 
                type="tel" value={formCliente.contacto}
                onChange={(e) => setFormCliente({...formCliente, contacto: e.target.value})}
                placeholder="443-123-4567"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" value={formCliente.correo}
              onChange={(e) => setFormCliente({...formCliente, correo: e.target.value})}
              placeholder="contacto@empresa.com"
              className="w-full p-2 rounded-xl border border-slate-200 text-xs outline-none"
            />
          </div>

          {/* DIRECCIÓN Y GEOLOCALIZACIÓN: 100% AUTOMÁTICA VÍA MAPA */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">Dirección y Geolocalización *</label>
              {formCliente.lat && formCliente.lng && (
                <span className="text-[10px] font-mono text-slate-500">
                  {formCliente.lat.toFixed(4)}, {formCliente.lng.toFixed(4)}
                </span>
              )}
            </div>

            {formCliente.ubicacionConfirmada || formCliente.direccion ? (
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                      Ubicación Verificada en Mapa
                    </p>
                    <p className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                      {formCliente.direccion || 'Ubicación seleccionada en el mapa'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAbrirMapaPicker}
                  className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cambiar ubicación en el mapa</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAbrirMapaPicker}
                className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 active:scale-98 transition-all shadow-xs">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs">Tocar para fijar ubicación en el mapa</span>
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98">
            {clienteAEditar ? 'Actualizar Cliente' : `Guardar en Catálogo (${idMostrado})`}
          </button>

        </form>
      </div>
    </div>
  );
}