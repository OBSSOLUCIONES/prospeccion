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

// 1. TIPOLOGÍA / VOCACIÓN ARQUITECTÓNICA DE LA OBRA (PARA MAPA Y GOOGLE MY MAPS)
export const CAT_TIPOS_OBRA = [
  { id: 'CASA_HABITACION', label: 'CASA HABITACIÓN / RESIDENCIAL', icono: '🏠', color: '#10B981', colorKml: 'ff81b910' },
  { id: 'DESARROLLO_RESIDENCIAL', label: 'DESARROLLO RESIDENCIAL / FRACCIONAMIENTO', icono: '🏘️', color: '#0091FB', colorKml: 'fffb9100' },
  { id: 'EDIFICIO_VERTICAL', label: 'TORRE VERTICAL / DEPARTAMENTOS', icono: '🏢', color: '#6366F1', colorKml: 'fff16663' },
  { id: 'PLAZA_COMERCIAL', label: 'PLAZA COMERCIAL / LOCAL / RETAIL', icono: '🏬', color: '#F59E0B', colorKml: 'ff0b9ef5' },
  { id: 'RESTAURANTE_BAR', label: 'RESTAURANTE / BAR / CAFETERÍA', icono: '🍽️', color: '#EC4899', colorKml: 'ff9948ec' },
  { id: 'HOSPITAL_SALUD', label: 'HOSPITAL / CLÍNICA / SALUD', icono: '🏥', color: '#EF4444', colorKml: 'ff4444ef' },
  { id: 'EDUCATIVO_ESCUELA', label: 'EDUCATIVO / ESCUELA / UNIVERSIDAD', icono: '🏫', color: '#001757', colorKml: 'ff571700' },
  { id: 'HOTEL_TURISMO', label: 'HOTELERÍA / TURISMO / CABAÑAS', icono: '🏨', color: '#D97706', colorKml: 'ff0677d9' },
  { id: 'NAVE_INDUSTRIAL', label: 'NAVE INDUSTRIAL / BODEGA / CEDIS', icono: '🏭', color: '#475569', colorKml: 'ff695547' },
  { id: 'OFICINAS_CORPORATIVO', label: 'OFICINAS / CORPORATIVO / COWORKING', icono: '💼', color: '#8B5CF6', colorKml: 'fff65c8b' },
  { id: 'GASOLINERA_SERVICIO', label: 'GASOLINERA / ESTACIÓN DE SERVICIO', icono: '⛽', color: '#EAB308', colorKml: 'ff08b3ea' },
  { id: 'TEMPLO_RELIGIOSO', label: 'TEMPLO / IGLESIA / CENTRO RELIGIOSO', icono: '⛪', color: '#84CC16', colorKml: 'ff16cc84' },
  { id: 'DEPORTIVO_CLUB', label: 'DEPORTIVO / GIMNASIO / CLUB', icono: '🏟️', color: '#06B6D4', colorKml: 'ffd4b606' },
  { id: 'GOBIERNO_INFRAESTRUCTURA', label: 'GOBIERNO / INFRAESTRUCTURA PÚBLICA', icono: '🏛️', color: '#059669', colorKml: 'ff699605' },
  { id: 'USOS_MIXTOS', label: 'USOS MIXTOS (COMERCIO + VIVIENDA)', icono: '🏗️', color: '#14B8A6', colorKml: 'ffa6b814' },
  { id: 'OTRO_ESPECIAL', label: 'OTRO / PROYECTO ESPECIAL', icono: '📍', color: '#64748B', colorKml: 'ff8b7464' }
];

// 2. FASE FÍSICA CONSTRUCTIVA DEL INMUEBLE
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

