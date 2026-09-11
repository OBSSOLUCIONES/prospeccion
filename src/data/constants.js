// src/data/constants.js

export const SUCURSALES = [
  { nombre: 'ALTOZANO', codigo: 'ALT' },
  { nombre: 'LA MIRA', codigo: 'LMR' },
  { nombre: 'LÁZARO', codigo: 'LZC' },
  { nombre: 'PÁTZCUARO', codigo: 'PTZ' },
  { nombre: 'PERIFERICO', codigo: 'PER' },
  { nombre: 'SAN MIGUEL', codigo: 'SMA' },
  { nombre: 'URIANGATO', codigo: 'URI' },
  { nombre: 'VILLADIEGO', codigo: 'VDO' },
  { nombre: 'ZAMORA', codigo: 'ZAM' },
  { nombre: 'ZIHUATANEJO', codigo: 'ZIH' }
];

export const FASES_OBRA = [
  'PRELIMINARES',
  'CIMENTACIÓN',
  'OBRA NEGRA',
  'OBRA GRIS',
  'OBRA BLANCA',
  'PINTURA'
];

export const FASE_COLORS = {
  'PRELIMINARES': 'bg-amber-50 text-amber-800 border-amber-300',
  'CIMENTACIÓN': 'bg-orange-50 text-orange-800 border-orange-300',
  'OBRA NEGRA': 'bg-stone-100 text-stone-800 border-stone-400',
  'OBRA GRIS': 'bg-slate-100 text-slate-800 border-slate-400',
  'OBRA BLANCA': 'bg-blue-50 text-blue-800 border-blue-300',
  'PINTURA': 'bg-emerald-50 text-emerald-800 border-emerald-300',
};

// Ciclo de Vida Comercial de la Obra
export const CAT_ESTADO_OBRA = ['ACTIVA', 'PAUSADA', 'TERMINADA'];

export const CAT_TIPO_CLIENTE = ['ACTUAL', 'NUEVO', 'PROSPECTO', 'RECUPERADO'];
export const CAT_TIPO_DESARROLLO = ['OBRA NUEVA', 'AMPLIACIÓN', 'MANTENIMIENTO', 'REHABILITACIÓN', 'REMODELACIÓN'];
export const CAT_TIPO_ENTREGA = ['DOMICILIO', 'EN PISO'];
export const CAT_FORMA_PAGO = ['EFECTIVO', 'LIGA DE PAGO', 'TARJETA', 'TRANSFERENCIA', 'CRÉDITO'];
export const CAT_COMPROBANTE_VENTA = ['REMISIÓN', 'FACTURA'];
export const CAT_ACTIVIDAD_VISITA = ['SUPERVISIÓN TÉCNICA', 'LEVANTAMIENTO / MEDIDAS', 'DEMOSTRACIÓN DE PRODUCTO', 'PROSPECCIÓN INICIAL', 'ENTREGA DE MUESTRAS', 'ATENCIÓN DE RECLAMO'];

export const CLIENTES_INICIALES = [
  {
    id: 'ALT01',
    nombreCliente: 'Desarrollos Residenciales del Norte',
    tipoMercado: 'Residencial Plus',
    responsable: 'Arq. Roberto Garza',
    contacto: '8185550192',
    direccion: 'Av. Paseo Altozano 120, Altozano',
    correo: 'rgarza@desarrollosnorte.com',
    tipoCliente: 'ACTUAL',
    idRedAzul: 'RA-9942',
    sucursal: 'ALTOZANO',
    lat: 19.6642,
    lng: -101.1718,
    ubicacion: 'https://maps.google.com/?q=19.6642,-101.1718'
  },
  {
    id: 'ZIH01',
    nombreCliente: 'Costas & Desarrollos del Pacífico',
    tipoMercado: 'Comercial',
    responsable: 'Ing. Sofía Mendoza',
    contacto: '7558901234',
    direccion: 'Paseo de la Bahía 45, Zihuatanejo',
    correo: 'smendoza@costas.mx',
    tipoCliente: 'PROSPECTO',
    idRedAzul: 'RA-7810',
    sucursal: 'ZIHUATANEJO',
    lat: 17.6410,
    lng: -101.5510,
    ubicacion: 'https://maps.google.com/?q=17.6410,-101.5510'
  }
];

