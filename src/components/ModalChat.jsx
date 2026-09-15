// src/components/ModalChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Send, ArrowLeft, MessageCircle, Search, 
  Mic, MicOff, Check, CheckCheck, User, Trash2
} from 'lucide-react';
import { 
  enviarMensajeDB, 
  obtenerConversacionDB, 
  obtenerTodosLosMensajesDB,
  marcarComoLeidosDB,
  suscribirMensajesEnVivo 
} from '../lib/chat';
import { iniciarDictado } from '../lib/dictado';
import { notificarToast } from '../lib/supabase';

function formatearHora(fechaISO) {
  if (!fechaISO) return '';
  try {
    const d = new Date(fechaISO);
    const hoy = new Date();
    const mismoDia = d.toDateString() === hoy.toDateString();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    if (mismoDia) return `${h}:${m}`;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes} ${h}:${m}`;
  } catch {
    return '';
  }
}

function agruparPorContacto(mensajes, usuarioId) {
  const contactos = new Map();
  for (const m of mensajes) {
    const esEmisor = m.emisor_id === usuarioId;
    const contactoId = esEmisor ? m.receptor_id : m.emisor_id;
    const contactoNombre = esEmisor ? m.receptor_nombre : m.emisor_nombre;
    const contactoSucursal = esEmisor ? null : m.emisor_sucursal;
    
    if (!contactos.has(contactoId)) {
      contactos.set(contactoId, {
        id: contactoId,
        nombre: contactoNombre || contactoId,
        sucursal: contactoSucursal,
        ultimoMensaje: m.contenido,
        ultimaFecha: m.created_at,
        noLeidos: 0
      });
    }
    const c = contactos.get(contactoId);
    if (!esEmisor && !m.leido) {
      c.noLeidos = (c.noLeidos || 0) + 1;
    }
    if (new Date(m.created_at) > new Date(c.ultimaFecha)) {
      c.ultimoMensaje = m.contenido;
      c.ultimaFecha = m.created_at;
    }
  }
  return Array.from(contactos.values()).sort((a, b) => 
    new Date(b.ultimaFecha) - new Date(a.ultimaFecha)
  );
}

export default function ModalChat({ 
  isOpen, 
  onClose, 
  usuarioActivo, 
  usuarios = [],
  onNuevoMensaje
}) {
  const [vista, setVista] = useState('lista'); // 'lista' | 'conversacion' | 'nuevo'
  const [contactoActivo, setContactoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [todosMensajes, setTodosMensajes] = useState([]);
  const [textoNuevo, setTextoNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const dictadoRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar todos los mensajes al abrir
  const cargarTodosMensajes = useCallback(async () => {
    if (!usuarioActivo) return;
    setCargando(true);
    const data = await obtenerTodosLosMensajesDB(usuarioActivo.id);
    setTodosMensajes(data);
    setCargando(false);
  }, [usuarioActivo]);

  useEffect(() => {
    if (isOpen && usuarioActivo) {
      cargarTodosMensajes();
    }
  }, [isOpen, usuarioActivo, cargarTodosMensajes]);

  // Suscribirse a mensajes en vivo
  useEffect(() => {
    if (!isOpen || !usuarioActivo) return;

    const desuscribir = suscribirMensajesEnVivo(usuarioActivo.id, (nuevoMensaje) => {
      setTodosMensajes(prev => [nuevoMensaje, ...prev]);
      if (contactoActivo && nuevoMensaje.emisor_id === contactoActivo.id) {
        setMensajes(prev => [...prev, nuevoMensaje]);
      }
    });

    return () => desuscribir();
  }, [isOpen, usuarioActivo, contactoActivo]);

  // Cargar conversación al abrir un contacto
  useEffect(() => {
    if (vista === 'conversacion' && contactoActivo && usuarioActivo) {
      (async () => {
        const data = await obtenerConversacionDB(usuarioActivo.id, contactoActivo.id);
        setMensajes(data);
        await marcarComoLeidosDB(contactoActivo.id, usuarioActivo.id);
      })();
    }
  }, [vista, contactoActivo, usuarioActivo]);

  // Auto-scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Cleanup del dictado
  useEffect(() => {
    return () => {
      if (dictadoRef.current) {
        try { dictadoRef.current.detener(); } catch (_) {}
        dictadoRef.current = null;
      }
    };
  }, []);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setVista('lista');
      setContactoActivo(null);
      setMensajes([]);
      setTextoNuevo('');
      setBusqueda('');
      setGrabandoVoz(false);
      if (dictadoRef.current) {
        try { dictadoRef.current.detener(); } catch (_) {}
        dictadoRef.current = null;
      }
    }
  }, [isOpen]);

  const contactos = agruparPorContacto(todosMensajes, usuarioActivo?.id);

  const usuariosDisponibles = usuarios
    .filter(u => u.id !== usuarioActivo?.id)
    .filter(u => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        u.nombre.toLowerCase().includes(q) ||
        (u.sucursal && u.sucursal.toLowerCase().includes(q))
      );
    });

  const abrirConversacion = (contacto) => {
    setContactoActivo(contacto);
    setVista('conversacion');
    setTextoNuevo('');
  };

  const abrirConversacionConUsuario = (u) => {
    abrirConversacion({
      id: u.id,
      nombre: u.nombre,
      sucursal: u.sucursal
    });
  };

  const enviar = async () => {
    const contenido = textoNuevo.trim();
    if (!contenido || !contactoActivo || enviando) return;

    if (dictadoRef.current) {
      try { dictadoRef.current.detener(); } catch (_) {}
      dictadoRef.current = null;
      setGrabandoVoz(false);
    }

    setEnviando(true);
    const tempId = `temp-${Date.now()}`;
    const mensajeOptimista = {
      id: tempId,
      emisor_id: usuarioActivo.id,
      emisor_nombre: usuarioActivo.nombre,
      emisor_sucursal: usuarioActivo.sucursal,
      receptor_id: contactoActivo.id,
      receptor_nombre: contactoActivo.nombre,
      contenido,
      created_at: new Date().toISOString(),
      leido: false,
      _optimista: true
    };
    setMensajes(prev => [...prev, mensajeOptimista]);
    setTextoNuevo('');

    const res = await enviarMensajeDB({
      emisorId: usuarioActivo.id,
      emisorNombre: usuarioActivo.nombre,
      emisorSucursal: usuarioActivo.sucursal,
      emisorRol: usuarioActivo.rol,
      receptorId: contactoActivo.id,
      receptorNombre: contactoActivo.nombre,
      contenido
    });

    if (res.ok && res.mensaje) {
      setMensajes(prev => prev.map(m => m.id === tempId ? res.mensaje : m));
      setTodosMensajes(prev => [res.mensaje, ...prev]);
    } else {
      setMensajes(prev => prev.filter(m => m.id !== tempId));
      notificarToast('⚠️ No se pudo enviar el mensaje', 'error');
      setTextoNuevo(contenido);
    }
    setEnviando(false);
  };

  const toggleDictado = async () => {
    if (grabandoVoz) {
      if (dictadoRef.current) {
        await dictadoRef.current.detener();
        dictadoRef.current = null;
      }
      setGrabandoVoz(false);
      return;
    }

    setGrabandoVoz(true);
    const instancia = await iniciarDictado({
      onTexto: (t) => setTextoNuevo(prev => prev ? `${prev} ${t}` : t),
      onError: () => {
        setGrabandoVoz(false);
        dictadoRef.current = null;
      },
      onFin: () => {
        setGrabandoVoz(false);
        dictadoRef.current = null;
      }
    });

    if (!instancia) {
      setGrabandoVoz(false);
      return;
    }
    dictadoRef.current = instancia;
  };

  if (!isOpen || !usuarioActivo) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[92vh] sm:h-[85vh] overflow-hidden border border-slate-200">

        {/* VISTA 1: LISTA DE CONVERSACIONES */}
        {vista === 'lista' && (
          <>
            <div className="p-4 bg-gradient-to-br from-[#001757] to-[#00227a] text-white shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black leading-tight">Mensajes</h2>
                    <p className="text-[11px] text-blue-200 font-semibold">
                      Chat interno con tu equipo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setVista('nuevo'); setBusqueda(''); }}
                className="w-full h-11 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center gap-2 font-black text-sm active:scale-98 transition-all">
                <Send className="w-4 h-4" />
                Nuevo mensaje
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
              {cargando && (
                <div className="p-6 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-[#0091FB] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold mt-2">Cargando mensajes...</p>
                </div>
              )}

              {!cargando && contactos.length === 0 && (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-[#0091FB]" />
                  </div>
                  <h3 className="text-base font-black text-slate-800">Sin conversaciones</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Toca "Nuevo mensaje" para contactar a un asesor o al Director.
                  </p>
                </div>
              )}

              {contactos.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => abrirConversacion(c)}
                  className="w-full p-3 bg-white rounded-2xl border border-slate-200 hover:border-[#0091FB] hover:bg-blue-50/40 flex items-center gap-3 active:scale-[0.99] transition-all text-left">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#001757] to-[#0091FB] flex items-center justify-center text-white font-black text-sm shrink-0">
                    {(c.nombre || 'US').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-slate-900 text-sm truncate">{c.nombre}</p>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">
                        {formatearHora(c.ultimaFecha)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{c.ultimoMensaje}</p>
                      {c.noLeidos > 0 && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 shrink-0">
                          {c.noLeidos}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* VISTA 2: CONVERSACIÓN */}
        {vista === 'conversacion' && contactoActivo && (
          <>
            <div className="p-3 bg-[#001757] text-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setVista('lista'); setContactoActivo(null); setMensajes([]); }}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">
                {(contactoActivo.nombre || 'US').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm truncate">{contactoActivo.nombre}</p>
                {contactoActivo.sucursal && (
                  <p className="text-[10px] text-blue-200 font-semibold truncate">
                    {contactoActivo.sucursal}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {mensajes.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-semibold">
                    Sin mensajes aún. Envía el primero 👇
                  </p>
                </div>
              )}
              {mensajes.map(m => {
                const esMio = m.emisor_id === usuarioActivo.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm ${
                      esMio 
                        ? 'bg-gradient-to-br from-[#001757] to-[#00227a] text-white rounded-br-md' 
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-snug whitespace-pre-wrap break-words">
                        {m.contenido}
                      </p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${esMio ? 'text-blue-200' : 'text-slate-400'}`}>
                        <span className="text-[10px] font-bold">
                          {formatearHora(m.created_at)}
                        </span>
                        {esMio && (
                          m._optimista 
                            ? <Check className="w-3 h-3" />
                            : m.leido 
                            ? <CheckCheck className="w-3 h-3 text-emerald-400" />
                            : <CheckCheck className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleDictado}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                  grabandoVoz 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-[#001757] border border-blue-200 hover:bg-blue-100'
                }`}>
                {grabandoVoz ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <textarea
                ref={inputRef}
                rows="1"
                value={textoNuevo}
                onChange={(e) => setTextoNuevo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="flex-1 resize-none max-h-32 px-3.5 py-3 rounded-2xl border border-slate-300 text-sm font-medium outline-none focus:border-[#0091FB] leading-snug"
                style={{ minHeight: '44px' }}
              />

              <button
                type="button"
                onClick={enviar}
                disabled={!textoNuevo.trim() || enviando}
                className="w-11 h-11 rounded-2xl bg-[#001757] hover:bg-[#00227a] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 active:scale-95 transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* VISTA 3: NUEVA CONVERSACIÓN */}
        {vista === 'nuevo' && (
          <>
            <div className="p-3 bg-[#001757] text-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setVista('lista')}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm">Nuevo mensaje</p>
                <p className="text-[10px] text-blue-200 font-semibold">
                  Elige un destinatario
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-white border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o sucursal..."
                  className="w-full h-11 pl-10 pr-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-[#0091FB] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50">
              {usuariosDisponibles.length === 0 && (
                <div className="p-8 text-center">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-700">Sin usuarios</p>
                  <p className="text-xs text-slate-500">Intenta con otra búsqueda</p>
                </div>
              )}
              {usuariosDisponibles.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => abrirConversacionConUsuario(u)}
                  className="w-full p-3 bg-white rounded-2xl border border-slate-200 hover:border-[#0091FB] hover:bg-blue-50/40 flex items-center gap-3 active:scale-[0.99] transition-all text-left">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 ${
                    u.rol === 'admin' 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-[#001757] to-[#0091FB]'
                  }`}>
                    {(u.nombre || 'US').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm truncate">{u.nombre}</p>
                    <p className="text-[11px] text-slate-500 font-semibold truncate">
                      {u.rol === 'admin' ? '👑 Director General' : `Asesor • ${u.sucursal}`}
                    </p>
                  </div>
                  {u.rol === 'admin' && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                      DIRECTOR
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}