// 3. EMBUDO / PIPELINE COMERCIAL OBS (10 ETAPAS DE NEGOCIO)
export const ETAPAS_COMERCIALES = [
  { id: 'PROSPECTO', label: 'Prospecto', desc: 'Primer contacto o identificación de la obra.', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { id: 'LEVANTAMIENTO', label: 'Levantamiento', desc: 'Visita técnica y toma de requerimientos en sitio.', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { id: 'PROPUESTA', label: 'Propuesta', desc: 'Entrega de fichas técnicas, especificaciones o muestras.', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  { id: 'COTIZACIÓN', label: 'Cotización', desc: 'Envío de la oferta económica inicial.', color: 'bg-purple-50 text-purple-800 border-purple-300' },
  { id: 'NEGOCIACIÓN', label: 'Negociación', desc: 'Ajuste de precios, condiciones y tiempos de entrega.', color: 'bg-amber-50 text-amber-800 border-amber-300', prefijo: '[CONDICIONES A NEGOCIAR]: ' },
  { id: 'GANADA', label: 'Ganada', desc: 'Cierre comercial y confirmación del pedido.', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', prefijo: '[ACUERDO DE CIERRE]: ' },
  { id: 'EJECUCIÓN', label: 'Ejecución', desc: 'Suministro en curso y avance regular de la obra.', color: 'bg-teal-50 text-teal-800 border-teal-300' },
  { id: 'FINALIZADA', label: 'Finalizada', desc: 'Entrega completa y cierre del proyecto.', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  { id: 'PAUSADA', label: 'Pausada', desc: 'Detenida temporalmente por cuestiones técnicas o del cliente.', color: 'bg-orange-50 text-orange-800 border-orange-300', prefijo: '[MOTIVO DE PAUSA]: ' },
  { id: 'PERDIDA', label: 'Perdida', desc: 'Asignada a un competidor o cancelada definitivamente.', color: 'bg-rose-50 text-rose-800 border-rose-300', prefijo: '[MOTIVO DE PÉRDIDA / COMPETIDOR]: ' }
];

// 4. CATÁLOGO CERRADO DE PERFIL / OFICIO DEL CLIENTE
export const CAT_PERFIL_CLIENTE = [
  'ALBAÑIL',
  'PINTOR',
  'ARQUITECTO',
  'PLOMERO',
  'CARPINTERO',
  'HERRERO',
  'ALUMINISTERO',
  'INSTALADOR DE TABLAROCA (YESERO)',
  'IMPERMEABILIZADOR',
  'INSTALADOR DE PISOS Y AZULEJOS',
  'SOLDADOR',
  'CONSTRUCTOR O MAESTRO DE OBRA',
  'CONTRATISTA O SUBCONTRATISTA',
  'DECORADOR DE INTERIORES',
  'GERENTE O SUPERVISOR DE OBRA',
  'INGENIERO CIVIL',
  'CLIENTE FINAL'
];

export const CAT_TIPO_CLIENTE = ['ACTUAL', 'NUEVO', 'PROSPECTO', 'RECUPERADO'];
export const CAT_TIPO_DESARROLLO = ['OBRA NUEVA', 'AMPLIACIÓN', 'MANTENIMIENTO', 'REHABILITACIÓN', 'REMODELACIÓN'];
export const CAT_TIPO_ENTREGA = ['DOMICILIO', 'EN PISO'];
export const CAT_FORMA_PAGO = ['EFECTIVO', 'LIGA DE PAGO', 'TARJETA', 'TRANSFERENCIA', 'CRÉDITO'];
export const CAT_COMPROBANTE_VENTA = ['REMISIÓN', 'FACTURA'];
export const CAT_ACTIVIDAD_VISITA = [
  'SUPERVISIÓN TÉCNICA',
  'LEVANTAMIENTO / MEDIDAS',
  'DEMOSTRACIÓN DE PRODUCTO',
  'PROSPECCIÓN INICIAL',
  'ENTREGA DE MUESTRAS',
  'ATENCIÓN DE RECLAMO'
];

export const CLIENTES_INICIALES = [
  {
    id: 'ALT01',
    nombreCliente: 'Desarrollos Residenciales del Norte',
    tipoMercado: 'CONTRATISTA O SUBCONTRATISTA',
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
    tipoMercado: 'CONSTRUCTOR O MAESTRO DE OBRA',
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
    tipoObra: 'EDIFICIO_VERTICAL',
    tipoDesarrollo: 'OBRA NUEVA',
    estatusFase: 'CIMENTACIÓN',
    etapaComercial: 'COTIZACIÓN',
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
    etapaComercial: 'COTIZACIÓN',
    actividad: 'SUPERVISIÓN TÉCNICA',
    observaciones: 'Avance conforme a lo programado. Preparando colado de zapatas para la siguiente semana.',
    fotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'
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
    observaciones: 'Primer suministro de perfiles y fijación.',
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