export const OBRAS_INICIALES = [
  {
    id: 'OBR-ALT01',
    nombre: 'Torre Residencial Altozano',
    sucursal: 'ALTOZANO',
    clienteId: 'ALT01',
    tipoDesarrollo: 'OBRA NUEVA',
    estatusFase: 'CIMENTACIÓN',
    estadoObra: 'ACTIVA',
    direccion: 'Av. Paseo Altozano 120, Altozano, Morelia',
    lat: 19.6642,
    lng: -101.1718,
    createdAt: '2026-03-20T10:00:00'
  }
];

export const VISITAS_INICIALES = [
  {
    id: 'VIS-ALT01',
    obraId: 'OBR-ALT01',
    sucursal: 'ALTOZANO',
    fecha: '2026-03-28 10:30',
    asesorNombre: 'Asesor Altozano',
    estatus: 'CIMENTACIÓN',
    actividad: 'SUPERVISIÓN TÉCNICA',
    observaciones: 'Avance conforme a lo programado. Preparando colado de zapatas para la siguiente semana.',
    fotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800'
    ],
    latGpsReal: 19.6642,
    lngGpsReal: -101.1718,
    distanciaAuditoriaMetros: 12,
    auditoriaEstado: 'en_sitio'
  }
];

export const MOVIMIENTOS_INICIALES = [
  {
    id: 'MOV-ALT01',
    obraId: 'OBR-ALT01',
    tipo: 'COTIZACION',
    comprobante: 'COTIZACIÓN',
    folio: 'COT-2026-049',
    monto: 1450000,
    estatus: 'GANADA',
    formaPago: 'N/A',
    tipoEntrega: 'DOMICILIO',
    fecha: '2026-03-22 14:00',
    documentoAdjunto: null,
    observaciones: 'Cotización inicial aprobada.',
    cotizacionOrigenId: null
  },
  {
    id: 'MOV-ALT02',
    obraId: 'OBR-ALT01',
    tipo: 'VENTA',
    comprobante: 'REMISIÓN',
    folio: 'REM-2026-112',
    monto: 480000,
    estatus: 'ENTREGADO',
    formaPago: 'EFECTIVO',
    tipoEntrega: 'DOMICILIO',
    fecha: '2026-03-27 09:15',
    documentoAdjunto: null,
    observaciones: 'Primer suministro de acero y cemento.',
    cotizacionOrigenId: 'MOV-ALT01'
  }
];

export const USUARIOS_INICIALES = [
  { id: 'USR_ALT', nombre: 'Asesor Altozano',    pin: '1001', sucursal: 'ALTOZANO',    rol: 'asesor' },
  { id: 'USR_LMR', nombre: 'Asesor La Mira',     pin: '1002', sucursal: 'LA MIRA',     rol: 'asesor' },
  { id: 'USR_LZC', nombre: 'Asesor Lázaro',      pin: '1003', sucursal: 'LÁZARO',      rol: 'asesor' },
  { id: 'USR_PTZ', nombre: 'Asesor Pátzcuaro',   pin: '1004', sucursal: 'PÁTZCUARO',   rol: 'asesor' },
  { id: 'USR_PER', nombre: 'Asesor Periférico',  pin: '1005', sucursal: 'PERIFERICO',  rol: 'asesor' },
  { id: 'USR_SMA', nombre: 'Asesor San Miguel',  pin: '1006', sucursal: 'SAN MIGUEL',  rol: 'asesor' },
  { id: 'USR_URI', nombre: 'Asesor Uriangato',   pin: '1007', sucursal: 'URIANGATO',   rol: 'asesor' },
  { id: 'USR_VDO', nombre: 'Asesor Villadiego',  pin: '1008', sucursal: 'VILLADIEGO',  rol: 'asesor' },
  { id: 'USR_ZAM', nombre: 'Asesor Zamora',      pin: '1009', sucursal: 'ZAMORA',      rol: 'asesor' },
  { id: 'USR_ZIH', nombre: 'Asesor Zihuatanejo', pin: '1010', sucursal: 'ZIHUATANEJO', rol: 'asesor' },
  { id: 'USR_DIR', nombre: 'Director General',   pin: '9999', sucursal: 'TODAS',       rol: 'admin' }
];