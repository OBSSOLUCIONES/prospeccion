// src/lib/calendario.js
// Helper para generar links de Google Calendar sin necesidad de OAuth.

export function generarLinkGoogleCalendar({ 
  titulo, 
  descripcion, 
  ubicacion, 
  fechaInicio, 
  duracionHoras = 1 
}) {
  try {
    const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
    const fin = new Date(inicio.getTime() + duracionHoras * 60 * 60 * 1000);

    const formato = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(d.getUTCDate()).padStart(2, '0');
      const h = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      const seg = String(d.getUTCSeconds()).padStart(2, '0');
      return `${y}${m}${dia}T${h}${min}${seg}Z`;
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: titulo || 'Visita de obra',
      dates: `${formato(inicio)}/${formato(fin)}`,
      details: descripcion || '',
      location: ubicacion || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (err) {
    console.warn('Error generando link calendario:', err);
    return null;
  }
}

export function abrirGoogleCalendar(datos) {
  const link = generarLinkGoogleCalendar(datos);
  if (link) {
    window.open(link, '_blank');
    return true;
  }
  return false;
}